import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { ServiceData } from "./types";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const AUTH_API = 'https://functions.poehali.dev/55efb6f4-b3ab-4ac3-8b19-da9b21b5490e';

interface ServiceCardProps {
  service: ServiceData;
  isEditing: boolean;
  onEdit: (id: number, field: keyof ServiceData, value: string | number) => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, isEditing, onEdit }) => {
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

  const getServiceStatus = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();
    
    const workTimeMatch = service.hours?.match(/(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/);
    
    if (workTimeMatch) {
      const [, startHour, startMin, endHour, endMin] = workTimeMatch;
      const startTime = parseInt(startHour) + parseInt(startMin) / 60;
      const endTime = parseInt(endHour) + parseInt(endMin) / 60;
      const currentTime = currentHour + now.getMinutes() / 60;
      
      const isWorkDay = currentDay >= 1 && currentDay <= 6;
      const isWorkTime = currentTime >= startTime && currentTime < endTime;
      
      return isWorkDay && isWorkTime;
    }
    
    const isWorkDay = currentDay >= 1 && currentDay <= 6;
    const isWorkTime = currentHour >= 9 && currentHour < 18;
    
    return isWorkDay && isWorkTime;
  };

  const isOpen = getServiceStatus();

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
          item_type: 'services',
          item_id: service.id,
        }),
      });

      if (response.ok) {
        setIsFavorite(!isFavorite);
        toast({
          title: isFavorite ? "Удалено из избранного" : "Добавлено в избранное",
          description: service.name,
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
          src={service.image} 
          alt={service.name}
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
              {service.rating}
            </span>
          </div>
        </div>
        <div className="absolute bottom-2 left-2 bg-black/40 backdrop-blur-sm rounded px-2 py-1">
          <span className="text-white text-xs font-medium">
            {isEditing ? (
              <input
                type="text"
                value={service.category}
                onChange={(e) => onEdit(service.id, 'category', e.target.value)}
                className="bg-transparent text-white text-xs border-none outline-none"
              />
            ) : (
              service.category
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
                value={service.name}
                onChange={(e) => onEdit(service.id, 'name', e.target.value)}
                className="bg-transparent border-b border-border outline-none text-lg font-bold"
              />
            ) : (
              service.name
            )}
          </h3>
        </div>

        <div className="mb-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isEditing ? (
              <textarea
                value={service.description}
                onChange={(e) => onEdit(service.id, 'description', e.target.value)}
                className="w-full bg-transparent border border-border rounded p-1 text-sm resize-none"
                rows={2}
              />
            ) : (
              <>
                {showFullDescription 
                  ? service.description 
                  : truncateText(service.description, 80)
                }
              </>
            )}
          </p>
          {!isEditing && service.description.length > 80 && (
            <button
              onClick={() => setShowFullDescription(!showFullDescription)}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-1 transition-colors"
            >
              {showFullDescription ? 'Свернуть' : 'Развернуть'}
            </button>
          )}
        </div>

        <div className="space-y-2 mb-4">
          <div className="relative">
            <div 
              className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-blue-500 transition-colors"
              onClick={() => service.addresses && setShowAddresses(!showAddresses)}
            >
              <Icon name="MapPin" className="h-3 w-3 text-blue-500 flex-shrink-0" />
              <span className="truncate">
                {isEditing ? (
                  <input
                    type="text"
                    value={service.location}
                    onChange={(e) => onEdit(service.id, 'location', e.target.value)}
                    className="bg-transparent border-b border-border outline-none text-sm w-full"
                  />
                ) : (
                  service.location
                )}
              </span>
              {service.addresses && !isEditing && (
                <Icon name={showAddresses ? "ChevronUp" : "ChevronDown"} className="h-3 w-3 text-blue-500" />
              )}
            </div>
            
            {showAddresses && service.addresses && !isEditing && (
              <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-background border border-border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                {service.addresses.map((address, index) => (
                  <a
                    key={index}
                    href={address.yandexUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-3 py-2 text-xs text-muted-foreground hover:bg-blue-50 hover:text-blue-700 transition-colors border-b border-border last:border-b-0"
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
            <Icon name="Clock" className="h-3 w-3 text-blue-500 flex-shrink-0" />
            <span>
              {isEditing ? (
                <input
                  type="text"
                  value={service.hours}
                  onChange={(e) => onEdit(service.id, 'hours', e.target.value)}
                  className="bg-transparent border-b border-border outline-none text-sm"
                />
              ) : (
                service.hours
              )}
            </span>
          </div>

          {service.schedule && !isEditing && (
            <div className="relative">
              <div 
                className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-blue-500 transition-colors"
                onClick={() => setShowSchedule(!showSchedule)}
              >
                <Icon name="Calendar" className="h-3 w-3 text-blue-500 flex-shrink-0" />
                <span className="truncate">График работы</span>
                <Icon name={showSchedule ? "ChevronUp" : "ChevronDown"} className="h-3 w-3 text-blue-500" />
              </div>
              
              {showSchedule && (
                <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-background border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {service.schedule.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center px-3 py-2 text-xs border-b border-border last:border-b-0 hover:bg-blue-50 transition-colors"
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
          <h4 className="text-sm font-medium text-foreground mb-2">Услуги:</h4>
          <div className="flex flex-wrap gap-1">
            {service.services?.slice(0, 3).map((serv, index) => (
              <span key={index} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                {serv}
              </span>
            ))}
            {service.services && service.services.length > 3 && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                +{service.services.length - 3}
              </span>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <a 
            href={isEditing ? "#" : `tel:${service.phone}`} 
            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
            onClick={isEditing ? (e) => e.preventDefault() : undefined}
          >
            <Icon name="Phone" className="h-3 w-3" />
            <span className="text-sm">
              {isEditing ? (
                <input
                  type="text"
                  value={service.phone}
                  onChange={(e) => onEdit(service.id, 'phone', e.target.value)}
                  className="bg-transparent border-b border-border outline-none text-sm text-blue-600"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                "Звонок"
              )}
            </span>
          </a>

          <a 
            href={isEditing ? "#" : (service.website || "#")} 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={isEditing ? (e) => e.preventDefault() : undefined}
          >
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
              <Icon name="Wrench" className="h-3 w-3 mr-1" />
              Записаться
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;