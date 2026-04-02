# v2
import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any, Optional

SCHEMA = 't_p21120869_mototumen_community_'

def get_db_connection():
    database_url = os.environ.get('DATABASE_URL')
    return psycopg2.connect(database_url, cursor_factory=RealDictCursor)

def get_user_from_token(cur, token: str) -> Optional[dict]:
    cur.execute(f"""
        SELECT u.id, u.name, u.email
        FROM {SCHEMA}.users u
        JOIN {SCHEMA}.user_sessions s ON u.id = s.user_id
        WHERE s.token = '{token}' AND s.expires_at > NOW()
    """)
    return cur.fetchone()

def get_header(headers: dict, name: str) -> Optional[str]:
    name_lower = name.lower()
    for key, val in headers.items():
        if key.lower() == name_lower:
            return val
    return None

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: API для работы с контентом сайта (магазины, школы, сервисы, объявления, организации)
    Args: event - dict с httpMethod, body, queryStringParameters, pathParams
          context - объект с request_id
    Returns: HTTP response dict
    '''
    method: str = event.get('httpMethod', 'GET')
    query_params = event.get('queryStringParameters', {})
    path_params = event.get('pathParams', {})
    path = event.get('path', '')
    
    # Debug logging
    print(f"DEBUG: path={path}, pathParams={path_params}, method={method}")
    
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
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        content_type = query_params.get('type', 'shops')
        
        if content_type == 'organization':
            org_id = int(query_params.get('id', 0))
            
            cur.execute(f"""
                SELECT id, user_id, name, type, description, logo, cover_image, 
                       address, phone, email, website, working_hours, rating, verified, created_at
                FROM organizations
                WHERE id = {org_id}
            """)
            org = cur.fetchone()
            
            if not org:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Organization not found'}),
                    'isBase64Encoded': False
                }
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(dict(org), default=str),
                'isBase64Encoded': False
            }
        
        if content_type == 'organization_items':
            org_id = int(query_params.get('id', 0))
            
            cur.execute(f"""
                SELECT id, name, description, category, image, rating, location as address, 
                       phone, phones, website, organization_id, is_open, working_hours,
                       latitude, longitude, email
                FROM shops
                WHERE organization_id = {org_id}
                ORDER BY created_at DESC
            """)
            items = cur.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps([dict(item) for item in items], default=str),
                'isBase64Encoded': False
            }
        
        # Товары/услуги конкретной организации
        if method == 'GET' and query_params.get('org_id'):
            org_id = query_params.get('org_id')
            cur.execute(f"""
                SELECT s.id, s.name, s.description, s.category, s.image, s.image_url,
                       s.price, s.phone, s.address, s.working_hours, s.website,
                       s.rating, s.created_at
                FROM shops s
                WHERE s.organization_id = {org_id}
                  AND (s.is_archived IS NULL OR s.is_archived = false)
                ORDER BY s.created_at DESC
            """)
            items = cur.fetchall()
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps([dict(r) for r in items], default=str),
                'isBase64Encoded': False
            }

        if method == 'GET':
            category = query_params.get('category')
            search = query_params.get('search')
            
            # shops / services / schools — список организаций из таблицы organizations
            CAT_MAP = {'shops': 'Магазин', 'services': 'Сервис', 'schools': 'Мотошкола'}

            if content_type in ('shops', 'services', 'schools'):
                cat_filter = CAT_MAP[content_type]
                base = f"""
                    SELECT o.id, o.name, o.description, o.category,
                           o.address, o.phone, o.email, o.website,
                           o.working_hours, o.rating, o.logo as image,
                           o.org_request_id, o.created_at
                    FROM organizations o
                    WHERE o.is_active = true
                      AND o.category = '{cat_filter}'
                """
                if search:
                    escaped_search = search.replace("'", "''")
                    base += f" AND (o.name ILIKE '%{escaped_search}%' OR o.description ILIKE '%{escaped_search}%')"

                base += " ORDER BY o.created_at DESC"
                cur.execute(base)
                
            elif content_type == 'announcements':
                my = query_params.get('my') == 'true'
                if my:
                    # Мои объявления — только авторизованный пользователь
                    headers = event.get('headers', {})
                    token = get_header(headers, 'X-Auth-Token') or get_header(headers, 'X-Authorization')
                    if not token:
                        return {'statusCode': 401, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Требуется авторизация'}), 'isBase64Encoded': False}
                    auth_user = get_user_from_token(cur, token)
                    if not auth_user:
                        return {'statusCode': 401, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Неверный токен'}), 'isBase64Encoded': False}
                    query = f"SELECT * FROM {SCHEMA}.announcements WHERE user_id = {auth_user['id']} AND status != 'archived'"
                else:
                    query = f"SELECT * FROM {SCHEMA}.announcements WHERE status = 'active'"
                
                if category and category != 'Все':
                    escaped_cat = category.replace("'", "''")
                    query += f" AND category = '{escaped_cat}'"
                
                if search:
                    escaped_search = search.replace("'", "''")
                    query += f" AND (title ILIKE '%{escaped_search}%' OR description ILIKE '%{escaped_search}%')"
                
                query += " ORDER BY created_at DESC"
                cur.execute(query)
            else:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Invalid content type'}),
                    'isBase64Encoded': False
                }
            
            results = cur.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps([dict(row) for row in results], default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            
            def escape(val):
                if val is None:
                    return 'NULL'
                if isinstance(val, (int, float)):
                    return str(val)
                escaped = str(val).replace("'", "''")
                return f"'{escaped}'"
            
            if content_type == 'shops':
                cur.execute(f"""
                    INSERT INTO shops (name, description, category, image, rating, location, phone, website) 
                    VALUES ({escape(body_data.get('name'))}, {escape(body_data.get('description'))}, 
                            {escape(body_data.get('category'))}, {escape(body_data.get('image'))}, 
                            {body_data.get('rating', 0)}, {escape(body_data.get('location'))},
                            {escape(body_data.get('phone'))}, {escape(body_data.get('website'))})
                    RETURNING id
                """)
                
            elif content_type == 'schools':
                cur.execute(f"""
                    INSERT INTO schools (name, description, category, image, rating, hours, location, phone, price, website) 
                    VALUES ({escape(body_data.get('name'))}, {escape(body_data.get('description'))}, 
                            {escape(body_data.get('category'))}, {escape(body_data.get('image'))}, 
                            {body_data.get('rating', 0)}, {escape(body_data.get('hours'))},
                            {escape(body_data.get('location'))}, {escape(body_data.get('phone'))}, 
                            {escape(body_data.get('price'))}, {escape(body_data.get('website'))})
                    RETURNING id
                """)
                school_id = cur.fetchone()['id']
                
                for course in body_data.get('courses', []):
                    cur.execute(f"INSERT INTO school_courses (school_id, course_name) VALUES ({school_id}, {escape(course)})")
                    
            elif content_type == 'services':
                cur.execute(f"""
                    INSERT INTO services (name, description, category, image, rating, hours, location, phone, website) 
                    VALUES ({escape(body_data.get('name'))}, {escape(body_data.get('description'))}, 
                            {escape(body_data.get('category'))}, {escape(body_data.get('image'))}, 
                            {body_data.get('rating', 0)}, {escape(body_data.get('hours'))},
                            {escape(body_data.get('location'))}, {escape(body_data.get('phone'))}, 
                            {escape(body_data.get('website'))})
                    RETURNING id
                """)
                service_id = cur.fetchone()['id']
                
                for service in body_data.get('services', []):
                    cur.execute(f"INSERT INTO service_items (service_id, service_name) VALUES ({service_id}, {escape(service)})")
                    
            elif content_type == 'announcements':
                headers = event.get('headers', {})
                token = get_header(headers, 'X-Auth-Token') or get_header(headers, 'X-Authorization')
                if not token:
                    return {'statusCode': 401, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Требуется авторизация'}), 'isBase64Encoded': False}
                auth_user = get_user_from_token(cur, token)
                if not auth_user:
                    return {'statusCode': 401, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Неверный токен'}), 'isBase64Encoded': False}
                author_name = auth_user['name']
                user_id = auth_user['id']
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.announcements (title, description, category, image, author, contact, price, location, user_id) 
                    VALUES ({escape(body_data.get('title'))}, {escape(body_data.get('description'))}, 
                            {escape(body_data.get('category'))}, {escape(body_data.get('image'))}, 
                            {escape(author_name)}, {escape(body_data.get('contact'))},
                            {escape(body_data.get('price'))}, {escape(body_data.get('location'))}, {user_id})
                    RETURNING id
                """)
            
            conn.commit()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            item_id = body_data.get('id')
            
            if not item_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'ID is required'}),
                    'isBase64Encoded': False
                }
            
            def escape(val):
                if val is None:
                    return 'NULL'
                if isinstance(val, (int, float)):
                    return str(val)
                escaped = str(val).replace("'", "''")
                return f"'{escaped}'"
            
            if content_type == 'shops':
                cur.execute(f"""
                    UPDATE shops SET 
                        name={escape(body_data.get('name'))}, 
                        description={escape(body_data.get('description'))}, 
                        category={escape(body_data.get('category'))},
                        image={escape(body_data.get('image'))}, 
                        rating={body_data.get('rating', 0)}, 
                        location={escape(body_data.get('location'))},
                        phone={escape(body_data.get('phone'))}, 
                        website={escape(body_data.get('website'))}, 
                        updated_at=CURRENT_TIMESTAMP 
                    WHERE id={item_id}
                """)
                
            elif content_type == 'schools':
                cur.execute(f"""
                    UPDATE schools SET 
                        name={escape(body_data.get('name'))}, 
                        description={escape(body_data.get('description'))}, 
                        category={escape(body_data.get('category'))},
                        image={escape(body_data.get('image'))}, 
                        rating={body_data.get('rating', 0)}, 
                        hours={escape(body_data.get('hours'))},
                        location={escape(body_data.get('location'))}, 
                        phone={escape(body_data.get('phone'))}, 
                        price={escape(body_data.get('price'))},
                        website={escape(body_data.get('website'))}, 
                        updated_at=CURRENT_TIMESTAMP 
                    WHERE id={item_id}
                """)
                
            elif content_type == 'services':
                cur.execute(f"""
                    UPDATE services SET 
                        name={escape(body_data.get('name'))}, 
                        description={escape(body_data.get('description'))}, 
                        category={escape(body_data.get('category'))},
                        image={escape(body_data.get('image'))}, 
                        rating={body_data.get('rating', 0)}, 
                        hours={escape(body_data.get('hours'))},
                        location={escape(body_data.get('location'))}, 
                        phone={escape(body_data.get('phone'))}, 
                        website={escape(body_data.get('website'))}, 
                        updated_at=CURRENT_TIMESTAMP 
                    WHERE id={item_id}
                """)
                
            elif content_type == 'announcements':
                cur.execute(f"""
                    UPDATE announcements SET 
                        title={escape(body_data.get('title'))}, 
                        description={escape(body_data.get('description'))}, 
                        category={escape(body_data.get('category'))},
                        image={escape(body_data.get('image'))}, 
                        price={escape(body_data.get('price'))}, 
                        location={escape(body_data.get('location'))},
                        status={escape(body_data.get('status', 'active'))}, 
                        updated_at=CURRENT_TIMESTAMP 
                    WHERE id={item_id}
                """)
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            if content_type == 'announcements':
                headers = event.get('headers', {})
                token = get_header(headers, 'X-Auth-Token') or get_header(headers, 'X-Authorization')
                if not token:
                    return {'statusCode': 401, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Требуется авторизация'}), 'isBase64Encoded': False}
                auth_user = get_user_from_token(cur, token)
                if not auth_user:
                    return {'statusCode': 401, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Неверный токен'}), 'isBase64Encoded': False}
                body_data = json.loads(event.get('body', '{}'))
                ann_id = body_data.get('id')
                if not ann_id:
                    return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'id обязателен'}), 'isBase64Encoded': False}
                cur.execute(f"UPDATE {SCHEMA}.announcements SET status='archived' WHERE id={ann_id} AND user_id={auth_user['id']}")
                conn.commit()
                return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'success': True}), 'isBase64Encoded': False}

        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        conn.rollback()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    finally:
        cur.close()
        conn.close()