import React, { useEffect, useState } from "react";
import { getCachedTelegramData, TelegramChannelData } from "@/api/telegram";

interface StatItem {
  value: string;
  label: string;
}

const StatsSection: React.FC = () => {
  const [telegramData, setTelegramData] = useState<TelegramChannelData | null>(
    null,
  );

  useEffect(() => {
    const loadTelegramData = async () => {
      const data = await getCachedTelegramData();
      setTelegramData(data);
    };

    loadTelegramData();
  }, []);

  const statsData: StatItem[] = [
    {
      value: telegramData ? `${telegramData.memberCount}+` : "400+",
      label: "Участников",
    },
    { value: "20+", label: "Мероприятий" },
    { value: "2", label: "Партнеров" },
    { value: "2", label: "года сообществу" },
  ];
  return (
    <section className="relative pt-0 pb-6 sm:pb-8 md:pb-16 px-4">
      <div className="container mx-auto relative z-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
          {statsData.map((stat, index) => (
            <div key={index} className="text-center animate-scale-in">
              <div
                className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-accent mb-1"
                style={{ fontFamily: "Oswald, sans-serif" }}
              >
                {stat.value}
              </div>
              <div className="text-zinc-400 text-xs sm:text-sm md:text-base leading-tight">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;