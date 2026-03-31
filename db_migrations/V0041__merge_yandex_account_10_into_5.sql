-- Очищаем yandex у дубля чтобы не было конфликта уникальности
UPDATE users SET yandex_id = NULL, yandex_login = NULL, yandex_display_name = NULL, is_hidden = true WHERE id = 10;

-- Привязываем яндекс к основному профилю
UPDATE users SET yandex_id = '335091968', yandex_login = 'ksynechka.ageeva', yandex_display_name = 'KsyNechka Ageeva' WHERE id = 5;