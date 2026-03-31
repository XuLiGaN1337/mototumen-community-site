-- Сначала очищаем yandex у дубля чтобы не было конфликта уникальности
UPDATE users SET yandex_id = NULL, yandex_login = NULL, yandex_display_name = NULL, is_hidden = true WHERE id = 11;

-- Затем привязываем яндекс к основному профилю
UPDATE users SET yandex_id = '1736988352', yandex_login = 'Antonygenevezy72', yandex_display_name = 'Antonygenevezy72' WHERE id = 3;