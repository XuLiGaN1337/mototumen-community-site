ALTER TABLE t_p21120869_mototumen_community_.products
  ADD COLUMN IF NOT EXISTS stock_quantity integer NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0);