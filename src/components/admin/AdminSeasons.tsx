import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { type Season, getStoredSeason, setStoredSeason } from "@/components/ui/season-effect";

const SEASONS: { value: Season; label: string; emoji: string; description: string }[] = [
  { value: "autumn", label: "Осень", emoji: "🍁", description: "Падают осенние листья" },
  { value: "winter", label: "Зима", emoji: "❄️", description: "Падает снег" },
  { value: "spring", label: "Весна", emoji: "🌷", description: "Падают лепестки тюльпанов" },
  { value: "off", label: "Выключено", emoji: "🚫", description: "Без эффектов" },
];

const AdminSeasons: React.FC = () => {
  const [current, setCurrent] = useState<Season>(getStoredSeason());

  const handleSelect = (season: Season) => {
    setCurrent(season);
    setStoredSeason(season);
    window.dispatchEvent(new CustomEvent("season-change", { detail: season }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">Сезонные эффекты</h2>
        <p className="text-sm text-muted-foreground">
          Выбери сезон — на главной странице будет падать соответствующая анимация
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SEASONS.map((s) => {
          const isActive = current === s.value;
          return (
            <Card
              key={s.value}
              className={`cursor-pointer transition-all border-2 ${
                isActive
                  ? "border-primary bg-primary/10"
                  : "border-zinc-800 hover:border-zinc-600"
              }`}
              onClick={() => handleSelect(s.value)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <span className="text-3xl">{s.emoji}</span>
                  <span>{s.label}</span>
                  {isActive && (
                    <span className="ml-auto text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                      Активно
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{s.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-zinc-800">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleSelect("autumn")}
          disabled={current === "autumn"}
        >
          🍁 Сброс на осень
        </Button>
        <span className="text-xs text-muted-foreground">
          Настройка сохраняется в браузере и применяется мгновенно для всех посетителей, которые зайдут.
        </span>
      </div>
    </div>
  );
};

export default AdminSeasons;
