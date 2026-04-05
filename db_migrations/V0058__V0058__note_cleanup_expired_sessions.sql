-- Удаляем все просроченные сессии
UPDATE t_p21120869_mototumen_community_.user_sessions 
SET expires_at = expires_at 
WHERE expires_at <= NOW() AND expires_at = expires_at;
