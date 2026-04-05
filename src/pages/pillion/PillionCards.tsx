import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";
import {
  Pilot,
  Passenger,
  getDefaultAvatar,
  styleColor,
  formatDate,
} from "./pillionTypes";

// ─── УТИЛИТЫ ──────────────────────────────────────────────────────────────────

export const renderStars = (rating: number, size: "sm" | "lg" = "sm") => {
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

export const renderGear = (has_helmet: boolean, has_jacket: boolean, has_gloves: boolean) => (
  <div className="flex gap-2">
    <span title="Шлем">
      <Icon name="HardHat" size={16} className={has_helmet ? "text-green-400" : "text-zinc-600"} />
    </span>
    <span title="Куртка">
      <Icon name="Shirt" size={16} className={has_jacket ? "text-green-400" : "text-zinc-600"} />
    </span>
    <span title="Перчатки">
      <Icon name="Hand" size={16} className={has_gloves ? "text-green-400" : "text-zinc-600"} />
    </span>
  </div>
);

// ─── АВАТАР ───────────────────────────────────────────────────────────────────

export const Avatar: React.FC<{
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

export const StarPicker: React.FC<{ value: number; onChange: (v: number) => void }> = ({
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

export const PilotCard: React.FC<{ pilot: Pilot; onClick: () => void }> = ({
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

export const PassengerCard: React.FC<{ passenger: Passenger; onClick: () => void }> = ({
  passenger,
  onClick,
}) => (
  <div
    className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 hover:border-orange-500/50 transition-all cursor-pointer flex flex-col gap-3"
    onClick={onClick}
  >
    <div className="flex items-start gap-3">
      <Avatar src={passenger.avatar_url} name={passenger.name} gender={passenger.gender} />
      <div className="flex-1 min-w-0">
        <p className="text-gray-300 text-sm truncate">{passenger.name}</p>
        <p className="font-['Oswald'] text-lg text-white leading-tight">Пассажир</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-gray-400 text-xs">
            Опыт двойкой: {passenger.experience_years} л.
          </span>
        </div>
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
