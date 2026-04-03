import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Optional

SCHEMA = 't_p21120869_mototumen_community_'
AUTH_SCHEMA = 't_p21120869_mototumen_community_'

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token, X-Authorization',
}

def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'], cursor_factory=RealDictCursor)

def get_header(headers: dict, name: str) -> Optional[str]:
    for k, v in headers.items():
        if k.lower() == name.lower():
            return v
    return None

def get_user(cur, token: str) -> Optional[dict]:
    cur.execute(f"""
        SELECT u.id, u.name, u.role
        FROM {AUTH_SCHEMA}.users u
        JOIN {AUTH_SCHEMA}.user_sessions s ON u.id = s.user_id
        WHERE s.token = '{token}' AND s.expires_at > NOW()
    """)
    return cur.fetchone()

def ok(data, status=200):
    return {'statusCode': status, 'headers': {'Content-Type': 'application/json', **CORS}, 'body': json.dumps(data, default=str), 'isBase64Encoded': False}

def err(msg, status=400):
    return {'statusCode': status, 'headers': {'Content-Type': 'application/json', **CORS}, 'body': json.dumps({'error': msg}), 'isBase64Encoded': False}

def handler(event: dict, context) -> dict:
    """API для управления данными страницы Джимхана (события, история)"""
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': '', 'isBase64Encoded': False}

    params = event.get('queryStringParameters', {}) or {}
    section = params.get('section', 'events')  # events | history

    conn = get_db()
    cur = conn.cursor()

    try:
        # ── GET ──────────────────────────────────────────────
        if method == 'GET':
            if section == 'events':
                cur.execute(f"SELECT * FROM {SCHEMA}.gymkhana_events ORDER BY id ASC")
            else:
                cur.execute(f"SELECT * FROM {SCHEMA}.gymkhana_history ORDER BY sort_order ASC")
            rows = cur.fetchall()
            return ok([dict(r) for r in rows])

        # ── Проверяем роль для всего остального ──────────────
        headers = event.get('headers', {})
        token = get_header(headers, 'X-Auth-Token') or get_header(headers, 'X-Authorization')
        if not token:
            return err('Требуется авторизация', 401)
        user = get_user(cur, token)
        if not user:
            return err('Неверный токен', 401)
        if user['role'] not in ('gymkhana', 'admin', 'ceo'):
            return err('Нет прав', 403)

        body = json.loads(event.get('body', '{}') or '{}')

        def esc(v):
            if v is None: return 'NULL'
            if isinstance(v, (int, float)): return str(v)
            return "'" + str(v).replace("'", "''") + "'"

        # ── POST — создать ────────────────────────────────────
        if method == 'POST':
            if section == 'events':
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.gymkhana_events
                        (title, event_date, event_day, time_start, time_end, location, type, price, spots)
                    VALUES (
                        {esc(body.get('title'))}, {esc(body.get('event_date'))},
                        {esc(body.get('event_day'))}, {esc(body.get('time_start'))},
                        {esc(body.get('time_end'))}, {esc(body.get('location'))},
                        {esc(body.get('type', 'free'))}, {esc(body.get('price'))},
                        {esc(body.get('spots', '∞'))}
                    ) RETURNING id
                """)
            else:
                max_order = cur.fetchone() or {'max': 0}
                cur.execute(f"SELECT COALESCE(MAX(sort_order),0) as max FROM {SCHEMA}.gymkhana_history")
                max_order = cur.fetchone()['max']
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.gymkhana_history
                        (year, title, text, side, icon, sort_order)
                    VALUES (
                        {esc(body.get('year'))}, {esc(body.get('title'))},
                        {esc(body.get('text'))}, {esc(body.get('side', 'left'))},
                        {esc(body.get('icon', 'Star'))}, {max_order + 1}
                    ) RETURNING id
                """)
            row = cur.fetchone()
            conn.commit()
            return ok({'success': True, 'id': row['id']}, 201)

        # ── PUT — обновить ────────────────────────────────────
        if method == 'PUT':
            item_id = body.get('id')
            if not item_id:
                return err('id обязателен')
            if section == 'events':
                cur.execute(f"""
                    UPDATE {SCHEMA}.gymkhana_events SET
                        title={esc(body.get('title'))},
                        event_date={esc(body.get('event_date'))},
                        event_day={esc(body.get('event_day'))},
                        time_start={esc(body.get('time_start'))},
                        time_end={esc(body.get('time_end'))},
                        location={esc(body.get('location'))},
                        type={esc(body.get('type'))},
                        price={esc(body.get('price'))},
                        spots={esc(body.get('spots'))},
                        updated_at=CURRENT_TIMESTAMP
                    WHERE id={item_id}
                """)
            else:
                cur.execute(f"""
                    UPDATE {SCHEMA}.gymkhana_history SET
                        year={esc(body.get('year'))},
                        title={esc(body.get('title'))},
                        text={esc(body.get('text'))},
                        side={esc(body.get('side'))},
                        icon={esc(body.get('icon'))},
                        updated_at=CURRENT_TIMESTAMP
                    WHERE id={item_id}
                """)
            conn.commit()
            return ok({'success': True})

        # ── DELETE ────────────────────────────────────────────
        if method == 'DELETE':
            item_id = body.get('id')
            if not item_id:
                return err('id обязателен')
            table = 'gymkhana_events' if section == 'events' else 'gymkhana_history'
            cur.execute(f"DELETE FROM {SCHEMA}.{table} WHERE id={item_id}")
            conn.commit()
            return ok({'success': True})

        return err('Method not allowed', 405)

    except Exception as e:
        conn.rollback()
        return err(str(e), 500)
    finally:
        cur.close()
        conn.close()
