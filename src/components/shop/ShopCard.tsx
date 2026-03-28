import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { ShopData } from "./types";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const AUTH_API = 'https://functions.poehali.dev/55efb6f4-b3ab-4ac3-8b19-da9b21b5490e';

interface ShopCardProps {
  shop: ShopData;
  isEditing: boolean;
  onEdit: (id: number, field: keyof ShopData, value: string | number) => void;
}

interface ShopStatus {
  status: string;
  color: string;
  dotColor: string;
}

const ShopCard: React.FC<ShopCardProps> = ({ shop, isEditing, onEdit }) => {
  const [showSchedule, setShowSchedule] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const { token, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const getShopStatus = (shop: ShopData): ShopStatus => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    // ДЕБАГ: покажем текущее время
    console.log(`Текущее время: ${currentHour}:${currentMinute.toString().padStart(2, '0')} (${currentTimeInMinutes} мин)`);
    console.log(`Магазин ${shop.name}: открыт ${shop.openTime}-${shop.closeTime} мин`);

    const isOpen = currentTimeInMinutes >= shop.openTime && currentTimeInMinutes < shop.closeTime;

    if (isOpen) {
      return {
        status: "ОТКРЫТО",
        color: "text-green-400",
        dotColor: "bg-green-400",
      };
    } else {
      return {
        status: "ЗАКРЫТО",
        color: "text-red-400",
        dotColor: "bg-red-400",
      };
    }
  };

  const shopStatus = getShopStatus(shop);

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
          item_type: 'shops',
          item_id: shop.id,
        }),
      });

      if (response.ok) {
        setIsFavorite(!isFavorite);
        toast({
          title: isFavorite ? "Удалено из избранного" : "Добавлено в избранное",
          description: shop.name,
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

  const handleOrgClick = () => {
    if (shop.organization_id) {
      window.location.href = `/organization/${shop.organization_id}`;
    }
  };

  return (
    <div className="bg-card rounded-xl shadow-sm hover:shadow-md border border-border transition-all duration-300 overflow-hidden group relative">
      <div className="absolute top-3 right-3 z-10 flex gap-2">
        {!isEditing && (
          <button
            onClick={toggleFavorite}
            disabled={favoriteLoading}
            className="bg-background/95 backdrop-blur-sm rounded-full p-2 shadow-sm border border-border hover:bg-accent transition-colors"
          >
            <Icon
              name="Heart"
              className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`}
            />
          </button>
        )}
        <div className="flex items-center gap-1 bg-background/95 backdrop-blur-sm rounded-full px-2 py-1 shadow-sm border border-border">
          <div className={`w-2 h-2 ${shopStatus.dotColor} rounded-full`}></div>
          <span className={`text-xs font-medium ${shopStatus.color === "text-green-400" ? "text-green-600" : "text-red-600"}`}>
            {shopStatus.status}
          </span>
        </div>
      </div>

      <div className="relative h-32 bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
        <Icon name={shop.icon as any} className="h-12 w-12 text-white" />
        <div className="absolute bottom-2 left-2 bg-black/40 backdrop-blur-sm rounded px-2 py-1">
          <span className="text-white text-xs font-medium">
            {isEditing ? (
              <input
                type="text"
                value={shop.category}
                onChange={(e) => onEdit(shop.id, 'category', e.target.value)}
                className="bg-transparent text-white text-xs border-none outline-none"
              />
            ) : (
              shop.category
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
                value={shop.name}
                onChange={(e) => onEdit(shop.id, 'name', e.target.value)}
                className="bg-transparent border-b border-border outline-none text-lg font-bold"
              />
            ) : (
              shop.name
            )}
          </h3>
          <div className="flex items-center gap-1 ml-2">
            <Icon name="Star" className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="text-sm font-semibold text-foreground">
              {shop.rating}
            </span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
          {isEditing ? (
            <textarea
              value={shop.description}
              onChange={(e) => onEdit(shop.id, 'description', e.target.value)}
              className="w-full bg-transparent border border-border rounded p-1 text-sm resize-none"
              rows={2}
            />
          ) : (
            shop.description
          )}
        </p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon name="MapPin" className="h-3 w-3 text-orange-500 flex-shrink-0" />
            <span className="truncate">
              {isEditing ? (
                <input
                  type="text"
                  value={shop.shortAddress}
                  onChange={(e) => onEdit(shop.id, 'shortAddress', e.target.value)}
                  className="bg-transparent border-b border-border outline-none text-sm w-full"
                />
              ) : (
                shop.shortAddress
              )}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon name="Clock" className="h-3 w-3 text-orange-500 flex-shrink-0" />
            <span>
              {isEditing ? (
                <input
                  type="text"
                  value={shop.shortWorkTime}
                  onChange={(e) => onEdit(shop.id, 'shortWorkTime', e.target.value)}
                  className="bg-transparent border-b border-border outline-none text-sm"
                />
              ) : (
                shop.shortWorkTime
              )}
            </span>
          </div>

          {/* График работы */}
          {shop.schedule && !isEditing && (
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
                  {shop.schedule.map((item, index) => (
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

        {shop.organization_id ? (
          <Button 
            onClick={handleOrgClick}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium transition-all mb-3"
          >
            <Icon name="Store" className="h-4 w-4 mr-2" />
            Открыть магазин
          </Button>
        ) : (
          <a 
            href={isEditing ? "#" : shop.website} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="block mb-3"
            onClick={isEditing ? (e) => e.preventDefault() : undefined}
          >
            <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium transition-all">
              <Icon name="Globe" className="h-4 w-4 mr-2" />
              {isEditing ? (
                <input
                  type="text"
                  value={shop.website}
                  onChange={(e) => onEdit(shop.id, 'website', e.target.value)}
                  className="bg-transparent text-white outline-none text-center"
                  placeholder="URL сайта"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                "Перейти на сайт"
              )}
            </Button>
          </a>
        )}

        <div className="flex justify-between items-center">
          <a 
            href={isEditing ? "#" : `tel:${shop.phone}`} 
            className="flex items-center gap-1 text-orange-600 hover:text-orange-700 font-medium"
            onClick={isEditing ? (e) => e.preventDefault() : undefined}
          >
            <Icon name="Phone" className="h-3 w-3" />
            <span className="text-sm">
              {isEditing ? (
                <input
                  type="text"
                  value={shop.phone}
                  onChange={(e) => onEdit(shop.id, 'phone', e.target.value)}
                  className="bg-transparent border-b border-border outline-none text-sm text-orange-600"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                "Звонок"
              )}
            </span>
          </a>

          <div className="flex gap-1">
            {shop.telegram && (
              <a 
                href={isEditing ? "#" : shop.telegram} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center justify-center w-6 h-6 bg-blue-500 hover:bg-blue-600 rounded transition-colors"
                onClick={isEditing ? (e) => e.preventDefault() : undefined}
              >
                <Icon name="Send" className="h-3 w-3 text-white" />
              </a>
            )}
            {shop.vk && (
              <a 
                href={isEditing ? "#" : shop.vk} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center justify-center w-6 h-6 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                onClick={isEditing ? (e) => e.preventDefault() : undefined}
              >
                <span className="text-white font-bold text-xs">VK</span>
              </a>
            )}
            {shop.whatsapp && (
              <a 
                href={isEditing ? "#" : shop.whatsapp} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center justify-center w-6 h-6 bg-green-500 hover:bg-green-600 rounded transition-colors"
                onClick={isEditing ? (e) => e.preventDefault() : undefined}
              >
                <Icon name="MessageCircle" className="h-3 w-3 text-white" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopCard;