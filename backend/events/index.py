"""
Events API — управление мотособытиями платформы.
GET ?archived=false — список активных / архивных событий
POST — создать событие (admin/ceo)
PUT ?id=N — редактировать событие (admin/ceo)
DELETE ?id=N — удалить событие (admin/ceo)
POST ?action=archive_expired — перенести просроченные в архив
"""
import json
import os
from datetime import datetime, date
import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = 't_p21120869_mototumen_community_'

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
}

def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'], cursor_factory=RealDictCursor)

def resp(status, body):
    return {
        'statusCode': status,
        'headers': {'Content-Type': 'application/json', **CORS},
        'body': json.dumps(body, default=str),
        'isBase64Encoded': False,
    }

def get_user(cur, token):
    if not token:
        return None
    cur.execute(f"""
        SELECT u.id, u.name, u.role
        FROM {SCHEMA}.users u
        JOIN {SCHEMA}.user_sessions s ON u.id = s.user_id
        WHERE s.token = '{token}' AND s.expires_at > NOW()
        LIMIT 1
    """)
    return cur.fetchone()

def handler(event: dict, context) -> dict:
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    headers = event.get('headers', {})
    token = next((v for k, v in headers.items() if k.lower() == 'x-auth-token'), None)
    params = event.get('queryStringParameters') or {}

    conn = get_db()
    cur = conn.cursor()

    try:
        user = get_user(cur, token)
        is_admin = user and user.get('role') in ('admin', 'ceo', 'moderator')

        # Автоархивирование просроченных
        cur.execute(f"""
            UPDATE {SCHEMA}.events
            SET is_archived = TRUE, updated_at = NOW()
            WHERE is_archived = FALSE AND date < CURRENT_DATE
        """)
        conn.commit()

        # GET — список событий
        if method == 'GET':
            archived = params.get('archived', 'false').lower() == 'true'
            cur.execute(f"""
                SELECT e.*, u.name as creator_name
                FROM {SCHEMA}.events e
                LEFT JOIN {SCHEMA}.users u ON u.id = e.organizer_id
                WHERE e.is_archived = {archived}
                ORDER BY e.date ASC, e.created_at DESC
            """)
            events = [dict(r) for r in cur.fetchall()]
            return resp(200, {'events': events})

        # POST — создать
        if method == 'POST':
            if not is_admin:
                return resp(403, {'error': 'Нет прав'})
            body = json.loads(event.get('body') or '{}')
            title = body.get('title', '').strip()
            if not title:
                return resp(400, {'error': 'Название обязательно'})
            cur.execute(f"""
                INSERT INTO {SCHEMA}.events
                    (title, description, date, time, location, category, price, image_url, organizer_id, organizer_name)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *
            """, (
                title,
                body.get('description', ''),
                body.get('date'),
                body.get('time', ''),
                body.get('location', ''),
                body.get('category', 'Другое'),
                int(body.get('price', 0)),
                body.get('image_url', ''),
                user['id'],
                body.get('organizer_name', user['name']),
            ))
            new_event = dict(cur.fetchone())
            conn.commit()
            return resp(201, {'event': new_event})

        # PUT — редактировать
        if method == 'PUT':
            if not is_admin:
                return resp(403, {'error': 'Нет прав'})
            event_id = params.get('id')
            if not event_id:
                return resp(400, {'error': 'id required'})
            body = json.loads(event.get('body') or '{}')
            fields = []
            values = []
            for f in ['title', 'description', 'date', 'time', 'location', 'category', 'price', 'image_url', 'organizer_name']:
                if f in body:
                    fields.append(f'{f} = %s')
                    values.append(int(body[f]) if f == 'price' else body[f])
            if 'is_archived' in body:
                fields.append('is_archived = %s')
                values.append(bool(body['is_archived']))
            if not fields:
                return resp(400, {'error': 'Нет полей для обновления'})
            fields.append('updated_at = NOW()')
            values.append(int(event_id))
            cur.execute(f"UPDATE {SCHEMA}.events SET {', '.join(fields)} WHERE id = %s RETURNING *", values)
            updated = cur.fetchone()
            conn.commit()
            if not updated:
                return resp(404, {'error': 'Событие не найдено'})
            return resp(200, {'event': dict(updated)})

        # DELETE — удалить
        if method == 'DELETE':
            if not is_admin:
                return resp(403, {'error': 'Нет прав'})
            event_id = params.get('id')
            if not event_id:
                return resp(400, {'error': 'id required'})
            cur.execute(f"UPDATE {SCHEMA}.events SET is_archived = TRUE, updated_at = NOW() WHERE id = %s", (int(event_id),))
            conn.commit()
            return resp(200, {'success': True})

        return resp(405, {'error': 'Method not allowed'})

    finally:
        cur.close()
        conn.close()
