ALTER TABLE t_p21120869_mototumen_community_.users 
ADD COLUMN IF NOT EXISTS custom_id varchar(32) UNIQUE;

-- Уникальный индекс
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_custom_id 
ON t_p21120869_mototumen_community_.users(custom_id) 
WHERE custom_id IS NOT NULL;