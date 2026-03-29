 
import React, { useEffect, useState } from "react";

export type Season = "autumn" | "winter" | "spring" | "off";

interface Particle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  speed: number;
  swayOffset: number;
  swaySpeed: number;
  size: number;
  emoji: string;
}

const SEASON_CONFIG: Record<Exclude<Season, "off">, { emojis: string[]; count: number; speedRange: [number, number]; sizeRange: [number, number]; opacity: number }> = {
  autumn: {
    emojis: ["🍁", "🍂", "🍃"],
    count: 30,
    speedRange: [0.5, 1.5],
    sizeRange: [18, 28],
    opacity: 0.7,
  },
  winter: {
    emojis: ["❄", "❅", "❆", "·"],
    count: 50,
    speedRange: [0.3, 1.8],
    sizeRange: [10, 24],
    opacity: 0.85,
  },
  spring: {
    emojis: ["🌷", "🌸", "💮"],
    count: 25,
    speedRange: [0.4, 1.2],
    sizeRange: [16, 24],
    opacity: 0.75,
  },
};

const SEASON_STORAGE_KEY = "mototyumen_season";

export function getStoredSeason(): Season {
  try {
    const stored = localStorage.getItem(SEASON_STORAGE_KEY);
    if (stored && ["autumn", "winter", "spring", "off"].includes(stored)) {
      return stored as Season;
    }
  } catch (_e) { /* noop */ }
  return "autumn";
}

export function setStoredSeason(season: Season) {
  try {
    localStorage.setItem(SEASON_STORAGE_KEY, season);
  } catch (_e) { /* noop */ }
}

const SeasonEffect: React.FC<{ season?: Season }> = ({ season: seasonProp }) => {
  const [season, setSeason] = useState<Season>(seasonProp || getStoredSeason());
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (seasonProp !== undefined) {
      setSeason(seasonProp);
    }
  }, [seasonProp]);

  useEffect(() => {
    const handleSeasonChange = ((e: CustomEvent<Season>) => {
      setSeason(e.detail);
    }) as EventListener;
    window.addEventListener("season-change", handleSeasonChange);
    return () => window.removeEventListener("season-change", handleSeasonChange);
  }, []);

  useEffect(() => {
    if (season === "off") {
      setParticles([]);
      return;
    }

    const config = SEASON_CONFIG[season];
    const initial: Particle[] = [];

    for (let i = 0; i < config.count; i++) {
      const emoji = config.emojis[Math.floor(Math.random() * config.emojis.length)];
      initial.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: -Math.random() * window.innerHeight,
        rotation: Math.random() * 360,
        speed: config.speedRange[0] + Math.random() * (config.speedRange[1] - config.speedRange[0]),
        swayOffset: Math.random() * 100,
        swaySpeed: 0.02 + Math.random() * 0.02,
        size: config.sizeRange[0] + Math.random() * (config.sizeRange[1] - config.sizeRange[0]),
        emoji,
      });
    }
    setParticles(initial);

    const animate = () => {
      setParticles((prev) =>
        prev.map((p) => {
          let newY = p.y + p.speed;
          let newX = p.x + Math.sin((newY + p.swayOffset) * p.swaySpeed) * 0.5;
          const newRotation = p.rotation + (season === "winter" ? 1.5 : 0.5);

          if (newY > window.innerHeight + 50) {
            newY = -50;
            newX = Math.random() * window.innerWidth;
          }
          if (newX < -50) newX = window.innerWidth + 50;
          if (newX > window.innerWidth + 50) newX = -50;

          return { ...p, x: newX, y: newY, rotation: newRotation };
        })
      );
    };

    const interval = setInterval(animate, 8);
    return () => clearInterval(interval);
  }, [season]);

  if (season === "off" || particles.length === 0) return null;

  const config = SEASON_CONFIG[season];

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}px`,
            top: `${p.y}px`,
            transform: `rotate(${p.rotation}deg)`,
            transition: "none",
            fontSize: `${p.size}px`,
            opacity: config.opacity,
            lineHeight: 1,
          }}
        >
          {p.emoji}
        </div>
      ))}
    </div>
  );
};

export default SeasonEffect;