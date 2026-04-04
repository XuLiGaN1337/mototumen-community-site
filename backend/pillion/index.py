import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any, Optional

SCHEMA = 't_p21120869_mototumen_community_'

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
}

def get_db_connection():
    return psycopg2.connect(os.environ.get('DATABASE_URL'), cursor_factory=RealDictCursor)

def get_header(headers: dict, name: str) -> Optional[str]:
    for key, val in headers.items():
        if key.lower() == name.lower():
            return val
    return None

def get_user_from_token(cur, token: str) -> Optional[dict]:
    cur.execute(f"""
        SELECT u.id, u.name, u.email,
               COALESCE(up.avatar_url, '') as avatar_url,
               COALESCE(up.gender, 'male') as gender,
               COALESCE((SELECT role FROM {SCHEMA}.user_roles WHERE user_id = u.id ORDER BY id LIMIT 1), 'user') as role
        FROM {SCHEMA}.users u
        JOIN {SCHEMA}.user_sessions s ON u.id = s.user_id
        LEFT JOIN {SCHEMA}.user_profiles up ON up.user_id = u.id
        WHERE s.token = '{token}' AND s.expires_at > NOW()
    """)
    return cur.fetchone()

def resp(status: int, data: Any) -> dict:
    return {
        'statusCode': status,
        'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'},
        'body': json.dumps(data, default=str),
        'isBase64Encoded': False
    }

