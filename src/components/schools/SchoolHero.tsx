import React from "react";

const SchoolHero: React.FC = () => {
  return (
    <section className="bg-dark-900 text-white py-8 sm:py-14 md:py-20">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold mb-3 sm:mb-6 tracking-tight">
          МОТОШКОЛЫ
        </h1>
        <p className="text-base sm:text-xl text-gray-300 max-w-2xl mx-auto">
          Лучшие мотошколы для обучения категории А в России
        </p>
      </div>
    </section>
  );
};

export default SchoolHero;