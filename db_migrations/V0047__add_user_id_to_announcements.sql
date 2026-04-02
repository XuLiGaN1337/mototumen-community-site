ALTER TABLE t_p21120869_mototumen_community_.announcements 
ADD COLUMN IF NOT EXISTS user_id integer REFERENCES t_p21120869_mototumen_community_.users(id);