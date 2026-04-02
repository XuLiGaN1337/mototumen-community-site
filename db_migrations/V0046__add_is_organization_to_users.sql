ALTER TABLE t_p21120869_mototumen_community_.users ADD COLUMN IF NOT EXISTS is_organization boolean NOT NULL DEFAULT false;

-- Выдаём всем у кого уже есть активная организация
UPDATE t_p21120869_mototumen_community_.users u
SET is_organization = true
WHERE EXISTS (
    SELECT 1 FROM t_p21120869_mototumen_community_.organizations o
    WHERE o.user_id = u.id AND o.is_active = true
);