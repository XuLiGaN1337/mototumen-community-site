import React from "react";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { useNavigate } from "react-router-dom";

const Events = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-900 via-dark-800 to-dark-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')}
            className="text-gray-400 hover:text-white"
          >
            <Icon name="ArrowLeft" className="mr-2" size={24} />
            <span className="hidden md:inline">Назад</span>
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-white mb-1 font-['Oswald']">
            События
          </h1>
          <p className="text-gray-300 text-sm sm:text-base">
            Мотособытия, встречи и мероприятия
          </p>
        </div>

        <div className="flex flex-col items-center justify-center py-32 text-center">
          <Icon name="CalendarX" size={64} className="text-zinc-600 mb-4" />
          <h2 className="text-xl font-semibold text-zinc-400 mb-2">Событий пока нет</h2>
          <p className="text-zinc-600 text-sm">Следите за обновлениями — скоро здесь появятся мероприятия</p>
        </div>
      </div>
    </div>
  );
};

export default Events;
