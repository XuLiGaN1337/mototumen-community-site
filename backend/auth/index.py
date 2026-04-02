"""
Business: User authentication + profiles + garage + friends + photos
Args: event with httpMethod, body, headers with X-Auth-Token; context with request_id  
Returns: HTTP response with auth tokens, user data, profiles, vehicles, friends, photos data
"""
import json
import os
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
import urllib.request
import boto3
import jwt
import requests

TELEGRAM_CHANNELS = [
    "-1002441055201",  # Numeric chat_id (supergroup)
]

def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn, cursor_factory=RealDictCursor)

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def generate_token() -> str:
    return secrets.token_urlsafe(32)

def get_header(headers: Dict[str, Any], name: str) -> Optional[str]:
    """Get header value case-insensitive"""
    name_lower = name.lower()
    for key, value in headers.items():
        if key.lower() == name_lower:
            return value
    return None

def get_user_from_token(cur, token: str) -> Optional[Dict]:
    cur.execute(
        f"""
        SELECT u.id, u.email, u.name
        FROM users u
        JOIN user_sessions s ON u.id = s.user_id
        WHERE s.token = '{token}' AND s.expires_at > NOW()
        """
    )
    return cur.fetchone()

def notify_ceo(message: str, notification_type: str = 'info'):
    notify_url = os.environ.get('NOTIFY_CEO_URL')
    if not notify_url:
        print("NOTIFY_CEO_URL not configured")
        return
    
    try:
        requests.post(
            notify_url,
            json={'message': message, 'type': notification_type},
            timeout=5
        )
    except Exception as e:
        print(f"Failed to notify CEO: {e}")

def check_channel_subscription(user_id: int, username: str = None) -> bool:
    """Check if user is subscribed to MotoTyumen group - tries all channel variants"""
    bot_token = os.environ.get('TELEGRAM_BOT_TOKEN_AUTH')
    if not bot_token:
        print("[CHECK_SUBSCRIPTION] TELEGRAM_BOT_TOKEN_AUTH not set, allowing auth")
        return True
    
    print(f"[CHECK_SUBSCRIPTION] Checking user {user_id} in MotoTyumen group")
    
    got_valid_response = False
    
    for channel_id in TELEGRAM_CHANNELS:
        print(f"[CHECK_SUBSCRIPTION] Trying channel variant: {channel_id}")
        
        try:
            url = f"https://api.telegram.org/bot{bot_token}/getChatMember?chat_id={channel_id}&user_id={user_id}"
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            
            with urllib.request.urlopen(req, timeout=5) as response:
                response_text = response.read().decode()
                data = json.loads(response_text)
                
                if data.get('ok'):
                    got_valid_response = True
                    status = data.get('result', {}).get('status', '')
                    is_member = status in ['member', 'administrator', 'creator']
                    
                    print(f"[CHECK_SUBSCRIPTION] ✅ SUCCESS with {channel_id}: user_id={user_id}, status={status}, is_member={is_member}")
                    
                    if is_member:
                        return True
                    if status in ['left', 'kicked']:
                        print(f"[CHECK_SUBSCRIPTION] User explicitly not in group: {status}")
                        return False
                else:
                    error_desc = data.get('description', 'Unknown error')
                    print(f"[CHECK_SUBSCRIPTION] ❌ FAILED {channel_id}: {error_desc}")
                
        except urllib.error.HTTPError as e:
            error_body = e.read().decode() if hasattr(e, 'read') else 'no body'
            print(f"[CHECK_SUBSCRIPTION] ❌ HTTPError for {channel_id}: code={e.code}, body={error_body}")
        except Exception as e:
            print(f"[CHECK_SUBSCRIPTION] ❌ Error with {channel_id}: {e}")
    
    if not got_valid_response:
        print(f"[CHECK_SUBSCRIPTION] ⚠️ ALL API CALLS FAILED — allowing auth (bot config issue)")
        return True
    
    print(f"[CHECK_SUBSCRIPTION] ❌ User {user_id} not found in group")
    return False

