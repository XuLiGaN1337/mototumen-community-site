import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";
import { useNavigate } from "react-router-dom";

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  price: number;
  category: string;
  image: string;
  organizer: string;
  featured?: boolean;
}

const Events = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const events: Event[] = [
    {
      id: "1",
      title: 'Мотопробег "Весенний старт"',
      description: "Традиционный весенний мотопробег для всех любителей мотоциклов",
      date: "2024-04-15",
      time: "10:00",
      location: "Центральная площадь",
      price: 0,
      category: "Мотопробег",
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
      organizer: "МОТОТюмень",
      featured: true,
    },
    {
      id: "2",
      title: "Мастер-класс по техническому обслуживанию",
      description: "Изучаем основы технического обслуживания мотоциклов",
      date: "2024-04-20",
      time: "14:00",
      location: "Сервисный центр",
      price: 1500,
      category: "Обучение",
      image: "https://images.unsplash.com/photo-1558980664-769d59546b3d?w=800",
      organizer: 'Сервис-центр "Мото+"',
      featured: true,
    },
    {
      id: "3",
      title: "Соревнования по фигурному вождению",
      description: "Соревнования на ловкость и мастерство управления мотоциклом",
      date: "2024-04-25",
      time: "12:00",
      location: "Автодром",
      price: 500,
      category: "Соревнования",
      image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800",
      organizer: 'Мотоклуб "Скорость"',
      featured: true,
    },
    {
      id: "4",
      title: "Встреча райдеров",
      description: "Неформальная встреча для общения и обмена опытом",
      date: "2024-05-01",
      time: "18:00",
      location: "Кафе Riders",
      price: 0,
      category: "Встречи",
      image: "https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=800",
      organizer: "МОТОТюмень",
    },
    {
      id: "5",
      title: "Трек-день на Автодроме",
      description: "Проверьте возможности своего мотоцикла на трассе",
      date: "2024-05-05",
      time: "09:00",
      location: "Автодром",
      price: 2000,
      category: "Трек-день",
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
      organizer: 'Клуб "Скорость"',
    },
    {
      id: "6",
      title: "Выезд на природу",
      description: "Совместная поездка на живописные места области",
      date: "2024-05-12",
      time: "08:00",
      location: "Сбор у ТРЦ",
      price: 0,
      category: "Покатушки",
      image: "https://images.unsplash.com/photo-1558980664-769d59546b3d?w=800",
      organizer: "МОТОТюмень",
    },
  ];

  const featuredEvents = events.filter(e => e.featured);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % featuredEvents.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + featuredEvents.length) % featuredEvents.length);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-900 via-dark-800 to-dark-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')}
            className="text-gray-400 hover:text-white"
          >
            <Icon name="ArrowLeft" className="mr-2 md:mr-2" size={24} />
            <span className="hidden md:inline">Назад</span>
          </Button>
        </div>

        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-white mb-1 sm:mb-2 font-['Oswald']">
            События
          </h1>
          <p className="text-gray-300 font-['Open_Sans'] text-sm sm:text-base">
            Мотособытия, встречи и мероприятия
          </p>
        </div>

        <div className="mb-8 sm:mb-12 relative">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 font-['Oswald']">
            Главные события
          </h2>
          {/* Слайдер — полноэкранный на мобилке, 3D на десктопе */}
          <div className="relative h-[220px] sm:h-[340px] md:h-[450px] flex items-center justify-center overflow-hidden">
            <div className="relative w-full h-full flex items-center justify-center">
              {featuredEvents.map((event, index) => {
                const position = (index - currentSlide + featuredEvents.length) % featuredEvents.length;
                const isPrev = position === featuredEvents.length - 1;
                const isNext = position === 1;
                const isCurrent = position === 0;
                
                if (!isPrev && !isNext && !isCurrent) return null;

                return (
                  <div
                    key={event.id}
                    className={`absolute transition-all duration-500 ease-in-out ${
                      isCurrent
                        ? "z-30 scale-100 opacity-100 translate-x-0"
                        : isPrev
                        ? "z-10 scale-75 opacity-40 -translate-x-[60%] cursor-pointer hover:opacity-60 hidden sm:block"
                        : "z-10 scale-75 opacity-40 translate-x-[60%] cursor-pointer hover:opacity-60 hidden sm:block"
                    }`}
                    style={{ width: isCurrent ? "90%" : "70%" }}
                    onClick={() => {
                      if (isPrev) prevSlide();
                      if (isNext) nextSlide();
                    }}
                  >
                    <div className="relative h-[200px] sm:h-[300px] md:h-[400px] rounded-xl overflow-hidden shadow-2xl">
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                      {isCurrent && (
                        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8">
                          <Badge className="mb-2 sm:mb-3 bg-accent">{event.category}</Badge>
                          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2 font-['Oswald'] line-clamp-2">
                            {event.title}
                          </h3>
                          <p className="text-gray-200 mb-2 sm:mb-4 font-['Open_Sans'] text-sm hidden sm:block line-clamp-2">
                            {event.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-white text-xs sm:text-sm">
                            <div className="flex items-center gap-1">
                              <Icon name="Calendar" size={14} />
                              <span>{new Date(event.date).toLocaleDateString("ru-RU")}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Icon name="Clock" size={14} />
                              <span>{event.time}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Icon name="MapPin" size={14} />
                              <span>{event.location}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <button
              onClick={prevSlide}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-40 bg-black/50 hover:bg-black/70 text-white p-2 sm:p-3 rounded-full transition-all"
            >
              <Icon name="ChevronLeft" size={20} />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-40 bg-black/50 hover:bg-black/70 text-white p-2 sm:p-3 rounded-full transition-all"
            >
              <Icon name="ChevronRight" size={20} />
            </button>

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-40 flex gap-1.5">
              {featuredEvents.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentSlide ? "bg-white w-5" : "bg-white/50 w-1.5"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 font-['Oswald']">
            Календарь событий
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {events.map((event) => {
              const isExpanded = expandedCards.has(event.id);
              return (
                <Card key={event.id} className="overflow-hidden bg-dark-800 border-dark-700 hover:border-accent transition-all group flex flex-col">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute top-4 left-4">
                      <div className="bg-accent text-white px-3 py-2 rounded-lg text-center min-w-[60px]">
                        <div className="text-2xl font-bold font-['Oswald']">
                          {new Date(event.date).getDate()}
                        </div>
                        <div className="text-xs">
                          {new Date(event.date).toLocaleDateString("ru-RU", { month: "short" })}
                        </div>
                      </div>
                    </div>
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-dark-900/80">{event.category}</Badge>
                    </div>
                  </div>
                  <CardContent className="p-4 sm:p-5 flex flex-col flex-1">
                    <div className="flex-1">
                      <h3 className="text-lg sm:text-xl font-bold text-white mb-2 font-['Oswald'] line-clamp-2">
                        {event.title}
                      </h3>
                      <p className={`text-gray-400 text-sm mb-4 font-['Open_Sans'] ${isExpanded ? '' : 'line-clamp-2'}`}>
                        {event.description}
                      </p>
                      {event.description.length > 80 && (
                        <button
                          onClick={() => toggleExpanded(event.id)}
                          className="text-accent text-sm hover:underline mb-4"
                        >
                          {isExpanded ? 'Свернуть' : 'Развернуть'}
                        </button>
                      )}
                      <div className="space-y-2 text-sm text-gray-300">
                        <div className="flex items-center gap-2">
                          <Icon name="Clock" size={16} className="text-accent" />
                          <span>{event.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Icon name="MapPin" size={16} className="text-accent" />
                          <span>{event.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Icon name="Users" size={16} className="text-accent" />
                          <span>{event.organizer}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-dark-700 flex items-center justify-between">
                      <span className="text-xl font-bold text-accent font-['Oswald']">
                        {event.price === 0 ? "Бесплатно" : `${event.price} ₽`}
                      </span>
                      <Button size="sm" className="bg-accent hover:bg-accent/90">
                        Подробнее
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Events;