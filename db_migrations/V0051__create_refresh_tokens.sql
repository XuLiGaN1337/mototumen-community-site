CREATE TABLE IF NOT EXISTS t_p21120869_mototumen_community_.refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES t_p21120869_mototumen_community_.users(id),
    token_hash VARCHAR(64) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON t_p21120869_mototumen_community_.refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON t_p21120869_mototumen_community_.refresh_tokens(token_hash);