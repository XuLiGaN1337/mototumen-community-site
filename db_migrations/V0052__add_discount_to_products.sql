ALTER TABLE t_p21120869_mototumen_community_.products
  ADD COLUMN IF NOT EXISTS discount integer NOT NULL DEFAULT 0 CHECK (discount >= 0 AND discount <= 100);