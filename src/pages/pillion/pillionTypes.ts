export const API_URL =
  "https://functions.poehali.dev/9c00014f-3839-44bc-900d-0a59358d4e97";

// ─── ТИПЫ ─────────────────────────────────────────────────────────────────────

export interface Pilot {
  id: number;
  user_id: number;
  moto_brand: string;
  moto_model: string;
  experience_years: number;
  has_helmet: boolean;
  has_jacket: boolean;
  has_gloves: boolean;
  riding_style: "спокойный" | "смешанный" | "активный";
  about: string;
  contact: string;
  preferred_dates: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  name: string;
  avatar_url?: string;
  gender?: string;
  rating_avg: number;
  rating_count: number;
}

export interface Passenger {
  id: number;
  user_id: number;
  experience_years: number;
  has_helmet: boolean;
  has_jacket: boolean;
  has_gloves: boolean;
  about: string;
  contact: string;
  preferred_dates: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  name: string;
  avatar_url?: string;
  gender?: string;
  rating_avg: number;
  rating_count: number;
}

export interface Review {
  id: number;
  target_user_id: number;
  target_type: "pilot" | "passenger";
  author_user_id: number;
  rating: number;
  comment: string;
  created_at: string;
  author_name: string;
  author_avatar?: string;
}

// ─── УТИЛИТЫ ──────────────────────────────────────────────────────────────────

export const getDefaultAvatar = (name: string, gender?: string) =>
  gender === "female"
    ? "/img/323010ec-ee00-4bf5-b69e-88189dbc69e9.jpg"
    : "/img/5732fd0a-94d2-4175-8e07-8d3c8aed2373.jpg";

export const styleColor = (style: string) => {
  if (style === "спокойный") return "bg-green-500/20 text-green-400 border-green-500/40";
  if (style === "активный") return "bg-red-500/20 text-red-400 border-red-500/40";
  return "bg-yellow-500/20 text-yellow-400 border-yellow-500/40";
};

export const formatDate = (d: string) => {
  try {
    return new Date(d).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return d;
  }
};

// ─── ПУСТЫЕ ФОРМЫ ─────────────────────────────────────────────────────────────

export const emptyPilotForm = () => ({
  moto_brand: "",
  moto_model: "",
  experience_years: 1,
  has_helmet: false,
  has_jacket: false,
  has_gloves: false,
  riding_style: "спокойный" as const,
  about: "",
  contact: "",
  preferred_dates: [] as string[],
  is_active: true,
});

export const emptyPassengerForm = () => ({
  experience_years: 0,
  has_helmet: false,
  has_jacket: false,
  has_gloves: false,
  about: "",
  contact: "",
  preferred_dates: [] as string[],
  is_active: true,
});