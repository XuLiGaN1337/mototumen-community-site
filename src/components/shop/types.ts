export interface ShopData {
  id: number;
  name: string;
  category: string;
  description: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  working_hours?: string;
  image?: string;
  rating?: number;
  is_open?: boolean;
  latitude?: number;
  longitude?: number;
  organization_id?: number;
  created_at?: string;
  // legacy fields (kept for backward compat)
  shortAddress?: string;
  shortWorkTime?: string;
  openTime?: number;
  closeTime?: number;
  icon?: string;
  color?: string;
}

export interface ShopStatusResult {
  status: string;
  color: string;
  dotColor: string;
}
