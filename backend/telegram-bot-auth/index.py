"""
Business: Telegram bot webhook for user authentication
Args: event with Telegram webhook update (message with /start command)
Returns: HTTP 200 response, sends inline keyboard with login button via Telegram Bot API
"""
import json
import os
import jwt
from datetime import datetime, timedelta
import requests


SITE_URL = "https://mototyumen.ru"


def send_message(bot_token: str, chat_id: int, text: str, reply_markup: dict = None):
    """Send message via Telegram Bot API"""
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML",
        "disable_web_page_preview": True
    }
    if reply_markup:
        payload["reply_markup"] = json.dumps(reply_markup)
    
    try:
        resp = requests.post(url, json=payload, timeout=10)
        print(f"[SEND_MESSAGE] status={resp.status_code}, response={resp.text[:200]}")
        return resp.json()
    except Exception as e:
        print(f"[SEND_MESSAGE ERROR] {e}")
        return None


def generate_auth_jwt(user_data: dict) -> str:
    """Generate JWT token with user telegram data"""
    jwt_secret = os.environ.get('JWT_SECRET_KEY', 'default_secret_key')
    
    payload = {
        "id": user_data["id"],
        "first_name": user_data.get("first_name", ""),
        "last_name": user_data.get("last_name", ""),
        "username": user_data.get("username", ""),
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(minutes=5)  # Token valid 5 min
    }
    
    return jwt.encode(payload, jwt_secret, algorithm="HS256")


def make_response(status_code: int = 200, body: dict = None):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        "body": json.dumps(body or {"ok": True}),
        "isBase64Encoded": False
    }


def handler(event: dict, context: dict) -> dict:
    method = event.get("httpMethod", "GET")
    
    # CORS
    if method == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "*"
            },
            "body": "",
            "isBase64Encoded": False
        }
    
    # GET — setup webhook or info
    if method == "GET":
        query_params = event.get("queryStringParameters") or {}
        
        if query_params.get("action") == "set_webhook":
            bot_token = os.environ.get("TELEGRAM_BOT_TOKEN_AUTH")
            if not bot_token:
                return make_response(500, {"error": "Bot token not configured"})
            
            # Get the current function URL from the request
            webhook_url = query_params.get("url")
            if not webhook_url:
                return make_response(400, {"error": "url parameter required"})
            
            try:
                resp = requests.post(
                    f"https://api.telegram.org/bot{bot_token}/setWebhook",
                    json={"url": webhook_url},
                    timeout=10
                )
                result = resp.json()
                print(f"[SET_WEBHOOK] result: {result}")
                return make_response(200, {"webhook_result": result})
            except Exception as e:
                return make_response(500, {"error": str(e)})
        
        return make_response(200, {"ok": True, "status": "bot webhook active"})
    
    bot_token = os.environ.get("TELEGRAM_BOT_TOKEN_AUTH")
    if not bot_token:
        print("[ERROR] TELEGRAM_BOT_TOKEN_AUTH not set")
        return make_response(500, {"error": "Bot token not configured"})
    
    try:
        body = json.loads(event.get("body", "{}"))
    except (json.JSONDecodeError, TypeError):
        return make_response(200, {"ok": True})
    
    print(f"[WEBHOOK] Received update: {json.dumps(body, ensure_ascii=False)[:500]}")
    
    # Handle message
    message = body.get("message")
    if not message:
        # Could be callback_query, edited_message, etc. - ignore
        return make_response(200, {"ok": True})
    
    chat = message.get("chat", {})
    chat_id = chat.get("id")
    chat_type = chat.get("type", "")
    from_user = message.get("from", {})
    text = message.get("text", "")
    
    if not chat_id:
        return make_response(200, {"ok": True})
    
    if chat_type != "private":
        return make_response(200, {"ok": True})
    
    # Handle /start command
    if text.startswith("/start"):
        user_data = {
            "id": from_user.get("id"),
            "first_name": from_user.get("first_name", ""),
            "last_name": from_user.get("last_name", ""),
            "username": from_user.get("username", "")
        }
        
        # Generate JWT token
        token = generate_auth_jwt(user_data)
        auth_url = f"{SITE_URL}/auth-callback?token={token}"
        
        first_name = from_user.get("first_name", "Пользователь")
        
        welcome_text = (
            f"Привет, <b>{first_name}</b>! 👋\n\n"
            f"Нажми кнопку ниже, чтобы войти на сайт <b>МОТОТЮМЕНЬ</b>.\n\n"
            f"Ссылка действительна 5 минут."
        )
        
        reply_markup = {
            "inline_keyboard": [
                [
                    {
                        "text": "🏍 Войти на сайт",
                        "url": auth_url
                    }
                ]
            ]
        }
        
        send_message(bot_token, chat_id, welcome_text, reply_markup)
        
        return make_response(200, {"ok": True})
    
    # Any other message — suggest /start
    send_message(
        bot_token, 
        chat_id, 
        "Для авторизации на сайте нажмите /start"
    )
    
    return make_response(200, {"ok": True})