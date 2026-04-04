import React, { useState, useEffect, useCallback } from "react";
import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const API_URL =
  "https://functions.poehali.dev/9c00014f-3839-44bc-900d-0a59358d4e97";

// ─── ТИПЫ ─────────────────────────────────────────────────────────────────────

interface Pilot {
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

interface Passenger {
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

interface Review {
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

// ─── ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ──────────────────────────────────────────────────

const getDefaultAvatar = (name: string, gender?: string) =>
  gender === "female"
    ? "/img/323010ec-ee00-4bf5-b69e-88189dbc69e9.jpg"
    : "/img/5732fd0a-94d2-4175-8e07-8d3c8aed2373.jpg";

const renderStars = (rating: number, size: "sm" | "lg" = "sm") => {
  const cls = size === "lg" ? "text-xl" : "text-sm";
  return (
    <span className={cls}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= Math.round(rating) ? "text-yellow-400" : "text-zinc-600"}>
          {i <= Math.round(rating) ? "★" : "☆"}
        </span>
      ))}
    </span>
  );
};

const renderGear = (has_helmet: boolean, has_jacket: boolean, has_gloves: boolean) => (
  <div className="flex gap-2">
    <span title="Шлем">
      <Icon
        name="HardHat"
        size={16}
        className={has_helmet ? "text-green-400" : "text-zinc-600"}
      />
    </span>
    <span title="Куртка">
      <Icon
        name="Shirt"
        size={16}
        className={has_jacket ? "text-green-400" : "text-zinc-600"}
      />
    </span>
    <span title="Перчатки">
      <Icon
        name="Hand"
        size={16}
        className={has_gloves ? "text-green-400" : "text-zinc-600"}
      />
    </span>
  </div>
);

const styleColor = (style: string) => {
  if (style === "спокойный") return "bg-green-500/20 text-green-400 border-green-500/40";
  if (style === "активный") return "bg-red-500/20 text-red-400 border-red-500/40";
  return "bg-yellow-500/20 text-yellow-400 border-yellow-500/40";
};

