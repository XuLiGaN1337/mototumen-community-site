CREATE TABLE IF NOT EXISTS t_p21120869_mototumen_community_.user_photos (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES t_p21120869_mototumen_community_.users(id),
    photo_url TEXT NOT NULL,
    source VARCHAR(20) NOT NULL DEFAULT 'avatar',
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_user_photos_user_id ON t_p21120869_mototumen_community_.user_photos(user_id);