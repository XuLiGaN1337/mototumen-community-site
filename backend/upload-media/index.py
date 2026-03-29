import json
import base64
import boto3
import os
from typing import Dict, Any
from datetime import datetime
import hashlib


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Загрузка медиафайлов в S3 хранилище"""
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Max-Age': '86400',
            },
            'body': '',
        }

    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False,
        }

    body_str = event.get('body', '{}')
    if not body_str or body_str.strip() == '':
        body_str = '{}'
    body_data = json.loads(body_str)
    file_base64 = body_data.get('file')
    file_name = body_data.get('fileName', 'upload')
    content_type = body_data.get('contentType', 'image/jpeg')
    folder = body_data.get('folder', 'general')

    if not file_base64:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'No file provided'}),
            'isBase64Encoded': False,
        }

    try:
        file_bytes = base64.b64decode(file_base64)

        file_hash = hashlib.md5(file_bytes).hexdigest()[:8]
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        file_ext = file_name.split('.')[-1] if '.' in file_name else 'jpg'
        key = f"{folder}/{timestamp}_{file_hash}.{file_ext}"

        access_key = os.environ.get('AWS_ACCESS_KEY_ID')
        secret_key = os.environ.get('AWS_SECRET_ACCESS_KEY')

        if not access_key or not secret_key:
            raise Exception('Missing S3 credentials (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY)')

        s3 = boto3.client(
            's3',
            endpoint_url='https://bucket.poehali.dev',
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
        )

        s3.put_object(
            Bucket='files',
            Key=key,
            Body=file_bytes,
            ContentType=content_type,
        )

        cdn_url = f"https://cdn.poehali.dev/projects/{access_key}/bucket/{key}"

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({
                'url': cdn_url,
                'fileName': key,
                'size': len(file_bytes),
            }),
        }
    except Exception as e:
        print(f"[UPLOAD ERROR] {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'error': str(e)}),
        }
