import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { SchoolData } from "./types";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const AUTH_API = 'https://functions.poehali.dev/55efb6f4-b3ab-4ac3-8b19-da9b21b5490e';

interface SchoolCardProps {
  school: SchoolData;
  isEditing: boolean;
  onEdit: (id: number, field: keyof SchoolData, value: string | number) => void;
}

const SchoolCard: React.FC<SchoolCardProps> = ({ school, isEditing, onEdit }) => {
  const [showAddresses, setShowAddresses] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const { token, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Логика работы для определения открыта ли автошкола
  const getSchoolStatus = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay(); // 0 = воскресенье, 1 = понедельник, ..., 6 = суббота
    
    // Парсим время работы из поля instructor (в данных там указано время работы)
    const workTimeMatch = school.instructor?.match(/(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/);
    
    if (workTimeMatch) {
      const [, startHour, startMin, endHour, endMin] = workTimeMatch;
      const startTime = parseInt(startHour) + parseInt(startMin) / 60;
      const endTime = parseInt(endHour) + parseInt(endMin) / 60;
      const currentTime = currentHour + now.getMinutes() / 60;
      
      // Проверяем рабочие дни (Пн-Пт)
      const isWorkDay = currentDay >= 1 && currentDay <= 5;
      const isWorkTime = currentTime >= startTime && currentTime < endTime;
      
      return isWorkDay && isWorkTime;
    }
    
    // По умолчанию используем стандартные часы работы 10:00-19:00 Пн-Пт
    const isWorkDay = currentDay >= 1 && currentDay <= 5;
    const isWorkTime = currentHour >= 10 && currentHour < 19;
    
    return isWorkDay && isWorkTime;
  };

  const isOpen = getSchoolStatus();

  const toggleFavorite = async () => {
    if (!isAuthenticated || !token) {
      toast({
        title: "Требуется авторизация",
        description: "Войдите, чтобы добавить в избранное",
        variant: "destructive",
      });
      return;
    }

    setFavoriteLoading(true);
    try {
      const response = await fetch(AUTH_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token,
        },
        body: JSON.stringify({
          action: isFavorite ? 'remove_favorite' : 'add_favorite',
          item_type: 'schools',
          item_id: school.id,
        }),
      });

      if (response.ok) {
        setIsFavorite(!isFavorite);
        toast({
          title: isFavorite ? "Удалено из избранного" : "Добавлено в избранное",
          description: school.name,
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить избранное",
        variant: "destructive",
      });
    } finally {
      setFavoriteLoading(false);
    }
  };

  return (
    <div className="bg-card rounded-xl shadow-sm hover:shadow-md border border-border transition-all duration-300 overflow-hidden group relative">
      <div className="relative h-48 overflow-hidden">
        <img 
          src={school.image} 
          alt={school.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {!isEditing && (
          <button
            onClick={toggleFavorite}
            disabled={favoriteLoading}
            className="absolute top-3 right-3 z-10 bg-background/95 backdrop-blur-sm rounded-full p-2 shadow-sm border border-border hover:bg-accent transition-colors"
          >
            <Icon
              name="Heart"
              className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`}
            />
          </button>
        )}
        
        {/* Статус открыто/закрыто в левом верхнем углу */}
        <div className="absolute top-3 left-3">
          <div className={`flex items-center gap-1 backdrop-blur-sm rounded-full px-3 py-1 shadow-sm border transition-all duration-300 ${
            isOpen 
              ? 'bg-green-500/90 border-green-400 shadow-green-400/30 shadow-lg animate-pulse' 
              : 'bg-red-500/90 border-red-400 shadow-red-400/30 shadow-lg'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isOpen ? 'bg-green-200' : 'bg-red-200'
            }`} />
            <span className="text-xs font-medium text-white">
              {isOpen ? 'ОТКРЫТО' : 'ЗАКРЫТО'}
            </span>
          </div>
        </div>
        
        <div className="absolute top-3 right-3">
          <div className="flex items-center gap-1 bg-background/95 backdrop-blur-sm rounded-full px-2 py-1 shadow-sm border border-border">
            <Icon name="Star" className="h-3 w-3 text-yellow-400 fill-current" />
            <span className="text-xs font-medium text-foreground">
              {school.rating}
            </span>
          </div>
        </div>
        <div className="absolute bottom-2 left-2 bg-black/40 backdrop-blur-sm rounded px-2 py-1">
          <span className="text-white text-xs font-medium">
            {isEditing ? (
              <input
                type="text"
                value={school.category}
                onChange={(e) => onEdit(school.id, 'category', e.target.value)}
                className="bg-transparent text-white text-xs border-none outline-none"
              />
            ) : (
              school.category
            )}
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-bold text-foreground truncate">
            {isEditing ? (
              <input
                type="text"
                value={school.name}
                onChange={(e) => onEdit(school.id, 'name', e.target.value)}
                className="bg-transparent border-b border-border outline-none text-lg font-bold"
              />
            ) : (
              school.name
            )}
          </h3>
          <div className="flex items-center gap-1 ml-2 bg-orange-100 px-2 py-1 rounded-full">
            <span className="text-sm font-bold text-orange-700">
              {isEditing ? (
                <input
                  type="text"
                  value={school.price}
                  onChange={(e) => onEdit(school.id, 'price', e.target.value)}
                  className="bg-transparent border-none outline-none text-sm w-20"
                />
              ) : (
                school.price
              )}
            </span>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isEditing ? (
              <textarea
                value={school.description}
                onChange={(e) => onEdit(school.id, 'description', e.target.value)}
                className="w-full bg-transparent border border-border rounded p-1 text-sm resize-none"
                rows={2}
              />
            ) : (
              <>
                {showFullDescription 
                  ? school.description 
                  : truncateText(school.description, 80)
                }
              </>
            )}
          </p>
          {!isEditing && school.description.length > 80 && (
            <button
              onClick={() => setShowFullDescription(!showFullDescription)}
              className="text-xs text-orange-600 hover:text-orange-700 font-medium mt-1 transition-colors"
            >
              {showFullDescription ? 'Свернуть' : 'Развернуть'}
            </button>
          )}
        </div>

        <div className="space-y-2 mb-4">
          <div className="relative">
            <div 
              className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-orange-500 transition-colors"
              onClick={() => school.addresses && setShowAddresses(!showAddresses)}
            >
              <Icon name="MapPin" className="h-3 w-3 text-orange-500 flex-shrink-0" />
              <span className="truncate">
                {isEditing ? (
                  <input
                    type="text"
                    value={school.location}
                    onChange={(e) => onEdit(school.id, 'location', e.target.value)}
                    className="bg-transparent border-b border-border outline-none text-sm w-full"
                  />
                ) : (
                  school.location
                )}
              </span>
              {school.addresses && !isEditing && (
                <Icon name={showAddresses ? "ChevronUp" : "ChevronDown"} className="h-3 w-3 text-orange-500" />
              )}
            </div>
            
            {/* Выпадающий список адресов */}
            {showAddresses && school.addresses && !isEditing && (
              <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-background border border-border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                {school.addresses.map((address, index) => (
                  <a
                    key={index}
                    href={address.yandexUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-3 py-2 text-xs text-muted-foreground hover:bg-orange-50 hover:text-orange-700 transition-colors border-b border-border last:border-b-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAddresses(false);
                    }}
                  >
                    {address.name}
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon name="Award" className="h-3 w-3 text-orange-500 flex-shrink-0" />
            <span>
              Опыт: {isEditing ? (
                <input
                  type="text"
                  value={school.experience}
                  onChange={(e) => onEdit(school.id, 'experience', e.target.value)}
                  className="bg-transparent border-b border-border outline-none text-sm"
                />
              ) : (
                school.experience
              )}
            </span>
          </div>

          {/* График работы */}
          {school.schedule && !isEditing && (
            <div className="relative">
              <div 
                className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-orange-500 transition-colors"
                onClick={() => setShowSchedule(!showSchedule)}
              >
                <Icon name="Calendar" className="h-3 w-3 text-orange-500 flex-shrink-0" />
                <span className="truncate">График работы</span>
                <Icon name={showSchedule ? "ChevronUp" : "ChevronDown"} className="h-3 w-3 text-orange-500" />
              </div>
              
              {/* Выпадающий список с графиком */}
              {showSchedule && (
                <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-background border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {school.schedule.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center px-3 py-2 text-xs border-b border-border last:border-b-0 hover:bg-orange-50 transition-colors"
                    >
                      <span className="font-medium text-foreground">{item.day}</span>
                      <span className={`${item.hours === 'Выходной' ? 'text-red-600' : 'text-muted-foreground'}`}>
                        {item.hours}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mb-4">
          <h4 className="text-sm font-medium text-foreground mb-2">Курсы:</h4>
          <div className="flex flex-wrap gap-1">
            {school.courses.slice(0, 3).map((course, index) => (
              <span key={index} className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                {course}
              </span>
            ))}
            {school.courses.length > 3 && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                +{school.courses.length - 3}
              </span>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <a 
            href={isEditing ? "#" : `tel:${school.phone}`} 
            className="flex items-center gap-1 text-orange-600 hover:text-orange-700 font-medium"
            onClick={isEditing ? (e) => e.preventDefault() : undefined}
          >
            <Icon name="Phone" className="h-3 w-3" />
            <span className="text-sm">
              {isEditing ? (
                <input
                  type="text"
                  value={school.phone}
                  onChange={(e) => onEdit(school.id, 'phone', e.target.value)}
                  className="bg-transparent border-b border-border outline-none text-sm text-orange-600"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                "Звонок"
              )}
            </span>
          </a>

          <a 
            href={isEditing ? "#" : (school.website || "#")} 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={isEditing ? (e) => e.preventDefault() : undefined}
          >
            <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white">
              <Icon name="GraduationCap" className="h-3 w-3 mr-1" />
              Записаться
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
};

export default SchoolCard;