import React from "react";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";

const HeroSection: React.FC = () => {
  const handleJoinCommunity = () => {
    window.open("https://t.me/MotoTyumen", "_blank");
  };

  const handleWatchVideo = () => {
    // TODO: Implement video modal or redirect
    console.log("Watch video clicked");
  };

  return (
    <section className="relative pt-8 sm:pt-12 md:pt-20 pb-10 sm:pb-16 md:pb-20 px-4">
      <div className="container mx-auto relative z-20">
        <div className="max-w-3xl">
          <h2
            className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-3 sm:mb-4 md:mb-6 text-shadow animate-fade-in leading-tight"
            style={{ fontFamily: "Oswald, sans-serif" }}
          >
            МОТО
            <span className="text-accent">СООБЩЕСТВО</span>
            <br />
            ТЮМЕНИ
          </h2>

          <p
            className="text-sm sm:text-base md:text-xl text-zinc-300 mb-6 sm:mb-6 md:mb-8 animate-fade-in max-w-lg"
            style={{ fontFamily: "Open Sans, sans-serif" }}
          >
            Объединяем байкеров города. Всё необходимое и общение в одном месте.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 animate-fade-in">
            <Button
              size="lg"
              className="bg-accent hover:bg-accent/90 text-white w-full sm:w-auto text-base py-3 px-6"
              onClick={handleJoinCommunity}
            >
              <Icon name="Users" className="h-5 w-5 mr-2" />
              Присоединиться
            </Button>

            <Button
              size="lg"
              className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 hover:border-white/30 transition-all duration-300 w-full sm:w-auto text-base py-3 px-6"
              onClick={handleWatchVideo}
            >
              <Icon name="Play" className="h-5 w-5 mr-2" />
              Смотреть видео
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;