"""
ZM Store API — управление товарами и продавцами магазина ZM Store.
Авторизация: X-Auth-Token (user_sessions).
Доступ: CEO (role=ceo) и продавцы из store_sellers.
Actions: products CRUD, sellers CRUD (только CEO).
"""
import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Optional

SCHEMA = 't_p21120869_mototumen_community_'
CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
}

def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'], cursor_factory=RealDictCursor)

def ok(body: dict, status=200):
    return {'statusCode': status, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps(body, default=str), 'isBase64Encoded': False}

def err(msg: str, status=400):
    return {'statusCode': status, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': msg}), 'isBase64Encoded': False}

def get_header(headers: dict, name: str) -> Optional[str]:
    name_lower = name.lower()
    for k, v in headers.items():
        if k.lower() == name_lower:
            return v
    return None

def get_user(cur, token: str) -> Optional[dict]:
    """Получить пользователя по токену из user_sessions."""
    cur.execute(f"""
        SELECT u.id, u.name, u.role, u.email
        FROM {SCHEMA}.users u
        JOIN {SCHEMA}.user_sessions s ON u.id = s.user_id
        WHERE s.token = %s AND s.expires_at > NOW()
    """, (token,))
    return cur.fetchone()

def has_store_access(cur, user_id: int, role: str) -> tuple[bool, bool]:
    """Проверить доступ к ZM Store. Возвращает (has_access, is_ceo)."""
    if role == 'ceo':
        return True, True
    cur.execute(f"SELECT id FROM {SCHEMA}.store_sellers WHERE user_id = %s AND is_active = true", (str(user_id),))
    if cur.fetchone():
        return True, False
    return False, False

def get_zm_shop_id(cur) -> Optional[int]:
    """Получить shop_id для ZM Store (создать если нет)."""
    cur.execute(f"SELECT id FROM {SCHEMA}.shops WHERE name = 'ZM Store' LIMIT 1")
    row = cur.fetchone()
    if row:
        return row['id']
    # Создаём магазин если его нет
    cur.execute(f"""
        INSERT INTO {SCHEMA}.shops (name, description, category, is_open)
        VALUES ('ZM Store', 'Официальный магазин ZM Store', 'Магазин', true)
        RETURNING id
    """)
    return cur.fetchone()['id']

def handler(event: dict, context) -> dict:
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': {**CORS, 'Access-Control-Max-Age': '86400'}, 'body': '', 'isBase64Encoded': False}

    headers = event.get('headers', {}) or {}
    token = get_header(headers, 'X-Auth-Token') or get_header(headers, 'X-Authorization')
    query = event.get('queryStringParameters', {}) or {}
    action = query.get('action', '')

    conn = get_db()
    cur = conn.cursor()

    try:
        # --- ПУБЛИЧНЫЙ: список товаров без авторизации ---
        if method == 'GET' and action == 'public-products':
            shop_id = get_zm_shop_id(cur)
            cur.execute(f"""
                SELECT id, name, description, price, image_url as image,
                       category, in_stock as "inStock", brand, model, discount, created_at
                FROM {SCHEMA}.products WHERE shop_id = %s AND in_stock = true
                ORDER BY created_at DESC
            """, (shop_id,))
            return ok({'products': [dict(r) for r in cur.fetchall()]})

        # Все остальные требуют авторизации
        if not token:
            return err('Требуется авторизация', 401)

        user = get_user(cur, token)
        if not user:
            return err('Неверный токен', 401)

        has_access, is_ceo = has_store_access(cur, user['id'], user['role'])
        if not has_access:
            return err('Нет доступа к ZM Store', 403)

        shop_id = get_zm_shop_id(cur)

        # ===== ПРОВЕРКА ДОСТУПА =====
        if method == 'GET' and action == 'check-access':
            return ok({'hasAccess': True, 'isCeo': is_ceo, 'role': user['role'], 'name': user['name']})

        # ===== ТОВАРЫ =====
        if action in ('', 'products') or not action:

            if method == 'GET':
                pid = query.get('id')
                if pid:
                    cur.execute(f"""
                        SELECT id, name, description, price, image_url as image,
                               category, in_stock as "inStock", brand, model, discount, created_at
                        FROM {SCHEMA}.products WHERE id = %s AND shop_id = %s
                    """, (pid, shop_id))
                    row = cur.fetchone()
                    if not row:
                        return err('Товар не найден', 404)
                    return ok({'product': dict(row)})
                else:
                    cur.execute(f"""
                        SELECT id, name, description, price, image_url as image,
                               category, in_stock as "inStock", brand, model, discount, created_at
                        FROM {SCHEMA}.products WHERE shop_id = %s
                        ORDER BY created_at DESC
                    """, (shop_id,))
                    return ok({'products': [dict(r) for r in cur.fetchall()]})

            if method == 'POST':
                b = json.loads(event.get('body', '{}'))
                if not b.get('name') or b.get('price') is None:
                    return err('name и price обязательны')
                discount = max(0, min(100, int(b.get('discount', 0) or 0)))
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.products
                    (name, description, price, image_url, category, in_stock, brand, model, discount, shop_id)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
                """, (
                    b.get('name'), b.get('description', ''), b.get('price'),
                    b.get('image', ''), b.get('category', ''), b.get('inStock', True),
                    b.get('brand', ''), b.get('model', ''), discount, shop_id
                ))
                new_id = cur.fetchone()['id']
                conn.commit()
                return ok({'id': new_id, 'success': True}, 201)

            if method == 'PUT':
                pid = query.get('id')
                if not pid:
                    return err('id обязателен')
                b = json.loads(event.get('body', '{}'))
                discount = max(0, min(100, int(b.get('discount', 0) or 0)))
                cur.execute(f"""
                    UPDATE {SCHEMA}.products
                    SET name=%s, description=%s, price=%s, image_url=%s,
                        category=%s, in_stock=%s, brand=%s, model=%s, discount=%s, updated_at=NOW()
                    WHERE id=%s AND shop_id=%s
                """, (
                    b.get('name'), b.get('description', ''), b.get('price'),
                    b.get('image', ''), b.get('category', ''), b.get('inStock', True),
                    b.get('brand', ''), b.get('model', ''), discount, pid, shop_id
                ))
                conn.commit()
                return ok({'success': True})

            if method == 'DELETE':
                pid = query.get('id')
                if not pid:
                    return err('id обязателен')
                cur.execute(f"DELETE FROM {SCHEMA}.products WHERE id=%s AND shop_id=%s", (pid, shop_id))
                conn.commit()
                return ok({'success': True})

        # ===== ПРОДАВЦЫ (только CEO) =====
        if action == 'sellers':
            if not is_ceo:
                return err('Только CEO', 403)

            if method == 'GET':
                cur.execute(f"""
                    SELECT ss.id, ss.user_id, ss.telegram_id, ss.full_name,
                           ss.role, ss.is_active, ss.assigned_at,
                           u.name as user_name, u.email
                    FROM {SCHEMA}.store_sellers ss
                    LEFT JOIN {SCHEMA}.users u ON u.id::text = ss.user_id
                    ORDER BY ss.assigned_at DESC
                """)
                return ok({'sellers': [dict(r) for r in cur.fetchall()]})

            if method == 'POST':
                b = json.loads(event.get('body', '{}'))
                user_id_new = b.get('user_id', '')
                full_name = b.get('full_name', '')
                telegram_id = b.get('telegram_id', '')
                role = b.get('role', 'seller')
                if not user_id_new or not full_name:
                    return err('user_id и full_name обязательны')
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.store_sellers
                    (user_id, telegram_id, full_name, role, is_active, assigned_by)
                    VALUES (%s, %s, %s, %s, true, %s) RETURNING id
                """, (str(user_id_new), telegram_id, full_name, role, str(user['id'])))
                new_id = cur.fetchone()['id']
                conn.commit()
                return ok({'id': new_id, 'success': True}, 201)

            if method == 'PUT':
                b = json.loads(event.get('body', '{}'))
                sid = b.get('id')
                if not sid:
                    return err('id обязателен')
                is_active = b.get('is_active')
                role = b.get('role')
                if is_active is not None:
                    cur.execute(f"UPDATE {SCHEMA}.store_sellers SET is_active=%s WHERE id=%s", (is_active, sid))
                if role is not None:
                    cur.execute(f"UPDATE {SCHEMA}.store_sellers SET role=%s WHERE id=%s", (role, sid))
                conn.commit()
                return ok({'success': True})

            if method == 'DELETE':
                sid = query.get('id')
                if not sid:
                    return err('id обязателен')
                cur.execute(f"DELETE FROM {SCHEMA}.store_sellers WHERE id=%s", (sid,))
                conn.commit()
                return ok({'success': True})

        return err('Unknown action', 400)

    except Exception as e:
        conn.rollback()
        print(f"[ZM-STORE ERROR] {e}")
        return err(str(e), 500)
    finally:
        cur.close()
        conn.close()