const formatDate = (d: string) => {
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

const emptyPilotForm = () => ({
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

const emptyPassengerForm = () => ({
  experience_years: 0,
  has_helmet: false,
  has_jacket: false,
  has_gloves: false,
  about: "",
  contact: "",
  preferred_dates: [] as string[],
  is_active: true,
});

// ─── АВАТАР ───────────────────────────────────────────────────────────────────

const Avatar: React.FC<{
  src?: string;
  name: string;
  gender?: string;
  size?: "sm" | "lg";
}> = ({ src, name, gender, size = "sm" }) => {
  const [err, setErr] = useState(false);
  const cls = size === "lg" ? "w-20 h-20 text-2xl" : "w-14 h-14 text-lg";
  const imgSrc = !err && src ? src : getDefaultAvatar(name, gender);

  return (
    <div className={`${cls} rounded-full overflow-hidden flex-shrink-0 bg-zinc-700`}>
      <img
        src={imgSrc}
        alt={name}
        className="w-full h-full object-cover"
        onError={() => setErr(true)}
      />
    </div>
  );
};

// ─── ЗВЁЗДНЫЙ ВЫБОР ───────────────────────────────────────────────────────────

const StarPicker: React.FC<{ value: number; onChange: (v: number) => void }> = ({
  value,
  onChange,
}) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((i) => (
      <button
        key={i}
        type="button"
        onClick={() => onChange(i)}
        className={`text-2xl transition-colors ${
          i <= value ? "text-yellow-400" : "text-zinc-600 hover:text-yellow-300"
        }`}
      >
        ★
      </button>
    ))}
  </div>
);

// ─── КАРТОЧКА ПИЛОТА ──────────────────────────────────────────────────────────

const PilotCard: React.FC<{ pilot: Pilot; onClick: () => void }> = ({
  pilot,
  onClick,
}) => (
  <div
    className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 hover:border-orange-500/50 transition-all cursor-pointer flex flex-col gap-3"
    onClick={onClick}
  >
    <div className="flex items-start gap-3">
      <Avatar src={pilot.avatar_url} name={pilot.name} gender={pilot.gender} />
      <div className="flex-1 min-w-0">
        <p className="text-gray-300 text-sm truncate">{pilot.name}</p>
        <p className="font-['Oswald'] text-lg text-white leading-tight">
          {pilot.moto_brand} {pilot.moto_model}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-gray-400 text-xs">Стаж: {pilot.experience_years} л.</span>
          <Badge className={`text-xs border ${styleColor(pilot.riding_style)}`}>
            {pilot.riding_style}
          </Badge>
        </div>
      </div>
    </div>

    <div className="flex items-center justify-between">
      {renderGear(pilot.has_helmet, pilot.has_jacket, pilot.has_gloves)}
      <div className="flex items-center gap-1">
        {renderStars(pilot.rating_avg)}
        <span className="text-gray-500 text-xs">({pilot.rating_count})</span>
      </div>
    </div>

    {pilot.is_active && pilot.preferred_dates?.length > 0 && (
      <div className="flex flex-wrap gap-1">
        {pilot.preferred_dates.slice(0, 3).map((d, i) => (
          <span
            key={i}
            className="text-xs bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded px-2 py-0.5"
          >
            {formatDate(d)}
          </span>
        ))}
      </div>
    )}

    <Button
      size="sm"
      variant="outline"
      className="w-full border-zinc-600 text-gray-300 hover:text-white hover:border-orange-500/60 mt-auto"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      Подробнее
    </Button>
  </div>
);

// ─── КАРТОЧКА ПАССАЖИРА ───────────────────────────────────────────────────────

const PassengerCard: React.FC<{ passenger: Passenger; onClick: () => void }> = ({
  passenger,
  onClick,
}) => (
  <div
    className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 hover:border-orange-500/50 transition-all cursor-pointer flex flex-col gap-3"
    onClick={onClick}
  >
    <div className="flex items-start gap-3">
      <Avatar
        src={passenger.avatar_url}
        name={passenger.name}
        gender={passenger.gender}
      />
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium truncate">{passenger.name}</p>
        <p className="text-gray-400 text-sm">
          Опыт двойкой:{" "}
          {passenger.experience_years > 0
            ? `${passenger.experience_years} л.`
            : "нет опыта"}
        </p>
      </div>
    </div>

    <div className="flex items-center justify-between">
      {renderGear(passenger.has_helmet, passenger.has_jacket, passenger.has_gloves)}
      <div className="flex items-center gap-1">
        {renderStars(passenger.rating_avg)}
        <span className="text-gray-500 text-xs">({passenger.rating_count})</span>
      </div>
    </div>

    {passenger.is_active && passenger.preferred_dates?.length > 0 && (
      <div className="flex flex-wrap gap-1">
        {passenger.preferred_dates.slice(0, 3).map((d, i) => (
          <span
            key={i}
            className="text-xs bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded px-2 py-0.5"
          >
            {formatDate(d)}
          </span>
        ))}
      </div>
    )}

    <Button
      size="sm"
      variant="outline"
      className="w-full border-zinc-600 text-gray-300 hover:text-white hover:border-orange-500/60 mt-auto"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      Подробнее
    </Button>
  </div>
);

// ─── МОДАЛ ДЕТАЛЕЙ ────────────────────────────────────────────────────────────

interface DetailModalProps {
  open: boolean;
  onClose: () => void;
  type: "pilot" | "passenger";
  pilot?: Pilot;
  passenger?: Passenger;
  currentUserId?: number;
  token?: string | null;
  onReviewSent: () => void;
}

const DetailModal: React.FC<DetailModalProps> = ({
  open,
  onClose,
  type,
  pilot,
  passenger,
  currentUserId,
  token,
  onReviewSent,
}) => {
  const { toast } = useToast();
  const item = type === "pilot" ? pilot : passenger;
  const targetUserId = item?.user_id;

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [sendingReview, setSendingReview] = useState(false);

  const isOwn = currentUserId !== undefined && targetUserId === currentUserId;
  const canReview = !!token && !isOwn;

  const loadReviews = useCallback(async () => {
    if (!targetUserId) return;
    setLoadingReviews(true);
    try {
      const r = await fetch(
        `${API_URL}?action=reviews&user_id=${targetUserId}&type=${type}`
      );
      const d = await r.json();
      setReviews(Array.isArray(d) ? d : []);
    } catch {
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  }, [targetUserId, type]);

  useEffect(() => {
    if (open) {
      loadReviews();
      setReviewRating(5);
      setReviewComment("");
    }
  }, [open, loadReviews]);

  const submitReview = async () => {
    if (!token || !targetUserId) return;
    setSendingReview(true);
    try {
      const r = await fetch(`${API_URL}?action=review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Token": token,
        },
        body: JSON.stringify({
          target_user_id: targetUserId,
          target_type: type,
          rating: reviewRating,
          comment: reviewComment,
        }),
      });
      if (r.ok) {
        toast({ title: "Отзыв отправлен" });
        setReviewComment("");
        setReviewRating(5);
        loadReviews();
        onReviewSent();
      } else {
        const d = await r.json();
        toast({ title: d.error || "Ошибка", variant: "destructive" });
      }
    } finally {
      setSendingReview(false);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-700 text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Карточка</DialogTitle>
        </DialogHeader>

        {/* Шапка */}
        <div className="flex items-start gap-4 mb-4">
          <Avatar
            src={item.avatar_url}
            name={item.name}
            gender={item.gender}
            size="lg"
          />
          <div className="flex-1">
            <p className="text-white text-xl font-bold">{item.name}</p>
            <Badge className="text-xs bg-orange-500/20 text-orange-400 border-orange-500/40 mt-1">
              {type === "pilot" ? "Пилот" : "Пассажир"}
            </Badge>
            <div className="flex items-center gap-2 mt-2">
              {renderStars(item.rating_avg, "lg")}
              <span className="text-gray-400 text-sm">
                {item.rating_avg > 0
                  ? item.rating_avg.toFixed(1)
                  : "нет оценок"}{" "}
                ({item.rating_count})
              </span>
            </div>
          </div>
        </div>

        {/* Данные пилота */}
        {type === "pilot" && pilot && (
          <div className="space-y-3 mb-4">
            <div className="bg-zinc-800 rounded-lg p-3">
              <p className="text-gray-400 text-xs uppercase mb-1">Мотоцикл</p>
              <p className="font-['Oswald'] text-xl text-white">
                {pilot.moto_brand} {pilot.moto_model}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-800 rounded-lg p-3">
                <p className="text-gray-400 text-xs uppercase mb-1">Стаж</p>
                <p className="text-white">{pilot.experience_years} лет</p>
              </div>
              <div className="bg-zinc-800 rounded-lg p-3">
                <p className="text-gray-400 text-xs uppercase mb-1">Стиль</p>
                <Badge className={`text-xs border ${styleColor(pilot.riding_style)}`}>
                  {pilot.riding_style}
                </Badge>
              </div>
            </div>
            <div className="bg-zinc-800 rounded-lg p-3">
              <p className="text-gray-400 text-xs uppercase mb-2">Экипировка</p>
              <div className="flex gap-4">
                <div className={`flex items-center gap-1 text-sm ${pilot.has_helmet ? "text-green-400" : "text-zinc-500"}`}>
                  <Icon name="HardHat" size={14} />
                  Шлем
                </div>
                <div className={`flex items-center gap-1 text-sm ${pilot.has_jacket ? "text-green-400" : "text-zinc-500"}`}>
                  <Icon name="Shirt" size={14} />
                  Куртка
                </div>
                <div className={`flex items-center gap-1 text-sm ${pilot.has_gloves ? "text-green-400" : "text-zinc-500"}`}>
                  <Icon name="Hand" size={14} />
                  Перчатки
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Данные пассажира */}
        {type === "passenger" && passenger && (
          <div className="space-y-3 mb-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-800 rounded-lg p-3">
                <p className="text-gray-400 text-xs uppercase mb-1">Опыт двойкой</p>
                <p className="text-white">
                  {passenger.experience_years > 0
                    ? `${passenger.experience_years} лет`
                    : "Нет опыта"}
                </p>
              </div>
              <div className="bg-zinc-800 rounded-lg p-3">
                <p className="text-gray-400 text-xs uppercase mb-2">Экипировка</p>
                {renderGear(
                  passenger.has_helmet,
                  passenger.has_jacket,
                  passenger.has_gloves
                )}
              </div>
            </div>
          </div>
        )}

        {/* О себе */}
        {item.about && (
          <div className="bg-zinc-800 rounded-lg p-3 mb-4">
            <p className="text-gray-400 text-xs uppercase mb-1">О себе</p>
            <p className="text-gray-300 text-sm leading-relaxed">{item.about}</p>
          </div>
        )}

        {/* Даты */}
        {item.is_active && item.preferred_dates?.length > 0 && (
          <div className="mb-4">
            <p className="text-gray-400 text-xs uppercase mb-2">Ближайшие даты</p>
            <div className="flex flex-wrap gap-2">
              {item.preferred_dates.map((d, i) => (
                <span
                  key={i}
                  className="text-sm bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded px-3 py-1"
                >
                  {formatDate(d)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Контакт — только для авторизованных */}
        {token && item.contact && (
          <div className="bg-zinc-800 rounded-lg p-3 mb-4">
            <p className="text-gray-400 text-xs uppercase mb-1">Для связи</p>
            <p className="text-orange-400 font-medium">{item.contact}</p>
          </div>
        )}

        {!token && (
          <p className="text-gray-500 text-xs mb-4 text-center">
            Войдите, чтобы увидеть контакты и оставить отзыв
          </p>
        )}

        {/* Кнопка написать */}
        <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white mb-6">
          <Icon name="MessageCircle" size={16} className="mr-2" />
          Написать
        </Button>

        {/* Отзывы */}
        <div>
          <p className="text-white font-semibold mb-3">
            Отзывы ({reviews.length})
          </p>

          {loadingReviews ? (
            <div className="flex justify-center py-4">
              <Icon name="Loader2" size={20} className="animate-spin text-gray-400" />
            </div>
          ) : reviews.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">
              Пока нет отзывов
            </p>
          ) : (
            <div className="space-y-3 mb-4">
              {reviews.map((rv) => (
                <div key={rv.id} className="bg-zinc-800 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-full overflow-hidden bg-zinc-700 flex-shrink-0">
                      <img
                        src={
                          rv.author_avatar ||
                          getDefaultAvatar(rv.author_name)
                        }
                        alt={rv.author_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            getDefaultAvatar(rv.author_name);
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <span className="text-white text-sm font-medium">
                        {rv.author_name}
                      </span>
                      <span className="text-gray-500 text-xs ml-2">
                        {new Date(rv.created_at).toLocaleDateString("ru-RU")}
                      </span>
                    </div>
                    {renderStars(rv.rating)}
                  </div>
                  {rv.comment && (
                    <p className="text-gray-300 text-sm mt-1">{rv.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Форма отзыва */}
          {canReview && (
            <div className="border-t border-zinc-700 pt-4">
              <p className="text-gray-300 text-sm font-medium mb-3">
                Оставить отзыв
              </p>
              <div className="space-y-3">
                <div>
                  <Label className="text-gray-400 text-xs mb-1 block">
                    Оценка
                  </Label>
                  <StarPicker value={reviewRating} onChange={setReviewRating} />
                </div>
                <div>
                  <Label className="text-gray-400 text-xs mb-1 block">
                    Комментарий
                  </Label>
                  <Textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Расскажите о поездке..."
                    className="bg-zinc-800 border-zinc-600 text-white placeholder-gray-500 resize-none"
                    rows={3}
                  />
                </div>
                <Button
                  onClick={submitReview}
                  disabled={sendingReview}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {sendingReview ? (
                    <Icon name="Loader2" size={16} className="animate-spin mr-2" />
                  ) : (
                    <Icon name="Send" size={16} className="mr-2" />
                  )}
                  Оставить отзыв
                </Button>
              </div>
            </div>
          )}

          {token && isOwn && (
            <p className="text-gray-500 text-xs text-center mt-2">
              Нельзя оставить отзыв на собственную карточку
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ─── МОДАЛ СОЗДАНИЯ/РЕДАКТИРОВАНИЯ ПИЛОТА ─────────────────────────────────────

interface PilotFormModalProps {
  open: boolean;
  onClose: () => void;
  token: string;
  initial?: Partial<typeof emptyPilotForm extends () => infer R ? R : never>;
  onSaved: () => void;
}

const PilotFormModal: React.FC<PilotFormModalProps> = ({
  open,
  onClose,
  token,
  initial,
  onSaved,
}) => {
  const { toast } = useToast();
  const [form, setForm] = useState(emptyPilotForm());
  const [saving, setSaving] = useState(false);
  const [newDate, setNewDate] = useState("");

  useEffect(() => {
    if (open) {
      setForm(initial ? { ...emptyPilotForm(), ...initial } : emptyPilotForm());
      setNewDate("");
    }
  }, [open, initial]);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const addDate = () => {
    if (!newDate || form.preferred_dates.includes(newDate)) return;
    set("preferred_dates", [...form.preferred_dates, newDate]);
    setNewDate("");
  };

  const removeDate = (d: string) =>
    set(
      "preferred_dates",
      form.preferred_dates.filter((x) => x !== d)
    );

  const save = async () => {
    if (!form.moto_brand.trim() || !form.moto_model.trim()) {
      toast({ title: "Укажи марку и модель мотоцикла", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const r = await fetch(`${API_URL}?action=pilot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Token": token,
        },
        body: JSON.stringify(form),
      });
      if (r.ok) {
        toast({ title: "Карточка сохранена" });
        onSaved();
        onClose();
      } else {
        const d = await r.json();
        toast({ title: d.error || "Ошибка", variant: "destructive" });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-700 text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-lg font-bold">
            {initial ? "Редактировать карточку пилота" : "Создать карточку пилота"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-gray-400 text-xs mb-1 block">
                Марка мото *
              </Label>
              <Input
                value={form.moto_brand}
                onChange={(e) => set("moto_brand", e.target.value)}
                placeholder="Honda, Kawasaki..."
                className="bg-zinc-800 border-zinc-600 text-white placeholder-gray-500"
              />
            </div>
            <div>
              <Label className="text-gray-400 text-xs mb-1 block">
                Модель *
              </Label>
              <Input
                value={form.moto_model}
                onChange={(e) => set("moto_model", e.target.value)}
                placeholder="CBR600, Z900..."
                className="bg-zinc-800 border-zinc-600 text-white placeholder-gray-500"
              />
            </div>
          </div>

          <div>
            <Label className="text-gray-400 text-xs mb-1 block">
              Стаж (лет)
            </Label>
            <Input
              type="number"
              min={0}
              max={50}
              value={form.experience_years}
              onChange={(e) => set("experience_years", Number(e.target.value))}
              className="bg-zinc-800 border-zinc-600 text-white w-32"
            />
          </div>

          <div>
            <Label className="text-gray-400 text-xs mb-2 block">
              Стиль езды
            </Label>
            <div className="flex gap-3">
              {(["спокойный", "смешанный", "активный"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => set("riding_style", s)}
                  className={`px-3 py-1 rounded-lg text-sm border transition-all ${
                    form.riding_style === s
                      ? styleColor(s) + " border"
                      : "border-zinc-600 text-zinc-400 hover:border-zinc-400"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-gray-400 text-xs mb-2 block">
              Экипировка
            </Label>
            <div className="space-y-2">
              {(
                [
                  { key: "has_helmet", label: "Есть шлем для двойки" },
                  { key: "has_jacket", label: "Есть куртка для двойки" },
                  { key: "has_gloves", label: "Есть перчатки для двойки" },
                ] as const
              ).map(({ key, label }) => (
                <div key={key} className="flex items-center gap-2">
                  <Checkbox
                    id={`pilot-${key}`}
                    checked={form[key]}
                    onCheckedChange={(v) => set(key, !!v)}
                    className="border-zinc-500"
                  />
                  <label
                    htmlFor={`pilot-${key}`}
                    className="text-gray-300 text-sm cursor-pointer"
                  >
                    {label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-gray-400 text-xs mb-1 block">О себе</Label>
            <Textarea
              value={form.about}
              onChange={(e) => set("about", e.target.value)}
              placeholder="Расскажи немного о себе и своих поездках..."
              className="bg-zinc-800 border-zinc-600 text-white placeholder-gray-500 resize-none"
              rows={3}
            />
          </div>

          <div>
            <Label className="text-gray-400 text-xs mb-1 block">
              Контакт (Telegram или телефон)
            </Label>
            <Input
              value={form.contact}
              onChange={(e) => set("contact", e.target.value)}
              placeholder="@username или +7..."
              className="bg-zinc-800 border-zinc-600 text-white placeholder-gray-500"
            />
          </div>

          <div>
            <Label className="text-gray-400 text-xs mb-2 block">
              Ближайшие даты выезда
            </Label>
            <div className="flex gap-2 mb-2">
              <Input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="bg-zinc-800 border-zinc-600 text-white flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addDate}
                className="border-zinc-600 text-gray-300 hover:text-white"
              >
                <Icon name="Plus" size={16} />
              </Button>
            </div>
            {form.preferred_dates.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.preferred_dates.map((d) => (
                  <span
                    key={d}
                    className="flex items-center gap-1 text-xs bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded px-2 py-1"
                  >
                    {formatDate(d)}
                    <button
                      type="button"
                      onClick={() => removeDate(d)}
                      className="hover:text-red-400 ml-1"
                    >
                      <Icon name="X" size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="pilot-is_active"
              checked={form.is_active}
              onCheckedChange={(v) => set("is_active", !!v)}
              className="border-zinc-500"
            />
            <label
              htmlFor="pilot-is_active"
              className="text-gray-300 text-sm cursor-pointer"
            >
              Показывать карточку в списке
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 border-zinc-600 text-gray-300"
              onClick={onClose}
              disabled={saving}
            >
              Отмена
            </Button>
            <Button
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
              onClick={save}
              disabled={saving}
            >
              {saving ? (
                <Icon name="Loader2" size={16} className="animate-spin mr-2" />
              ) : null}
              Сохранить
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ─── МОДАЛ СОЗДАНИЯ/РЕДАКТИРОВАНИЯ ПАССАЖИРА ──────────────────────────────────

interface PassengerFormModalProps {
  open: boolean;
  onClose: () => void;
  token: string;
  initial?: Partial<typeof emptyPassengerForm extends () => infer R ? R : never>;
  onSaved: () => void;
}

const PassengerFormModal: React.FC<PassengerFormModalProps> = ({
  open,
  onClose,
  token,
  initial,
  onSaved,
}) => {
  const { toast } = useToast();
  const [form, setForm] = useState(emptyPassengerForm());
  const [saving, setSaving] = useState(false);
  const [newDate, setNewDate] = useState("");

  useEffect(() => {
    if (open) {
      setForm(
        initial ? { ...emptyPassengerForm(), ...initial } : emptyPassengerForm()
      );
      setNewDate("");
    }
  }, [open, initial]);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const addDate = () => {
    if (!newDate || form.preferred_dates.includes(newDate)) return;
    set("preferred_dates", [...form.preferred_dates, newDate]);
    setNewDate("");
  };

  const removeDate = (d: string) =>
    set(
      "preferred_dates",
      form.preferred_dates.filter((x) => x !== d)
    );

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch(`${API_URL}?action=passenger`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Token": token,
        },
        body: JSON.stringify(form),
      });
      if (r.ok) {
        toast({ title: "Карточка сохранена" });
        onSaved();
        onClose();
      } else {
        const d = await r.json();
        toast({ title: d.error || "Ошибка", variant: "destructive" });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-700 text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-lg font-bold">
            {initial
              ? "Редактировать карточку пассажира"
              : "Создать карточку пассажира"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-gray-400 text-xs mb-1 block">
              Опыт как двойка (лет)
            </Label>
            <Input
              type="number"
              min={0}
              max={50}
              value={form.experience_years}
              onChange={(e) => set("experience_years", Number(e.target.value))}
              className="bg-zinc-800 border-zinc-600 text-white w-32"
            />
          </div>

          <div>
            <Label className="text-gray-400 text-xs mb-2 block">
              Своя экипировка
            </Label>
            <div className="space-y-2">
              {(
                [
                  { key: "has_helmet", label: "Есть свой шлем" },
                  { key: "has_jacket", label: "Есть своя куртка" },
                  { key: "has_gloves", label: "Есть свои перчатки" },
                ] as const
              ).map(({ key, label }) => (
                <div key={key} className="flex items-center gap-2">
                  <Checkbox
                    id={`pass-${key}`}
                    checked={form[key]}
                    onCheckedChange={(v) => set(key, !!v)}
                    className="border-zinc-500"
                  />
                  <label
                    htmlFor={`pass-${key}`}
                    className="text-gray-300 text-sm cursor-pointer"
                  >
                    {label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-gray-400 text-xs mb-1 block">О себе</Label>
            <Textarea
              value={form.about}
              onChange={(e) => set("about", e.target.value)}
              placeholder="Расскажи о себе..."
              className="bg-zinc-800 border-zinc-600 text-white placeholder-gray-500 resize-none"
              rows={3}
            />
          </div>

          <div>
            <Label className="text-gray-400 text-xs mb-1 block">
              Контакт (Telegram или телефон)
            </Label>
            <Input
              value={form.contact}
              onChange={(e) => set("contact", e.target.value)}
              placeholder="@username или +7..."
              className="bg-zinc-800 border-zinc-600 text-white placeholder-gray-500"
            />
          </div>

          <div>
            <Label className="text-gray-400 text-xs mb-2 block">
              Ближайшие даты
            </Label>
            <div className="flex gap-2 mb-2">
              <Input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="bg-zinc-800 border-zinc-600 text-white flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addDate}
                className="border-zinc-600 text-gray-300 hover:text-white"
              >
                <Icon name="Plus" size={16} />
              </Button>
            </div>
            {form.preferred_dates.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.preferred_dates.map((d) => (
                  <span
                    key={d}
                    className="flex items-center gap-1 text-xs bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded px-2 py-1"
                  >
                    {formatDate(d)}
                    <button
                      type="button"
                      onClick={() => removeDate(d)}
                      className="hover:text-red-400 ml-1"
                    >
                      <Icon name="X" size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="pass-is_active"
              checked={form.is_active}
              onCheckedChange={(v) => set("is_active", !!v)}
              className="border-zinc-500"
            />
            <label
              htmlFor="pass-is_active"
              className="text-gray-300 text-sm cursor-pointer"
            >
              Показывать карточку в списке
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 border-zinc-600 text-gray-300"
              onClick={onClose}
              disabled={saving}
            >
              Отмена
            </Button>
            <Button
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
              onClick={save}
              disabled={saving}
            >
              {saving ? (
                <Icon name="Loader2" size={16} className="animate-spin mr-2" />
              ) : null}
              Сохранить
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ─── ОСНОВНАЯ СТРАНИЦА ────────────────────────────────────────────────────────

const PillionPage: React.FC = () => {
  const { user, token, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [tab, setTab] = useState<"pilots" | "passengers">("pilots");

  // Списки
  const [pilots, setPilots] = useState<Pilot[]>([]);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [loadingPilots, setLoadingPilots] = useState(true);
  const [loadingPassengers, setLoadingPassengers] = useState(true);

  // Карточка детали
  const [detailPilot, setDetailPilot] = useState<Pilot | null>(null);
  const [detailPassenger, setDetailPassenger] = useState<Passenger | null>(null);

  // Формы
  const [showPilotForm, setShowPilotForm] = useState(false);
  const [showPassengerForm, setShowPassengerForm] = useState(false);
  const [showAuthWarn, setShowAuthWarn] = useState(false);

  // Свои карточки
  const myPilot = pilots.find((p) => p.user_id === user?.id);
  const myPassenger = passengers.find((p) => p.user_id === user?.id);

  // ── Загрузка ──────────────────────────────────────────────

  const loadPilots = async () => {
    setLoadingPilots(true);
    try {
      const r = await fetch(`${API_URL}?action=pilots`);
      const d = await r.json();
      setPilots(Array.isArray(d) ? d : []);
    } catch {
      setPilots([]);
    } finally {
      setLoadingPilots(false);
    }
  };

  const loadPassengers = async () => {
    setLoadingPassengers(true);
    try {
      const r = await fetch(`${API_URL}?action=passengers`);
      const d = await r.json();
      setPassengers(Array.isArray(d) ? d : []);
    } catch {
      setPassengers([]);
    } finally {
      setLoadingPassengers(false);
    }
  };

  useEffect(() => {
    loadPilots();
    loadPassengers();
  }, []);

  // ── Обработчики кнопки создания ───────────────────────────

  const handleCreateBtn = () => {
    if (!isAuthenticated) {
      setShowAuthWarn(true);
      return;
    }
    if (tab === "pilots") {
      setShowPilotForm(true);
    } else {
      setShowPassengerForm(true);
    }
  };

  // ── Обновить список после сохранения ──────────────────────

  const afterPilotSaved = () => {
    loadPilots();
  };

  const afterPassengerSaved = () => {
    loadPassengers();
  };

  // ── Обновить рейтинг после отзыва ─────────────────────────

  const afterReview = () => {
    loadPilots();
    loadPassengers();
  };

  // ── Текст кнопки ──────────────────────────────────────────

  const btnLabel =
    tab === "pilots"
      ? myPilot
        ? "Редактировать мою карточку"
        : "Разместить карточку пилота"
      : myPassenger
      ? "Редактировать мою карточку"
      : "Разместить карточку пассажира";

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        {/* ─── ХЕДЕР ─── */}
        <div className="mb-8 text-center">
          <h1 className="font-['Oswald'] text-4xl sm:text-5xl font-black text-white tracking-wide mb-2">
            ИЩУ ПИЛОТА /{" "}
            <span className="text-orange-500">ДВОЙКУ</span>
          </h1>
          <p className="text-gray-400 text-lg">
            Найди себе попутчика или напарника для совместных поездок по Тюмени и области
          </p>
        </div>

        {/* ─── КНОПКА СОЗДАНИЯ ─── */}
        <div className="flex justify-center mb-8">
          <Button
            onClick={handleCreateBtn}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 text-base font-semibold"
          >
            <Icon name="Plus" size={18} className="mr-2" />
            {btnLabel}
          </Button>
        </div>

        {/* ─── TABS ─── */}
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as "pilots" | "passengers")}
        >
          <TabsList className="bg-zinc-800 border border-zinc-700 mb-6 w-full max-w-sm mx-auto flex">
            <TabsTrigger
              value="pilots"
              className="flex-1 data-[state=active]:bg-orange-500 data-[state=active]:text-white text-gray-400"
            >
              <Icon name="Bike" size={15} className="mr-1.5" />
              Ищу двойку
            </TabsTrigger>
            <TabsTrigger
              value="passengers"
              className="flex-1 data-[state=active]:bg-orange-500 data-[state=active]:text-white text-gray-400"
            >
              <Icon name="Users" size={15} className="mr-1.5" />
              Ищу пилота
            </TabsTrigger>
          </TabsList>

          {/* ── ПИЛОТЫ ── */}
          <TabsContent value="pilots">
            {loadingPilots ? (
              <div className="flex justify-center items-center py-20">
                <Icon
                  name="Loader2"
                  size={36}
                  className="animate-spin text-orange-500"
                />
              </div>
            ) : pilots.length === 0 ? (
              <div className="text-center py-20">
                <Icon name="Bike" size={48} className="text-zinc-600 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Карточек пилотов пока нет</p>
                <p className="text-gray-600 text-sm mt-1">
                  Стань первым — разместри свою карточку
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pilots.map((p) => (
                  <PilotCard
                    key={p.id}
                    pilot={p}
                    onClick={() => setDetailPilot(p)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── ПАССАЖИРЫ ── */}
          <TabsContent value="passengers">
            {loadingPassengers ? (
              <div className="flex justify-center items-center py-20">
                <Icon
                  name="Loader2"
                  size={36}
                  className="animate-spin text-orange-500"
                />
              </div>
            ) : passengers.length === 0 ? (
              <div className="text-center py-20">
                <Icon
                  name="Users"
                  size={48}
                  className="text-zinc-600 mx-auto mb-4"
                />
                <p className="text-gray-500 text-lg">Карточек пассажиров пока нет</p>
                <p className="text-gray-600 text-sm mt-1">
                  Разместри свою карточку и найди пилота
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {passengers.map((p) => (
                  <PassengerCard
                    key={p.id}
                    passenger={p}
                    onClick={() => setDetailPassenger(p)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ─── МОДАЛ ДЕТАЛЕЙ ПИЛОТА ─── */}
      <DetailModal
        open={!!detailPilot}
        onClose={() => setDetailPilot(null)}
        type="pilot"
        pilot={detailPilot ?? undefined}
        currentUserId={user?.id}
        token={token}
        onReviewSent={afterReview}
      />

      {/* ─── МОДАЛ ДЕТАЛЕЙ ПАССАЖИРА ─── */}
      <DetailModal
        open={!!detailPassenger}
        onClose={() => setDetailPassenger(null)}
        type="passenger"
        passenger={detailPassenger ?? undefined}
        currentUserId={user?.id}
        token={token}
        onReviewSent={afterReview}
      />

      {/* ─── ФОРМА ПИЛОТА ─── */}
      {token && (
        <PilotFormModal
          open={showPilotForm}
          onClose={() => setShowPilotForm(false)}
          token={token}
          initial={myPilot ? { ...myPilot } : undefined}
          onSaved={afterPilotSaved}
        />
      )}

      {/* ─── ФОРМА ПАССАЖИРА ─── */}
      {token && (
        <PassengerFormModal
          open={showPassengerForm}
          onClose={() => setShowPassengerForm(false)}
          token={token}
          initial={myPassenger ? { ...myPassenger } : undefined}
          onSaved={afterPassengerSaved}
        />
      )}

      {/* ─── ПРЕДУПРЕЖДЕНИЕ БЕЗ АВТОРИЗАЦИИ ─── */}
      <Dialog
        open={showAuthWarn}
        onOpenChange={(v) => !v && setShowAuthWarn(false)}
      >
        <DialogContent className="bg-zinc-900 border-zinc-700 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white">
              Нужна авторизация
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <Icon name="LogIn" size={40} className="text-orange-500" />
            <p className="text-gray-300 text-center">
              Чтобы разместить карточку, нужно войти в аккаунт МотоТюмень
            </p>
            <Button
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() => setShowAuthWarn(false)}
            >
              Понятно
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
};

export default PillionPage;