def upload_avatar_to_s3(photo_url: str, user_id: int) -> Optional[str]:
    """Download avatar from URL and upload to S3"""
    if not photo_url or not photo_url.startswith('http'):
        return None
    
    try:
        req = urllib.request.Request(photo_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as response:
            image_data = response.read()
        
        file_hash = hashlib.md5(image_data).hexdigest()[:8]
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        key = f"avatars/{user_id}_{timestamp}_{file_hash}.jpg"
        
        access_key = os.environ.get('AWS_ACCESS_KEY_ID')
        secret_key = os.environ.get('AWS_SECRET_ACCESS_KEY')
        
        s3 = boto3.client(
            's3',
            endpoint_url='https://bucket.poehali.dev',
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
        )
        
        s3.put_object(
            Bucket='files',
            Key=key,
            Body=image_data,
            ContentType='image/jpeg',
        )
        
        return f"https://cdn.poehali.dev/projects/{access_key}/bucket/{key}"
    except Exception as e:
        print(f"[AVATAR UPLOAD ERROR] {str(e)}")
        return None

def move_avatar_to_photos(cur, user_id: int):
    """Move current avatar to user_photos before replacing — only if not already there (max 3 photos)"""
    cur.execute("SELECT avatar_url FROM user_profiles WHERE user_id = %s", (user_id,))
    row = cur.fetchone()
    if row and row['avatar_url'] and row['avatar_url'].startswith('http'):
        # Не дублируем — проверяем что такого фото ещё нет в галерее
        cur.execute("SELECT id FROM user_photos WHERE user_id = %s AND photo_url = %s", (user_id, row['avatar_url']))
        already_exists = cur.fetchone()
        if already_exists:
            return
        cur.execute(f"SELECT COUNT(*) as cnt FROM user_photos WHERE user_id = {user_id}")
        cnt = cur.fetchone()
        if cnt and cnt['cnt'] >= 3:
            cur.execute(f"SELECT id FROM user_photos WHERE user_id = {user_id} ORDER BY created_at ASC LIMIT 1")
            oldest = cur.fetchone()
            if oldest:
                cur.execute(f"DELETE FROM user_photos WHERE id = {oldest['id']}")
        cur.execute(
            "INSERT INTO user_photos (user_id, photo_url, source) VALUES (%s, %s, 'avatar')",
            (user_id, row['avatar_url'])
        )

def get_telegram_photo_url(bot_token: str, telegram_id: int) -> Optional[str]:
    """Get user's current profile photo URL from Telegram API"""
    try:
        url = f"https://api.telegram.org/bot{bot_token}/getUserProfilePhotos?user_id={telegram_id}&limit=1"
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode())
        
        if not data.get('ok') or data['result']['total_count'] == 0:
            return None
        
        file_id = data['result']['photos'][0][-1]['file_id']
        
        url2 = f"https://api.telegram.org/bot{bot_token}/getFile?file_id={file_id}"
        req2 = urllib.request.Request(url2)
        with urllib.request.urlopen(req2, timeout=5) as resp2:
            file_data = json.loads(resp2.read().decode())
        
        if not file_data.get('ok'):
            return None
        
        file_path = file_data['result']['file_path']
        return f"https://api.telegram.org/file/bot{bot_token}/{file_path}"
    except Exception as e:
        print(f"[GET_TG_PHOTO] Error: {e}")
        return None

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers = event.get('headers', {})
    token = get_header(headers, 'X-Auth-Token')
    query_params = event.get('queryStringParameters') or {}
    
    # DEBUG: Check channel info
    if method == 'GET' and query_params.get('debug') == 'channel':
        bot_token = os.environ.get('TELEGRAM_BOT_TOKEN_AUTH')
        if not bot_token:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'TELEGRAM_BOT_TOKEN_AUTH not set'}),
                'isBase64Encoded': False
            }
        
        results = {}
        
        # Check all channel variants
        for idx, channel_id in enumerate(TELEGRAM_CHANNELS):
            variant_result = {'channel_id': channel_id}
            
            try:
                # Get chat info
                chat_url = f"https://api.telegram.org/bot{bot_token}/getChat?chat_id={channel_id}"
                with urllib.request.urlopen(urllib.request.Request(chat_url), timeout=5) as response:
                    variant_result['chat_info'] = json.loads(response.read().decode())
            except Exception as e:
                variant_result['chat_info_error'] = str(e)
            
            try:
                # Get bot info
                bot_info_url = f"https://api.telegram.org/bot{bot_token}/getMe"
                with urllib.request.urlopen(urllib.request.Request(bot_info_url), timeout=5) as response:
                    bot_me = json.loads(response.read().decode())
                    bot_user_id = bot_me.get('result', {}).get('id')
                    variant_result['bot_user_id'] = bot_user_id
                
                # Check bot as member
                bot_member_url = f"https://api.telegram.org/bot{bot_token}/getChatMember?chat_id={channel_id}&user_id={bot_user_id}"
                with urllib.request.urlopen(urllib.request.Request(bot_member_url), timeout=5) as response:
                    variant_result['bot_member_info'] = json.loads(response.read().decode())
            except Exception as e:
                variant_result['bot_member_error'] = str(e)
            
            try:
                # Check your user (5739678128)
                your_member_url = f"https://api.telegram.org/bot{bot_token}/getChatMember?chat_id={channel_id}&user_id=5739678128"
                with urllib.request.urlopen(urllib.request.Request(your_member_url), timeout=5) as response:
                    variant_result['your_member_info'] = json.loads(response.read().decode())
            except Exception as e:
                variant_result['your_member_error'] = str(e)
            
            results[f'variant_{idx}_{channel_id}'] = variant_result
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(results, ensure_ascii=False, indent=2),
            'isBase64Encoded': False
        }
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        user = None
        if token:
            user = get_user_from_token(cur, token)
        
        # === AUTHENTICATION ENDPOINTS ===
        if method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'verify_jwt_token':
                jwt_token = body.get('token')
                
                if not jwt_token:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Token required'}),
                        'isBase64Encoded': False
                    }
                
                try:
                    jwt_secret = os.environ.get('JWT_SECRET_KEY', 'твой_секретный_ключ_123')
                    payload = jwt.decode(jwt_token, jwt_secret, algorithms=['HS256'])
                    
                    telegram_id = int(payload.get('id'))
                    first_name = payload.get('first_name')
                    last_name = payload.get('last_name')
                    username = payload.get('username')
                    
                    if not check_channel_subscription(telegram_id, username):
                        return {
                            'statusCode': 403,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({
                                'error': 'subscription_required',
                                'message': 'Для авторизации необходимо вступить в группу @MotoTyumen'
                            }),
                            'isBase64Encoded': False
                        }
                    
                    cur.execute(
                        "SELECT id, name, email, role FROM users WHERE telegram_id = %s",
                        (telegram_id,)
                    )
                    auth_user = cur.fetchone()
                    
                    if auth_user:
                        # Обновляем аватар только если у пользователя ещё нет своего из S3
                        cur.execute("SELECT avatar_url FROM user_profiles WHERE user_id = %s", (auth_user['id'],))
                        current_profile = cur.fetchone()
                        has_s3_avatar = current_profile and current_profile.get('avatar_url') and 'cdn.poehali.dev' in (current_profile.get('avatar_url') or '')
                        if not has_s3_avatar:
                            bot_token_for_photo = os.environ.get('TELEGRAM_BOT_TOKEN_AUTH') or os.environ.get('TELEGRAM_BOT_TOKEN')
                            tg_photo = get_telegram_photo_url(bot_token_for_photo, telegram_id) if bot_token_for_photo else None
                            if tg_photo:
                                s3_url = upload_avatar_to_s3(tg_photo, auth_user['id'])
                                if s3_url:
                                    cur.execute("UPDATE user_profiles SET avatar_url = %s WHERE user_id = %s", (s3_url, auth_user['id']))
                        
                        new_token = generate_token()
                        expires_at = datetime.now() + timedelta(days=30)
                        
                        cur.execute(
                            "INSERT INTO user_sessions (user_id, token, expires_at) VALUES (%s, %s, %s)",
                            (auth_user['id'], new_token, expires_at)
                        )
                        conn.commit()
                        
                        return {
                            'statusCode': 200,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({
                                'token': new_token,
                                'user': {
                                    'id': auth_user['id'],
                                    'name': auth_user['name'],
                                    'email': auth_user['email'],
                                    'role': auth_user['role'],
                                    'telegram_id': telegram_id,
                                    'first_name': first_name,
                                    'last_name': last_name,
                                    'username': username
                                }
                            }),
                            'isBase64Encoded': False
                        }
                    else:
                        name = first_name + (f' {last_name}' if last_name else '')
                        
                        cur.execute(
                            "INSERT INTO users (telegram_id, name, first_name, last_name, username, email, password_hash, role) VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id, name, email, role",
                            (telegram_id, name, first_name, last_name, username, f'tg_{telegram_id}@telegram.user', '', 'user')
                        )
                        auth_user = cur.fetchone()
                        
                        cur.execute(
                            "INSERT INTO user_profiles (user_id, telegram) VALUES (%s, %s)",
                            (auth_user['id'], username)
                        )
                        
                        new_token = generate_token()
                        expires_at = datetime.now() + timedelta(days=30)
                        
                        cur.execute(
                            "INSERT INTO user_sessions (user_id, token, expires_at) VALUES (%s, %s, %s)",
                            (auth_user['id'], new_token, expires_at)
                        )
                        conn.commit()
                        
                        notify_ceo(
                            f"🎉 <b>Новая регистрация</b>\n\n"
                            f"Пользователь: {name}\n"
                            f"Telegram: @{username if username else 'не указан'}\n"
                            f"ID: {auth_user['id']}",
                            'new_user'
                        )
                        
                        return {
                            'statusCode': 201,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({
                                'token': new_token,
                                'user': {
                                    'id': auth_user['id'],
                                    'name': auth_user['name'],
                                    'email': auth_user['email'],
                                    'role': auth_user['role'],
                                    'telegram_id': telegram_id,
                                    'first_name': first_name,
                                    'last_name': last_name,
                                    'username': username
                                }
                            }),
                            'isBase64Encoded': False
                        }
                        
                except jwt.ExpiredSignatureError:
                    return {
                        'statusCode': 401,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Token expired'}),
                        'isBase64Encoded': False
                    }
                except jwt.InvalidTokenError as e:
                    return {
                        'statusCode': 401,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': f'Invalid token: {str(e)}'}),
                        'isBase64Encoded': False
                    }
            
            if action == 'telegram_auth':
                telegram_id = body.get('telegram_id')
                first_name = body.get('first_name')
                last_name = body.get('last_name')
                username = body.get('username')
                photo_url = body.get('photo_url', '')
                print(f'[TELEGRAM AUTH] telegram_id={telegram_id}, photo_url={photo_url}')
                
                if not telegram_id or not first_name:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'telegram_id and first_name required'}),
                        'isBase64Encoded': False
                    }
                
                if not check_channel_subscription(telegram_id):
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({
                            'error': 'subscription_required',
                            'message': 'Для авторизации необходимо вступить в группу @MotoTyumen'
                        }),
                        'isBase64Encoded': False
                    }
                
                cur.execute(
                    "SELECT id, name, email, role FROM users WHERE telegram_id = %s",
                    (telegram_id,)
                )
                auth_user = cur.fetchone()
                
                if auth_user:
                    # Обновляем аватар только если у пользователя ещё нет своего из S3
                    cur.execute("SELECT avatar_url FROM user_profiles WHERE user_id = %s", (auth_user['id'],))
                    current_profile = cur.fetchone()
                    has_s3_avatar = current_profile and current_profile.get('avatar_url') and 'cdn.poehali.dev' in (current_profile.get('avatar_url') or '')
                    if not has_s3_avatar:
                        bot_token = os.environ.get('TELEGRAM_BOT_TOKEN_AUTH') or os.environ.get('TELEGRAM_BOT_TOKEN')
                        tg_photo = get_telegram_photo_url(bot_token, telegram_id) if bot_token else None
                        actual_photo = tg_photo or photo_url
                        if actual_photo:
                            s3_url = upload_avatar_to_s3(actual_photo, auth_user['id'])
                            if s3_url:
                                cur.execute("UPDATE user_profiles SET avatar_url = %s WHERE user_id = %s", (s3_url, auth_user['id']))

                    if username:
                        cur.execute("UPDATE user_profiles SET telegram = %s WHERE user_id = %s", (username, auth_user['id']))
                    
                    new_token = generate_token()
                    expires_at = datetime.now() + timedelta(days=30)
                    
                    cur.execute(
                        "INSERT INTO user_sessions (user_id, token, expires_at) VALUES (%s, %s, %s)",
                        (auth_user['id'], new_token, expires_at)
                    )
                    conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({
                            'token': new_token,
                            'user': {
                                'id': auth_user['id'],
                                'name': auth_user['name'],
                                'email': auth_user['email'],
                                'role': auth_user['role']
                            }
                        }),
                        'isBase64Encoded': False
                    }
                else:
                    name = first_name + (f' {last_name}' if last_name else '')
                    
                    cur.execute(
                        "INSERT INTO users (telegram_id, name, first_name, last_name, username, email, password_hash, role) VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id, name, email, role",
                        (telegram_id, name, first_name, last_name, username, f'tg_{telegram_id}@telegram.user', '', 'user')
                    )
                    auth_user = cur.fetchone()
                    
                    s3_avatar_url = None
                    if photo_url:
                        s3_avatar_url = upload_avatar_to_s3(photo_url, auth_user['id'])
                    avatar_to_save = s3_avatar_url if s3_avatar_url else photo_url
                    
                    cur.execute(
                        "INSERT INTO user_profiles (user_id, avatar_url, telegram) VALUES (%s, %s, %s)",
                        (auth_user['id'], avatar_to_save, username)
                    )
                    
                    new_token = generate_token()
                    expires_at = datetime.now() + timedelta(days=30)
                    
                    cur.execute(
                        "INSERT INTO user_sessions (user_id, token, expires_at) VALUES (%s, %s, %s)",
                        (auth_user['id'], new_token, expires_at)
                    )
                    
                    conn.commit()
                    
                    return {
                        'statusCode': 201,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({
                            'token': new_token,
                            'user': {
                                'id': auth_user['id'],
                                'name': auth_user['name'],
                                'email': auth_user['email'],
                                'role': auth_user['role']
                            }
                        }),
                        'isBase64Encoded': False
                    }
            
            elif action == 'yandex_auth':
                yandex_code = body.get('code')
                redirect_uri = body.get('redirect_uri')
                
                if not yandex_code:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'code required'}),
                        'isBase64Encoded': False
                    }
                
                client_id = os.environ.get('YANDEX_CLIENT_ID')
                client_secret = os.environ.get('YANDEX_CLIENT_SECRET')
                
                token_resp = requests.post(
                    'https://oauth.yandex.ru/token',
                    data={
                        'grant_type': 'authorization_code',
                        'code': yandex_code,
                        'client_id': client_id,
                        'client_secret': client_secret,
                        'redirect_uri': redirect_uri,
                    },
                    timeout=10
                )
                
                if token_resp.status_code != 200:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Yandex token exchange failed', 'details': token_resp.text}),
                        'isBase64Encoded': False
                    }
                
                ya_token = token_resp.json().get('access_token')
                
                info_resp = requests.get(
                    'https://login.yandex.ru/info',
                    headers={'Authorization': f'OAuth {ya_token}'},
                    params={'format': 'json'},
                    timeout=10
                )
                
                if info_resp.status_code != 200:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Yandex userinfo failed'}),
                        'isBase64Encoded': False
                    }
                
                ya_info = info_resp.json()
                yandex_id = str(ya_info.get('id'))
                ya_login = ya_info.get('login', '')
                ya_display_name = ya_info.get('display_name') or ya_info.get('real_name') or ya_login
                ya_first_name = ya_info.get('first_name', '')
                ya_last_name = ya_info.get('last_name', '')
                ya_name = ya_display_name or f"{ya_first_name} {ya_last_name}".strip() or ya_login
                ya_gender_raw = ya_info.get('sex', '')
                ya_gender = 'female' if ya_gender_raw == 'female' else ('male' if ya_gender_raw == 'male' else None)
                ya_email = ya_info.get('default_email', f'ya_{yandex_id}@yandex.user')
                ya_phone = ya_info.get('default_phone', {}).get('number') if isinstance(ya_info.get('default_phone'), dict) else None
                ya_birthday = ya_info.get('birthday')
                ya_avatar_id = ya_info.get('default_avatar_id')
                ya_photo_url = f"https://avatars.yandex.net/get-yapic/{ya_avatar_id}/islands-200" if ya_avatar_id else None

                cur.execute("SELECT id, name, email, role FROM users WHERE yandex_id = %s", (yandex_id,))
                auth_user = cur.fetchone()
                
                if auth_user:
                    cur.execute(
                        "UPDATE users SET yandex_login = %s, yandex_display_name = %s WHERE id = %s",
                        (ya_login, ya_display_name, auth_user['id'])
                    )
                    profile_updates = []
                    profile_vals = []
                    if ya_phone:
                        profile_updates.append("yandex_phone = %s")
                        profile_vals.append(ya_phone)
                    if ya_birthday:
                        try:
                            datetime.strptime(ya_birthday, '%Y-%m-%d')
                            profile_updates.append("birthdate = %s")
                            profile_vals.append(ya_birthday)
                        except Exception:
                            pass
                    if ya_gender:
                        profile_updates.append("gender = %s")
                        profile_vals.append(ya_gender)
                    if profile_updates:
                        profile_vals.append(auth_user['id'])
                        cur.execute(f"UPDATE user_profiles SET {', '.join(profile_updates)} WHERE user_id = %s", profile_vals)

                    if ya_photo_url:
                        move_avatar_to_photos(cur, auth_user['id'])
                        s3_url = upload_avatar_to_s3(ya_photo_url, auth_user['id'])
                        if s3_url:
                            cur.execute("UPDATE user_profiles SET avatar_url = %s WHERE user_id = %s", (s3_url, auth_user['id']))
                    
                    new_token = generate_token()
                    expires_at = datetime.now() + timedelta(days=30)
                    cur.execute(
                        "INSERT INTO user_sessions (user_id, token, expires_at) VALUES (%s, %s, %s)",
                        (auth_user['id'], new_token, expires_at)
                    )
                    conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({
                            'token': new_token,
                            'user': {
                                'id': auth_user['id'],
                                'name': auth_user['name'],
                                'email': auth_user['email'],
                                'role': auth_user['role']
                            }
                        }),
                        'isBase64Encoded': False
                    }
                else:
                    cur.execute(
                        "INSERT INTO users (yandex_id, yandex_login, yandex_display_name, name, email, password_hash, role) VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id, name, email, role",
                        (yandex_id, ya_login, ya_display_name, ya_name, ya_email, '', 'user')
                    )
                    auth_user = cur.fetchone()
                    
                    cur.execute("INSERT INTO user_profiles (user_id) VALUES (%s)", (auth_user['id'],))

                    profile_updates = []
                    profile_vals = []
                    if ya_phone:
                        profile_updates.append("yandex_phone = %s")
                        profile_vals.append(ya_phone)
                    if ya_birthday:
                        try:
                            datetime.strptime(ya_birthday, '%Y-%m-%d')
                            profile_updates.append("birthdate = %s")
                            profile_vals.append(ya_birthday)
                        except Exception:
                            pass
                    if ya_gender:
                        profile_updates.append("gender = %s")
                        profile_vals.append(ya_gender)
                    if profile_updates:
                        profile_vals.append(auth_user['id'])
                        cur.execute(f"UPDATE user_profiles SET {', '.join(profile_updates)} WHERE user_id = %s", profile_vals)

                    if ya_photo_url:
                        s3_url = upload_avatar_to_s3(ya_photo_url, auth_user['id'])
                        if s3_url:
                            cur.execute("UPDATE user_profiles SET avatar_url = %s WHERE user_id = %s", (s3_url, auth_user['id']))
                    
                    new_token = generate_token()
                    expires_at = datetime.now() + timedelta(days=30)
                    cur.execute(
                        "INSERT INTO user_sessions (user_id, token, expires_at) VALUES (%s, %s, %s)",
                        (auth_user['id'], new_token, expires_at)
                    )
                    conn.commit()
                    
                    notify_ceo(
                        f"🎉 <b>Новая регистрация (Яндекс)</b>\n\nПользователь: {ya_name}\nЛогин: {ya_login}\nEmail: {ya_email}\nID: {auth_user['id']}",
                        'new_user'
                    )
                    
                    return {
                        'statusCode': 201,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({
                            'token': new_token,
                            'user': {
                                'id': auth_user['id'],
                                'name': auth_user['name'],
                                'email': auth_user['email'],
                                'role': auth_user['role']
                            }
                        }),
                        'isBase64Encoded': False
                    }

            elif action == 'link_yandex':
                if not user:
                    return {
                        'statusCode': 401,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Auth required'}),
                        'isBase64Encoded': False
                    }
                
                yandex_code = body.get('code')
                redirect_uri = body.get('redirect_uri')
                client_id = os.environ.get('YANDEX_CLIENT_ID')
                client_secret = os.environ.get('YANDEX_CLIENT_SECRET')
                
                token_resp = requests.post(
                    'https://oauth.yandex.ru/token',
                    data={
                        'grant_type': 'authorization_code',
                        'code': yandex_code,
                        'client_id': client_id,
                        'client_secret': client_secret,
                        'redirect_uri': redirect_uri,
                    },
                    timeout=10
                )
                
                if token_resp.status_code != 200:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Yandex token exchange failed'}),
                        'isBase64Encoded': False
                    }
                
                ya_token = token_resp.json().get('access_token')
                info_resp = requests.get(
                    'https://login.yandex.ru/info',
                    headers={'Authorization': f'OAuth {ya_token}'},
                    params={'format': 'json'},
                    timeout=10
                )
                ya_info = info_resp.json()
                yandex_id = str(ya_info.get('id'))
                
                cur.execute("SELECT id FROM users WHERE yandex_id = %s AND id != %s", (yandex_id, user['id']))
                already_used = cur.fetchone()
                if already_used:
                    return {
                        'statusCode': 409,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Этот Яндекс аккаунт уже привязан к другому профилю'}),
                        'isBase64Encoded': False
                    }
                
                ya_login = ya_info.get('login', '')
                ya_display_name = ya_info.get('display_name') or ya_info.get('real_name') or ya_login
                cur.execute(
                    "UPDATE users SET yandex_id = %s, yandex_login = %s, yandex_display_name = %s WHERE id = %s",
                    (yandex_id, ya_login, ya_display_name, user['id'])
                )
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'message': 'Яндекс аккаунт привязан'}),
                    'isBase64Encoded': False
                }

            elif action == 'link_telegram':
                if not user:
                    return {
                        'statusCode': 401,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Auth required'}),
                        'isBase64Encoded': False
                    }
                telegram_id = body.get('telegram_id')
                tg_username = body.get('username')
                tg_first_name = body.get('first_name')
                tg_last_name = body.get('last_name')
                if not telegram_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'telegram_id required'}),
                        'isBase64Encoded': False
                    }
                cur.execute("SELECT id FROM users WHERE telegram_id = %s AND id != %s", (telegram_id, user['id']))
                already_used = cur.fetchone()
                if already_used:
                    return {
                        'statusCode': 409,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Этот Telegram уже привязан к другому профилю'}),
                        'isBase64Encoded': False
                    }
                cur.execute(
                    "UPDATE users SET telegram_id = %s, username = %s, first_name = %s, last_name = %s WHERE id = %s",
                    (telegram_id, tg_username, tg_first_name, tg_last_name, user['id'])
                )
                if tg_username:
                    cur.execute("UPDATE user_profiles SET telegram = %s WHERE user_id = %s", (tg_username, user['id']))
                conn.commit()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'message': 'Telegram привязан'}),
                    'isBase64Encoded': False
                }

            elif action == 'logout':
                logout_token = get_header(event.get('headers', {}), 'X-Auth-Token')
                
                if logout_token:
                    cur.execute("DELETE FROM user_sessions WHERE token = %s", (logout_token,))
                    conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'message': 'Logged out'}),
                    'isBase64Encoded': False
                }
        
        # === GET LINKED ACCOUNTS ===
        if method == 'GET' and query_params.get('action') == 'linked_accounts':
            if not user:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Auth required'}),
                    'isBase64Encoded': False
                }
            cur.execute(
                "SELECT telegram_id, username AS telegram_username, yandex_id, yandex_login, yandex_display_name FROM users WHERE id = %s",
                (user['id'],)
            )
            linked = cur.fetchone()
            cur.execute(
                "SELECT phone, birthdate, yandex_phone, gender FROM user_profiles WHERE user_id = %s",
                (user['id'],)
            )
            prof = cur.fetchone()
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'telegram': {
                        'linked': bool(linked and linked['telegram_id']),
                        'username': linked['telegram_username'] if linked else None,
                    },
                    'yandex': {
                        'linked': bool(linked and linked['yandex_id']),
                        'login': linked['yandex_login'] if linked else None,
                        'display_name': linked['yandex_display_name'] if linked else None,
                    },
                    'profile': {
                        'birthdate': str(prof['birthdate']) if prof and prof.get('birthdate') else None,
                        'yandex_phone': prof['yandex_phone'] if prof else None,
                        'gender': prof['gender'] if prof else None,
                    }
                }, default=str),
                'isBase64Encoded': False
            }

        # === VERIFY TOKEN (GET /auth?verify=true) ===
        if method == 'GET' and query_params.get('verify') == 'true':
            print(f"[AUTH GET VERIFY] Headers: {list(headers.keys())}")
            print(f"[AUTH GET VERIFY] Token extracted: {token[:20] if token else None}...")
            
            if not token:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'No token provided'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                """
                SELECT u.id, u.email, u.name, u.role, u.created_at, u.username,
                       p.callsign, p.avatar_url, p.phone, p.bio, p.location, p.gender
                FROM users u
                JOIN user_sessions s ON u.id = s.user_id
                LEFT JOIN user_profiles p ON u.id = p.user_id
                WHERE s.token = %s AND s.expires_at > NOW()
                """,
                (token,)
            )
            verify_user = cur.fetchone()
            
            if not verify_user:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Invalid or expired token'}),
                    'isBase64Encoded': False
                }
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'user': {
                        'id': verify_user['id'],
                        'email': verify_user['email'],
                        'name': verify_user['name'],
                        'role': verify_user['role'],
                        'callsign': verify_user.get('callsign'),
                        'avatar_url': verify_user.get('avatar_url'),
                        'phone': verify_user.get('phone'),
                        'bio': verify_user.get('bio'),
                        'location': verify_user.get('location'),
                        'gender': verify_user.get('gender'),
                        'username': verify_user.get('username'),
                    }
                }),
                'isBase64Encoded': False
            }
        
        # === GARAGE (vehicles) ===
        if 'vehicle' in path or query_params.get('action') == 'garage':
            if method == 'GET':
                user_id = query_params.get('user_id') or (user and user['id'])
                if not user_id:
                    return {'statusCode': 401, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Auth required'}), 'isBase64Encoded': False}
                
                cur.execute(f"SELECT * FROM user_vehicles WHERE user_id = {user_id} ORDER BY is_primary DESC, created_at DESC")
                vehicles = cur.fetchall()
                return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'vehicles': [dict(v) for v in vehicles]}, default=str), 'isBase64Encoded': False}
            
            elif method == 'POST' and user:
                try:
                    body = json.loads(event.get('body', '{}'))
                    print(f"[GARAGE POST] Body: {body}")
                    
                    vtype = body.get('vehicle_type')
                    if not vtype:
                        return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'vehicle_type required'}), 'isBase64Encoded': False}
                    
                    brand = body.get('brand', '').replace("'", "''")
                    model = body.get('model', '').replace("'", "''")
                    desc = body.get('description', '').replace("'", "''")
                    mods = body.get('modifications', '').replace("'", "''")
                    photo_url_input = body.get('photo_url', '')
                    
                    if isinstance(photo_url_input, list):
                        photo_json = json.dumps(photo_url_input)
                    elif isinstance(photo_url_input, str) and photo_url_input.strip():
                        try:
                            json.loads(photo_url_input)
                            photo_json = photo_url_input
                        except (json.JSONDecodeError, ValueError):
                            photo_json = json.dumps([photo_url_input])
                    else:
                        photo_json = '[]'
                    
                    photo_json_escaped = photo_json.replace("'", "''")
                    year = body.get('year') or 'NULL'
                    is_primary = body.get('is_primary', False)
                    mileage = body.get('mileage') or 'NULL'
                    power_hp = body.get('power_hp') or 'NULL'
                    displacement = body.get('displacement') or 'NULL'
                    
                    if is_primary:
                        cur.execute(f"UPDATE user_vehicles SET is_primary = false WHERE user_id = {user['id']}")
                    
                    sql = f"INSERT INTO user_vehicles (user_id, vehicle_type, brand, model, year, photo_url, description, is_primary, mileage, power_hp, displacement, modifications) VALUES ({user['id']}, '{vtype}', '{brand}', '{model}', {year}, '{photo_json_escaped}', '{desc}', {is_primary}, {mileage}, {power_hp}, {displacement}, '{mods}') RETURNING *"
                    print(f"[GARAGE POST] SQL: {sql}")
                    
                    cur.execute(sql)
                    vehicle = cur.fetchone()
                    conn.commit()
                    
                    vehicle_dict = {
                        'id': vehicle['id'],
                        'user_id': vehicle['user_id'],
                        'vehicle_type': vehicle['vehicle_type'],
                        'brand': vehicle['brand'],
                        'model': vehicle['model'],
                        'year': vehicle['year'],
                        'photo_url': vehicle['photo_url'],
                        'description': vehicle['description'],
                        'is_primary': vehicle['is_primary'],
                        'mileage': vehicle['mileage'],
                        'power_hp': vehicle['power_hp'],
                        'displacement': vehicle['displacement'],
                        'modifications': vehicle['modifications'],
                        'created_at': str(vehicle['created_at']) if vehicle.get('created_at') else None
                    }
                    
                    return {'statusCode': 201, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'vehicle': vehicle_dict}), 'isBase64Encoded': False}
                except Exception as e:
                    print(f"[GARAGE POST ERROR] {str(e)}")
                    return {'statusCode': 500, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': str(e)}), 'isBase64Encoded': False}
            
            elif method == 'PUT' and user:
                vid = query_params.get('vehicle_id')
                if not vid:
                    return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'vehicle_id required'}), 'isBase64Encoded': False}
                
                body = json.loads(event.get('body', '{}'))
                vtype = body.get('vehicle_type', 'moto')
                brand = body.get('brand', '').replace("'", "''")
                model = body.get('model', '').replace("'", "''")
                desc = body.get('description', '').replace("'", "''")
                mods = body.get('modifications', '').replace("'", "''")
                photo_url_input = body.get('photo_url', '')
                
                if isinstance(photo_url_input, str) and photo_url_input.startswith('['):
                    photo_json = photo_url_input
                elif isinstance(photo_url_input, list):
                    photo_json = json.dumps(photo_url_input)
                elif photo_url_input:
                    photo_json = json.dumps([photo_url_input])
                else:
                    photo_json = '[]'
                
                photo_json_escaped = photo_json.replace("'", "''")
                year = body.get('year') or 'NULL'
                mileage = body.get('mileage') or 'NULL'
                power_hp = body.get('power_hp') or 'NULL'
                displacement = body.get('displacement') or 'NULL'
                
                cur.execute(f"UPDATE user_vehicles SET vehicle_type = '{vtype}', brand = '{brand}', model = '{model}', year = {year}, photo_url = '{photo_json_escaped}', description = '{desc}', mileage = {mileage}, power_hp = {power_hp}, displacement = {displacement}, modifications = '{mods}' WHERE id = {vid} AND user_id = {user['id']} RETURNING *")
                vehicle = cur.fetchone()
                if not vehicle:
                    return {'statusCode': 404, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Not found'}), 'isBase64Encoded': False}
                
                conn.commit()
                
                vehicle_dict = {
                    'id': vehicle['id'],
                    'user_id': vehicle['user_id'],
                    'vehicle_type': vehicle['vehicle_type'],
                    'brand': vehicle['brand'],
                    'model': vehicle['model'],
                    'year': vehicle['year'],
                    'photo_url': vehicle['photo_url'],
                    'description': vehicle['description'],
                    'is_primary': vehicle['is_primary'],
                    'mileage': vehicle['mileage'],
                    'power_hp': vehicle['power_hp'],
                    'displacement': vehicle['displacement'],
                    'modifications': vehicle['modifications'],
                    'created_at': str(vehicle['created_at']) if vehicle.get('created_at') else None
                }
                
                return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'vehicle': vehicle_dict}), 'isBase64Encoded': False}
            
            elif method == 'DELETE' and user:
                vid = query_params.get('vehicle_id')
                if not vid:
                    return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'vehicle_id required'}), 'isBase64Encoded': False}
                
                cur.execute(f"DELETE FROM user_vehicles WHERE id = {vid} AND user_id = {user['id']}")
                conn.commit()
                return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'message': 'Deleted'}), 'isBase64Encoded': False}
        
        # === FRIENDS ===
        elif 'friend' in path or query_params.get('action') == 'friends':
            if method == 'GET':
                target_user_id = query_params.get('user_id')
                
                if target_user_id:
                    cur.execute(f"""
                        SELECT u.id, u.name, u.username, p.avatar_url, p.location, 'accepted' as status, f.created_at
                        FROM user_friends f
                        JOIN users u ON (CASE WHEN f.user_id = {target_user_id} THEN f.friend_id = u.id ELSE f.user_id = u.id END)
                        LEFT JOIN user_profiles p ON u.id = p.user_id
                        WHERE (f.user_id = {target_user_id} OR f.friend_id = {target_user_id}) AND f.status = 'accepted'
                        ORDER BY f.created_at DESC
                    """)
                    friends = cur.fetchall()
                    return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'friends': [dict(f) for f in friends]}, default=str), 'isBase64Encoded': False}
                
                if not user:
                    return {'statusCode': 401, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Auth required'}), 'isBase64Encoded': False}
                
                cur.execute(f"""
                    SELECT u.id, u.name, u.username, p.avatar_url, p.location, f.status, f.created_at,
                    CASE WHEN f.user_id = {user['id']} THEN 'sent' ELSE 'received' END as direction
                    FROM user_friends f
                    JOIN users u ON (CASE WHEN f.user_id = {user['id']} THEN f.friend_id = u.id ELSE f.user_id = u.id END)
                    LEFT JOIN user_profiles p ON u.id = p.user_id
                    WHERE (f.user_id = {user['id']} OR f.friend_id = {user['id']})
                    ORDER BY f.created_at DESC
                """)
                friends = cur.fetchall()
                return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'friends': [dict(f) for f in friends]}, default=str), 'isBase64Encoded': False}
            
            if not user:
                return {'statusCode': 401, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Auth required'}), 'isBase64Encoded': False}
            
            elif method == 'POST':
                body = json.loads(event.get('body', '{}'))
                friend_id = body.get('friend_id')
                if not friend_id or friend_id == user['id']:
                    return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Invalid friend_id'}), 'isBase64Encoded': False}
                
                cur.execute(f"SELECT * FROM user_friends WHERE (user_id = {user['id']} AND friend_id = {friend_id}) OR (user_id = {friend_id} AND friend_id = {user['id']})")
                existing = cur.fetchone()
                if existing:
                    if existing['status'] == 'pending':
                        return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'message': 'Заявка уже отправлена, ожидаем принятие', 'friendship': dict(existing)}, default=str), 'isBase64Encoded': False}
                    else:
                        return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Already friends'}), 'isBase64Encoded': False}
                
                cur.execute(f"INSERT INTO user_friends (user_id, friend_id, status) VALUES ({user['id']}, {friend_id}, 'pending') RETURNING *")
                friendship = cur.fetchone()
                conn.commit()
                return {'statusCode': 201, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'friendship': dict(friendship)}, default=str), 'isBase64Encoded': False}
            
            elif method == 'PUT':
                body = json.loads(event.get('body', '{}'))
                friend_id = body.get('friend_id')
                status = body.get('status')
                if not friend_id or status not in ['accepted', 'rejected']:
                    return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Invalid params'}), 'isBase64Encoded': False}
                
                cur.execute(f"UPDATE user_friends SET status = '{status}', updated_at = NOW() WHERE user_id = {friend_id} AND friend_id = {user['id']} AND status = 'pending' RETURNING *")
                friendship = cur.fetchone()
                if not friendship:
                    return {'statusCode': 404, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Not found'}), 'isBase64Encoded': False}
                
                conn.commit()
                return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'friendship': dict(friendship)}, default=str), 'isBase64Encoded': False}
            
            elif method == 'DELETE':
                friend_id = query_params.get('friend_id')
                if not friend_id:
                    return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'friend_id required'}), 'isBase64Encoded': False}
                
                cur.execute(f"DELETE FROM user_friends WHERE (user_id = {user['id']} AND friend_id = {friend_id}) OR (user_id = {friend_id} AND friend_id = {user['id']})")
                conn.commit()
                return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'message': 'Removed'}), 'isBase64Encoded': False}
        
        # === PUBLIC PROFILES ===
        elif query_params.get('action') == 'public' or query_params.get('user_id'):
            user_id = query_params.get('user_id')
            search = query_params.get('search', '').replace("'", "''")
            
            if user_id:
                cur.execute(f"SELECT u.id, u.name, u.username, u.created_at, u.role, p.phone, p.bio, p.location, p.avatar_url, p.is_public, p.gender, p.callsign, p.telegram, u.username as telegram_username FROM users u LEFT JOIN user_profiles p ON u.id = p.user_id WHERE u.id = {user_id}")
                udata = cur.fetchone()
                if not udata or not udata.get('is_public', True):
                    return {'statusCode': 403, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Private'}), 'isBase64Encoded': False}
                
                cur.execute(f"SELECT * FROM user_vehicles WHERE user_id = {user_id} ORDER BY is_primary DESC, created_at DESC")
                vehicles = cur.fetchall()
                
                cur.execute(f"SELECT COUNT(*) as cnt FROM user_friends WHERE (user_id = {user_id} OR friend_id = {user_id}) AND status = 'accepted'")
                fcnt = cur.fetchone()
                
                cur.execute(f"SELECT COUNT(*) as cnt FROM user_favorites WHERE user_id = {user_id}")
                fav_cnt = cur.fetchone()
                
                return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'user': dict(udata), 'vehicles': [dict(v) for v in vehicles], 'friends_count': fcnt['cnt'] if fcnt else 0, 'favorites_count': fav_cnt['cnt'] if fav_cnt else 0}, default=str), 'isBase64Encoded': False}
            
            else:
                search_cond = f"AND (u.name ILIKE '%{search}%' OR u.username ILIKE '%{search}%')" if search else ""
                cur.execute(f"SELECT u.id, u.name, u.username, u.created_at, p.location, p.avatar_url FROM users u LEFT JOIN user_profiles p ON u.id = p.user_id WHERE p.is_public = true AND u.is_hidden = false {search_cond} ORDER BY u.created_at DESC LIMIT 100")
                users = cur.fetchall()
                return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'users': [dict(u) for u in users]}, default=str), 'isBase64Encoded': False}
        
        # === PHOTOS ===
        elif 'photo' in path or query_params.get('action') == 'photos':
            if not user:
                return {'statusCode': 401, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Auth required'}), 'isBase64Encoded': False}
            
            if method == 'GET':
                cur.execute(f"SELECT id, photo_url, source, created_at FROM user_photos WHERE user_id = {user['id']} ORDER BY created_at DESC")
                photos = cur.fetchall()
                return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'photos': [dict(p) for p in photos]}, default=str), 'isBase64Encoded': False}
            
            elif method == 'DELETE':
                photo_id = query_params.get('photo_id')
                if not photo_id:
                    return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'photo_id required'}), 'isBase64Encoded': False}
                cur.execute(f"SELECT id FROM user_photos WHERE id = {photo_id} AND user_id = {user['id']}")
                photo = cur.fetchone()
                if not photo:
                    return {'statusCode': 404, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Not found'}), 'isBase64Encoded': False}
                cur.execute(f"DELETE FROM user_photos WHERE id = {photo_id} AND user_id = {user['id']}")
                conn.commit()
                return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'message': 'Photo removed'}), 'isBase64Encoded': False}
            
            elif method == 'POST':
                body = json.loads(event.get('body', '{}'))
                action_type = body.get('action')
                if action_type == 'set_as_avatar':
                    photo_id = body.get('photo_id')
                    if not photo_id:
                        return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'photo_id required'}), 'isBase64Encoded': False}
                    cur.execute(f"SELECT photo_url FROM user_photos WHERE id = {photo_id} AND user_id = {user['id']}")
                    photo = cur.fetchone()
                    if not photo:
                        return {'statusCode': 404, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Not found'}), 'isBase64Encoded': False}
                    move_avatar_to_photos(cur, user['id'])
                    cur.execute("UPDATE user_profiles SET avatar_url = %s WHERE user_id = %s", (photo['photo_url'], user['id']))
                    cur.execute(f"DELETE FROM user_photos WHERE id = {photo_id} AND user_id = {user['id']}")
                    conn.commit()
                    return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'message': 'Avatar updated'}), 'isBase64Encoded': False}
                
                elif action_type == 'add_photo':
                    photo_url = body.get('photo_url')
                    if not photo_url:
                        return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'photo_url required'}), 'isBase64Encoded': False}
                    cur.execute(f"SELECT COUNT(*) as cnt FROM user_photos WHERE user_id = {user['id']}")
                    cnt = cur.fetchone()
                    if cnt and cnt['cnt'] >= 3:
                        return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Максимум 3 фото'}), 'isBase64Encoded': False}
                    cur.execute("INSERT INTO user_photos (user_id, photo_url, source) VALUES (%s, %s, 'upload') RETURNING id, photo_url, source, created_at", (user['id'], photo_url))
                    new_photo = cur.fetchone()
                    conn.commit()
                    return {'statusCode': 201, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'photo': dict(new_photo)}, default=str), 'isBase64Encoded': False}
        
        # === PROFILE (my profile) ===
        else:
            if not user:
                return {'statusCode': 401, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Auth required'}), 'isBase64Encoded': False}
            
            if method == 'GET':
                cur.execute(f"SELECT u.id, u.email, u.name, u.role, u.created_at, u.telegram_id, u.username as telegram_username, p.phone, p.avatar_url, p.bio, p.location, p.gender, p.callsign, p.telegram FROM users u LEFT JOIN user_profiles p ON u.id = p.user_id WHERE u.id = {user['id']}")
                profile = cur.fetchone()

                cur.execute(f"SELECT id, name, category, type FROM t_p21120869_mototumen_community_.organizations WHERE user_id = {user['id']} AND is_active = true LIMIT 1")
                org_row = cur.fetchone()
                user_organization = dict(org_row) if org_row else None

                cur.execute(f"SELECT item_type, item_id, created_at FROM user_favorites WHERE user_id = {user['id']} ORDER BY created_at DESC")
                favorites = cur.fetchall()
                
                cur.execute(f"SELECT COUNT(*) as cnt FROM user_friends WHERE friend_id = {user['id']} AND status = 'pending'")
                pending_req = cur.fetchone()
                pending_count = pending_req['cnt'] if pending_req else 0
                
                cur.execute(f"SELECT COUNT(*) as cnt FROM user_friends WHERE (user_id = {user['id']} OR friend_id = {user['id']}) AND status = 'accepted'")
                friends_cnt = cur.fetchone()
                friends_count = friends_cnt['cnt'] if friends_cnt else 0
                
                cur.execute(f"SELECT COUNT(*) as cnt FROM user_vehicles WHERE user_id = {user['id']}")
                vehicles_cnt = cur.fetchone()
                vehicles_count = vehicles_cnt['cnt'] if vehicles_cnt else 0
                
                cur.execute(f"SELECT COUNT(*) as cnt FROM user_favorites WHERE user_id = {user['id']}")
                favorites_cnt = cur.fetchone()
                favorites_count = favorites_cnt['cnt'] if favorites_cnt else 0
                
                cur.execute(f"SELECT COUNT(*) as cnt FROM user_achievements WHERE user_id = {user['id']}")
                achievements_cnt = cur.fetchone()
                achievements_count = achievements_cnt['cnt'] if achievements_cnt else 0
                
                cur.execute("SELECT COUNT(*) as cnt FROM achievements")
                total_ach = cur.fetchone()
                total_achievements = total_ach['cnt'] if total_ach else 0
                
                cur.execute(f"SELECT COUNT(*) as cnt FROM user_badges WHERE user_id = {user['id']}")
                badges_cnt = cur.fetchone()
                badges_count = badges_cnt['cnt'] if badges_cnt else 0
                
                cur.execute(f"SELECT id, photo_url, source, created_at FROM user_photos WHERE user_id = {user['id']} ORDER BY created_at DESC")
                photos = cur.fetchall()
                
                return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'profile': dict(profile) if profile else {}, 'organization': user_organization, 'favorites': [dict(f) for f in favorites], 'pending_friend_requests': pending_count, 'friends_count': friends_count, 'vehicles_count': vehicles_count, 'favorites_count': favorites_count, 'achievements_count': achievements_count, 'total_achievements': total_achievements, 'badges_count': badges_count, 'photos': [dict(p) for p in photos]}, default=str), 'isBase64Encoded': False}
            
            elif method == 'PUT':
                body = json.loads(event.get('body', '{}'))
                
                if body.get('remove_avatar'):
                    move_avatar_to_photos(cur, user['id'])
                    cur.execute("UPDATE user_profiles SET avatar_url = NULL, updated_at = NOW() WHERE user_id = %s", (user['id'],))
                    conn.commit()
                    return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'message': 'Avatar removed'}), 'isBase64Encoded': False}
                
                if 'avatar_url' in body and body['avatar_url']:
                    move_avatar_to_photos(cur, user['id'])
                
                updates = []
                
                for field in ['phone', 'bio', 'location', 'avatar_url', 'gender', 'callsign', 'telegram']:
                    if field in body:
                        val = str(body[field]).replace("'", "''") if body[field] else 'NULL'
                        updates.append(f"{field} = '{val}'" if body[field] else f"{field} = NULL")
                
                if updates:
                    updates.append("updated_at = NOW()")
                    cur.execute(f"UPDATE user_profiles SET {', '.join(updates)} WHERE user_id = {user['id']}")
                    conn.commit()
                
                return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'message': 'Updated'}), 'isBase64Encoded': False}
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()