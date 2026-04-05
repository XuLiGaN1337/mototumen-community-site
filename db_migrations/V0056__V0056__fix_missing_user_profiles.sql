INSERT INTO t_p21120869_mototumen_community_.user_profiles (user_id)
SELECT u.id FROM t_p21120869_mototumen_community_.users u
LEFT JOIN t_p21120869_mototumen_community_.user_profiles p ON p.user_id = u.id
WHERE p.user_id IS NULL;
