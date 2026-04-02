export interface WorkSchedule {
  day: string;
  hours: string;
}

export interface SchoolData {
  id: number;
  name: string;
  description: string;
  category: string;
  // поля из таблицы shops (новые организации)
  image?: string;
  address?: string;
  working_hours?: string;
  phone?: string;
  email?: string;
  website?: string;
  rating?: number;
  is_open?: boolean;
  organization_id?: number;
  // legacy поля (старые данные)
  location?: string;
  hours?: string;
  price?: string;
  experience?: string;
  instructor?: string;
  courses?: string[];
  features?: string[];
  addresses?: { name: string; yandexUrl: string }[];
  schedule?: WorkSchedule[];
}
