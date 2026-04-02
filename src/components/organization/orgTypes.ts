export const ORG_API = 'https://functions.poehali.dev/f34bd996-f5f2-4c81-8b7b-fb5621187a7f';

export const SHOP_CATEGORIES = [
  'Магазин мототехники',
  'Сервис',
  'Мотошкола',
  'Мотоклуб',
  'Прокат',
  'Туристический центр',
  'Другое',
];

export interface Shop {
  id?: number;
  organization_id: number;
  name: string;
  description: string;
  category: string;
  address: string;
  phone: string;
  phones?: string[];
  email: string;
  website?: string;
  working_hours?: string;
  is_open?: boolean;
  latitude?: number;
  longitude?: number;
  image_url?: string;
}

export interface Organization {
  id: number;
  organization_name: string;
  organization_type: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  working_hours?: string;
  status: string;
}

export function getCardLabel(orgType?: string): string {
  const t = (orgType || '').toLowerCase();
  if (t.includes('сервис') || t.includes('service')) return 'сервиса';
  if (t.includes('школ') || t.includes('school')) return 'мотошколы';
  if (t.includes('клуб') || t.includes('club')) return 'клуба';
  if (t.includes('прокат') || t.includes('rent')) return 'проката';
  return 'магазина';
}

export function getCardLabelPlural(orgType?: string): string {
  const s = getCardLabel(orgType);
  return s === 'магазина' ? 'магазинов' : s;
}
