"""
Business: Отправка заявки на помощь на дороге в ветку Telegram-группы (topic_id=145)
Args: event с httpMethod, body с данными заявки, X-Auth-Token в headers
Returns: HTTP response с результатом отправки
"""
import json
import os
import requests
from typing import Dict, Any

CHAT_ID = -1002441055201   # группа MotoTyumen
TOPIC_ID = 145             # ветка "Помощь на дороге"

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
}

def send_to_topic(bot_token: str, text: str) -> bool:
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {
        'chat_id': CHAT_ID,
        'message_thread_id': TOPIC_ID,
        'text': text,
        'parse_mode': 'HTML',
        'disable_web_page_preview': True,
    }
    try:
        resp = requests.post(url, json=payload, timeout=10)
        result = resp.json()
        print(f"[ROADSIDE] Telegram response: {resp.status_code} {result}")
        return resp.status_code == 200 and result.get('ok')
    except Exception as e:
        print(f"[ROADSIDE] Error sending: {e}")
        return False

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method = event.get('httpMethod', 'POST')

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': '', 'isBase64Encoded': False}

    if method != 'POST':
        return {'statusCode': 405, 'headers': {**CORS, 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Method not allowed'}), 'isBase64Encoded': False}

    body = json.loads(event.get('body') or '{}')

    user_name    = body.get('user_name', 'Не указано')
    user_phone   = body.get('user_phone', 'Не указан')
    moto_model   = body.get('moto_model', '')
    moto_year    = body.get('moto_year', '')
    moto_plate   = body.get('moto_plate', '')
    problem      = body.get('problem', '')
    location     = body.get('location', '')

    if not moto_model or not problem or not location:
        return {'statusCode': 400, 'headers': {**CORS, 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'moto_model, problem, location required'}),
                'isBase64Encoded': False}

    moto_str = moto_model
    if moto_year:
        moto_str += f' ({moto_year})'
    if moto_plate:
        moto_str += f' · {moto_plate}'

    text = (
        f"🆘 <b>ЗАЯВКА НА ПОМОЩЬ НА ДОРОГЕ</b>\n\n"
        f"👤 <b>Кто:</b> {user_name}\n"
        f"📞 <b>Телефон:</b> {user_phone}\n\n"
        f"🏍 <b>Мотоцикл:</b> {moto_str}\n"
        f"🔧 <b>Проблема:</b> {problem}\n\n"
        f"📍 <b>Местоположение:</b> {location}"
    )

    bot_token = os.environ.get('TELEGRAM_BOT_TOKEN_ROADSIDE')
    if not bot_token:
        print("[ROADSIDE] TELEGRAM_BOT_TOKEN_ROADSIDE not set")
        return {'statusCode': 500, 'headers': {**CORS, 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Bot token not configured'}),
                'isBase64Encoded': False}

    ok = send_to_topic(bot_token, text)

    return {
        'statusCode': 200 if ok else 502,
        'headers': {**CORS, 'Content-Type': 'application/json'},
        'body': json.dumps({'success': ok}),
        'isBase64Encoded': False,
    }
