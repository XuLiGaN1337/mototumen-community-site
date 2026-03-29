import json
import os
import urllib.request


def handler(event, context):
    """Получение количества участников телеграм-канала @MotoTyumen"""
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400',
            },
            'body': '',
        }

    token = os.environ.get('TELEGRAM_BOT_TOKEN')
    if not token:
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Bot token not configured'}),
        }

    qs = event.get('queryStringParameters') or {}
    channel = qs.get('channel', 'MotoTyumen')

    url = f'https://api.telegram.org/bot{token}/getChatMemberCount?chat_id=@{channel}'
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=5) as resp:
            count_data = json.loads(resp.read().decode())
    except Exception as e:
        return {
            'statusCode': 502,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
        }

    if not count_data.get('ok'):
        return {
            'statusCode': 502,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': count_data.get('description', 'Telegram API error')}),
        }

    url2 = f'https://api.telegram.org/bot{token}/getChat?chat_id=@{channel}'
    title = channel
    try:
        req2 = urllib.request.Request(url2)
        with urllib.request.urlopen(req2, timeout=5) as resp2:
            chat_data = json.loads(resp2.read().decode())
            if chat_data.get('ok'):
                title = chat_data['result'].get('title', channel)
    except Exception:
        pass

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
        'body': json.dumps({
            'memberCount': count_data['result'],
            'title': title,
        }),
    }
