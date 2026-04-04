
CREATE TABLE IF NOT EXISTS t_p21120869_mototumen_community_.pillion_pilots (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES t_p21120869_mototumen_community_.users(id),
    moto_brand VARCHAR(100) NOT NULL,
    moto_model VARCHAR(100) NOT NULL,
    experience_years INTEGER NOT NULL DEFAULT 0,
    has_helmet BOOLEAN NOT NULL DEFAULT false,
    has_jacket BOOLEAN NOT NULL DEFAULT false,
    has_gloves BOOLEAN NOT NULL DEFAULT false,
    riding_style VARCHAR(50) NOT NULL DEFAULT 'спокойный',
    about TEXT,
    contact VARCHAR(255),
    preferred_dates TEXT[],
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p21120869_mototumen_community_.pillion_passengers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES t_p21120869_mototumen_community_.users(id),
    experience_years INTEGER NOT NULL DEFAULT 0,
    has_helmet BOOLEAN NOT NULL DEFAULT false,
    has_jacket BOOLEAN NOT NULL DEFAULT false,
    has_gloves BOOLEAN NOT NULL DEFAULT false,
    about TEXT,
    contact VARCHAR(255),
    preferred_dates TEXT[],
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p21120869_mototumen_community_.pillion_reviews (
    id SERIAL PRIMARY KEY,
    target_user_id INTEGER NOT NULL REFERENCES t_p21120869_mototumen_community_.users(id),
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('pilot', 'passenger')),
    author_user_id INTEGER NOT NULL REFERENCES t_p21120869_mototumen_community_.users(id),
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (target_user_id, target_type, author_user_id)
);

CREATE INDEX IF NOT EXISTS idx_pillion_pilots_user_id ON t_p21120869_mototumen_community_.pillion_pilots(user_id);
CREATE INDEX IF NOT EXISTS idx_pillion_passengers_user_id ON t_p21120869_mototumen_community_.pillion_passengers(user_id);
CREATE INDEX IF NOT EXISTS idx_pillion_reviews_target ON t_p21120869_mototumen_community_.pillion_reviews(target_user_id, target_type);
