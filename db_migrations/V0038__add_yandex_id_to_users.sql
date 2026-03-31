ALTER TABLE users ADD COLUMN IF NOT EXISTS yandex_id VARCHAR(64) UNIQUE;
CREATE INDEX IF NOT EXISTS idx_users_yandex_id ON users(yandex_id);