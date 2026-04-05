CREATE TABLE "t_p21120869_mototumen_community_".events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    time VARCHAR(10),
    location VARCHAR(255),
    category VARCHAR(100),
    price INTEGER DEFAULT 0,
    image_url TEXT,
    organizer_id INTEGER,
    organizer_name VARCHAR(255),
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
)