def get_avg_rating(cur, user_id: int, target_type: str) -> dict:
    cur.execute(f"""
        SELECT ROUND(AVG(rating)::numeric, 1) as avg, COUNT(*) as count
        FROM {SCHEMA}.pillion_reviews
        WHERE target_user_id = {user_id} AND target_type = '{target_type}'
    """)
    row = cur.fetchone()
    return {'avg': float(row['avg']) if row['avg'] else 0.0, 'count': int(row['count'])}

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """API для поиска двоек — пилоты и пассажиры мотосообщества"""
    method = event.get('httpMethod', 'GET')
    headers = event.get('headers', {})
    params = event.get('queryStringParameters', {}) or {}
    body_raw = event.get('body', '{}') or '{}'

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    token = get_header(headers, 'X-Auth-Token')

    try:
        conn = get_db_connection()
        cur = conn.cursor()
        current_user = get_user_from_token(cur, token) if token else None
        action = params.get('action', '')
        print(f"DEBUG pillion: action={action}, method={method}, schema={SCHEMA}")

        # ── GET /pilots ──────────────────────────────────────────────
        if method == 'GET' and action == 'pilots':
            user_id = params.get('user_id')
            if user_id:
                cur.execute(f"""
                    SELECT pp.*, u.name,
                           COALESCE(upr.avatar_url, '') as avatar_url,
                           COALESCE(upr.gender, 'male') as gender
                    FROM {SCHEMA}.pillion_pilots pp
                    JOIN {SCHEMA}.users u ON u.id = pp.user_id
                    LEFT JOIN {SCHEMA}.user_profiles upr ON upr.user_id = pp.user_id
                    WHERE pp.user_id = {int(user_id)}
                    LIMIT 1
                """)
                rows = [cur.fetchone()]
            else:
                cur.execute(f"""
                    SELECT pp.*, u.name,
                           COALESCE(upr.avatar_url, '') as avatar_url,
                           COALESCE(upr.gender, 'male') as gender
                    FROM {SCHEMA}.pillion_pilots pp
                    JOIN {SCHEMA}.users u ON u.id = pp.user_id
                    LEFT JOIN {SCHEMA}.user_profiles upr ON upr.user_id = pp.user_id
                    WHERE pp.is_active = true
                    ORDER BY pp.updated_at DESC
                """)
                rows = cur.fetchall()
            rows = [r for r in rows if r]
            result = []
            for r in rows:
                rating = get_avg_rating(cur, r['user_id'], 'pilot')
                result.append({**dict(r), 'rating_avg': rating['avg'], 'rating_count': rating['count']})
            return resp(200, result)

        # ── GET /passengers ───────────────────────────────────────────
        if method == 'GET' and action == 'passengers':
            user_id = params.get('user_id')
            if user_id:
                cur.execute(f"""
                    SELECT pp.*, u.name,
                           COALESCE(upr.avatar_url, '') as avatar_url,
                           COALESCE(upr.gender, 'male') as gender
                    FROM {SCHEMA}.pillion_passengers pp
                    JOIN {SCHEMA}.users u ON u.id = pp.user_id
                    LEFT JOIN {SCHEMA}.user_profiles upr ON upr.user_id = pp.user_id
                    WHERE pp.user_id = {int(user_id)}
                    LIMIT 1
                """)
                rows = [cur.fetchone()]
            else:
                cur.execute(f"""
                    SELECT pp.*, u.name,
                           COALESCE(upr.avatar_url, '') as avatar_url,
                           COALESCE(upr.gender, 'male') as gender
                    FROM {SCHEMA}.pillion_passengers pp
                    JOIN {SCHEMA}.users u ON u.id = pp.user_id
                    LEFT JOIN {SCHEMA}.user_profiles upr ON upr.user_id = pp.user_id
                    WHERE pp.is_active = true
                    ORDER BY pp.updated_at DESC
                """)
                rows = cur.fetchall()
            rows = [r for r in rows if r]
            result = []
            for r in rows:
                rating = get_avg_rating(cur, r['user_id'], 'passenger')
                result.append({**dict(r), 'rating_avg': rating['avg'], 'rating_count': rating['count']})
            return resp(200, result)

        # ── GET /reviews ──────────────────────────────────────────────
        if method == 'GET' and action == 'reviews':
            target_user_id = params.get('user_id')
            target_type = params.get('type', 'pilot')
            if not target_user_id:
                return resp(400, {'error': 'user_id required'})
            cur.execute(f"""
                SELECT r.*, u.name as author_name, u.avatar_url as author_avatar
                FROM {SCHEMA}.pillion_reviews r
                JOIN {SCHEMA}.users u ON u.id = r.author_user_id
                WHERE r.target_user_id = {int(target_user_id)} AND r.target_type = '{target_type}'
                ORDER BY r.created_at DESC
            """)
            return resp(200, [dict(r) for r in cur.fetchall()])

        # ── Всё что ниже требует авторизации ─────────────────────────
        if not current_user:
            return resp(401, {'error': 'Необходима авторизация'})

        uid = current_user['id']
        body = json.loads(body_raw)

        # ── POST /pilot (создать/обновить карточку пилота) ────────────
        if method == 'POST' and action == 'pilot':
            moto_brand = body.get('moto_brand', '').strip()
            moto_model = body.get('moto_model', '').strip()
            if not moto_brand or not moto_model:
                return resp(400, {'error': 'Укажите марку и модель мотоцикла'})

            experience_years = int(body.get('experience_years', 0))
            has_helmet = bool(body.get('has_helmet', False))
            has_jacket = bool(body.get('has_jacket', False))
            has_gloves = bool(body.get('has_gloves', False))
            riding_style = body.get('riding_style', 'спокойный').strip()
            about = body.get('about', '').strip()
            contact = body.get('contact', '').strip()
            preferred_dates = body.get('preferred_dates', [])
            is_active = bool(body.get('is_active', True))

            dates_str = "ARRAY[" + ",".join([f"'{d}'" for d in preferred_dates]) + "]" if preferred_dates else "ARRAY[]::text[]"

            cur.execute(f"SELECT id FROM {SCHEMA}.pillion_pilots WHERE user_id = {uid}")
            existing = cur.fetchone()

            if existing:
                cur.execute(f"""
                    UPDATE {SCHEMA}.pillion_pilots SET
                        moto_brand = '{moto_brand}', moto_model = '{moto_model}',
                        experience_years = {experience_years},
                        has_helmet = {has_helmet}, has_jacket = {has_jacket}, has_gloves = {has_gloves},
                        riding_style = '{riding_style}', about = '{about}', contact = '{contact}',
                        preferred_dates = {dates_str}, is_active = {is_active},
                        updated_at = NOW()
                    WHERE user_id = {uid}
                    RETURNING id
                """)
            else:
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.pillion_pilots
                        (user_id, moto_brand, moto_model, experience_years,
                         has_helmet, has_jacket, has_gloves, riding_style,
                         about, contact, preferred_dates, is_active)
                    VALUES ({uid}, '{moto_brand}', '{moto_model}', {experience_years},
                            {has_helmet}, {has_jacket}, {has_gloves}, '{riding_style}',
                            '{about}', '{contact}', {dates_str}, {is_active})
                    RETURNING id
                """)
            conn.commit()
            return resp(200, {'ok': True, 'id': cur.fetchone()['id']})

        # ── POST /passenger (создать/обновить карточку пассажира) ────
        if method == 'POST' and action == 'passenger':
            experience_years = int(body.get('experience_years', 0))
            has_helmet = bool(body.get('has_helmet', False))
            has_jacket = bool(body.get('has_jacket', False))
            has_gloves = bool(body.get('has_gloves', False))
            about = body.get('about', '').strip()
            contact = body.get('contact', '').strip()
            preferred_dates = body.get('preferred_dates', [])
            is_active = bool(body.get('is_active', True))

            dates_str = "ARRAY[" + ",".join([f"'{d}'" for d in preferred_dates]) + "]" if preferred_dates else "ARRAY[]::text[]"

            cur.execute(f"SELECT id FROM {SCHEMA}.pillion_passengers WHERE user_id = {uid}")
            existing = cur.fetchone()

            if existing:
                cur.execute(f"""
                    UPDATE {SCHEMA}.pillion_passengers SET
                        experience_years = {experience_years},
                        has_helmet = {has_helmet}, has_jacket = {has_jacket}, has_gloves = {has_gloves},
                        about = '{about}', contact = '{contact}',
                        preferred_dates = {dates_str}, is_active = {is_active},
                        updated_at = NOW()
                    WHERE user_id = {uid}
                    RETURNING id
                """)
            else:
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.pillion_passengers
                        (user_id, experience_years, has_helmet, has_jacket, has_gloves,
                         about, contact, preferred_dates, is_active)
                    VALUES ({uid}, {experience_years}, {has_helmet}, {has_jacket}, {has_gloves},
                            '{about}', '{contact}', {dates_str}, {is_active})
                    RETURNING id
                """)
            conn.commit()
            return resp(200, {'ok': True, 'id': cur.fetchone()['id']})

        # ── POST /review (оставить отзыв) ─────────────────────────────
        if method == 'POST' and action == 'review':
            target_user_id = int(body.get('target_user_id', 0))
            target_type = body.get('target_type', 'pilot')
            rating = int(body.get('rating', 5))
            comment = body.get('comment', '').strip()

            if target_user_id == uid:
                return resp(400, {'error': 'Нельзя оставить отзыв самому себе'})
            if rating < 1 or rating > 5:
                return resp(400, {'error': 'Оценка от 1 до 5'})

            cur.execute(f"""
                INSERT INTO {SCHEMA}.pillion_reviews (target_user_id, target_type, author_user_id, rating, comment)
                VALUES ({target_user_id}, '{target_type}', {uid}, {rating}, '{comment}')
                ON CONFLICT (target_user_id, target_type, author_user_id)
                DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment
                RETURNING id
            """)
            conn.commit()
            return resp(200, {'ok': True})

        cur.close()
        conn.close()
        return resp(400, {'error': 'Неизвестный action'})

    except Exception as e:
        import traceback
        print(f"ERROR type={type(e).__name__}: {e}")
        print(traceback.format_exc())
        try:
            conn.rollback()
            cur.close()
            conn.close()
        except Exception:
            pass
        return resp(500, {'error': str(e)})