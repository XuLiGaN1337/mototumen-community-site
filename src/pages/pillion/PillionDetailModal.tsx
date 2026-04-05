import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Icon from "@/components/ui/icon";
import { useToast } from "@/hooks/use-toast";
import { Avatar, StarPicker, renderStars, renderGear } from "./PillionCards";
import { API_URL, Pilot, Passenger, Review, styleColor, formatDate } from "./pillionTypes";

interface PillionDetailModalProps {
  open: boolean;
  onClose: () => void;
  type: "pilot" | "passenger";
  pilot?: Pilot;
  passenger?: Passenger;
  currentUserId?: number;
  token?: string | null;
  onReviewSent: () => void;
}

export const PillionDetailModal: React.FC<PillionDetailModalProps> = ({
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
            <div className="bg-zinc-800 rounded-lg p-3">
              <p className="text-gray-400 text-xs uppercase mb-1">Опыт двойкой</p>
              <p className="text-white">{passenger.experience_years} лет</p>
            </div>
            <div className="bg-zinc-800 rounded-lg p-3">
              <p className="text-gray-400 text-xs uppercase mb-2">Своя экипировка</p>
              <div className="flex gap-4">
                <div className={`flex items-center gap-1 text-sm ${passenger.has_helmet ? "text-green-400" : "text-zinc-500"}`}>
                  <Icon name="HardHat" size={14} />
                  Шлем
                </div>
                <div className={`flex items-center gap-1 text-sm ${passenger.has_jacket ? "text-green-400" : "text-zinc-500"}`}>
                  <Icon name="Shirt" size={14} />
                  Куртка
                </div>
                <div className={`flex items-center gap-1 text-sm ${passenger.has_gloves ? "text-green-400" : "text-zinc-500"}`}>
                  <Icon name="Hand" size={14} />
                  Перчатки
                </div>
              </div>
            </div>
          </div>
        )}

        {/* О себе */}
        {item.about && (
          <div className="bg-zinc-800 rounded-lg p-3 mb-4">
            <p className="text-gray-400 text-xs uppercase mb-1">О себе</p>
            <p className="text-gray-200 text-sm leading-relaxed">{item.about}</p>
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
                  className="text-xs bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded px-2 py-1"
                >
                  {formatDate(d)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Контакты — только авторизованным */}
        {token && item.contact && (
          <div className="bg-zinc-800 rounded-lg p-3 mb-4">
            <p className="text-gray-400 text-xs uppercase mb-1">Контакт</p>
            <p className="text-white text-sm">{item.contact}</p>
          </div>
        )}

        {/* Кнопка написать */}
        <Button
          className="w-full bg-zinc-700 hover:bg-zinc-600 text-white mb-4"
          disabled
        >
          <Icon name="MessageCircle" size={16} className="mr-2" />
          Написать
        </Button>

        {/* Отзывы */}
        <div className="border-t border-zinc-700 pt-4">
          <p className="text-gray-300 text-sm font-medium mb-3">
            Отзывы ({reviews.length})
          </p>

          {loadingReviews && (
            <div className="flex justify-center py-4">
              <Icon name="Loader2" size={20} className="animate-spin text-gray-500" />
            </div>
          )}

          {!loadingReviews && reviews.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-4">Отзывов пока нет</p>
          )}

          {reviews.length > 0 && (
            <div className="space-y-3 mb-4">
              {reviews.map((rv) => (
                <div key={rv.id} className="bg-zinc-800 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 bg-zinc-700">
                      <img
                        src={rv.author_avatar || "/img/5732fd0a-94d2-4175-8e07-8d3c8aed2373.jpg"}
                        alt={rv.author_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "/img/5732fd0a-94d2-4175-8e07-8d3c8aed2373.jpg";
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
                  <Label className="text-gray-400 text-xs mb-1 block">Оценка</Label>
                  <StarPicker value={reviewRating} onChange={setReviewRating} />
                </div>
                <div>
                  <Label className="text-gray-400 text-xs mb-1 block">Комментарий</Label>
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
