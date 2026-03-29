import React from "react";
import PageLayout from "@/components/layout/PageLayout";
import HeroSection from "@/components/layout/HeroSection";
import StatsSection from "@/components/layout/StatsSection";
import MotorcycleHeroSection from "@/components/layout/MotorcycleHeroSection";
import BoardSection from "@/components/layout/BoardSection";
import SeasonEffect from "@/components/ui/season-effect";

const Index: React.FC = () => {
  return (
    <PageLayout>
      <SeasonEffect />
      
      {/* Hero + Stats Combined Section */}
      <div className="relative overflow-hidden">
        {/* Unified Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{
            backgroundImage: "url(/img/ce03d6a4-3520-4714-ab06-885f5ee38544.jpg)",
          }}
        ></div>
        
        {/* Background Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent"></div>

        {/* Hero Section */}
        <HeroSection />

        {/* Stats Section */}
        <StatsSection />
      </div>

      {/* Motorcycle Hero Section */}
      <MotorcycleHeroSection />

      {/* Board Section */}
      <BoardSection />
    </PageLayout>
  );
};

export default Index;