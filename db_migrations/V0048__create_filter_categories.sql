CREATE TABLE IF NOT EXISTS t_p21120869_mototumen_community_.filter_categories (
    id SERIAL PRIMARY KEY,
    section VARCHAR(50) NOT NULL,
    label VARCHAR(100) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_filter_categories_section ON t_p21120869_mototumen_community_.filter_categories(section);

-- Начальные данные
INSERT INTO t_p21120869_mototumen_community_.filter_categories (section, label, sort_order) VALUES
-- Объявления
('announcements', 'Продажа', 1),
('announcements', 'Покупка', 2),
('announcements', 'Попутчики', 3),
('announcements', 'Услуги', 4),
('announcements', 'Обучение', 5),
('announcements', 'Эвакуатор', 6),
('announcements', 'Общее', 7),
-- Магазины
('shops', 'Магазин', 1),
('shops', 'Тюнинг', 2),
('shops', 'Аксессуары', 3),
-- Сервисы
('services', 'Сервис', 1),
('services', 'Шиномонтаж', 2),
('services', 'Эвакуатор', 3),
-- Мотошколы
('schools', 'Мотошкола', 1),
('schools', 'Курсы вождения', 2),
('schools', 'Треки и тренировки', 3);