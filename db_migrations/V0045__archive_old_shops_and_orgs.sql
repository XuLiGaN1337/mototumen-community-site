-- Архивируем все старые записи
UPDATE t_p21120869_mototumen_community_.shops SET is_archived = true WHERE id > 0;
UPDATE t_p21120869_mototumen_community_.organizations SET is_active = false WHERE id > 0;