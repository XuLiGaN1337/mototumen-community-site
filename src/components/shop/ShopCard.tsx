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

const CATEGORY_ICONS: Record<string, string> = {
  'Магазин': 'Store',
  'Сервис': 'Wrench',
  'Мотошкола': 'GraduationCap',
};

const CATEGORY_COLORS: Record<string, string> = {
  'Магазин': 'from-orange-500 to-orange-600',
  'Сервис': 'from-blue-500 to-blue-600',
  'Мотошкола': 'from-green-500 to-green-600',
};

const ShopCard: React.FC<ShopCardProps> = ({ shop, isEditing, onEdit }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const { token, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const iconName = CATEGORY_ICONS[shop.category] || 'Store';
  const colorClass = CATEGORY_COLORS[shop.category] || 'from-orange-500 to-orange-600';

  const toggleFavorite = async () => {
    if (!isAuthenticated || !token) {
      toast({ title: "Требуется авторизация", description: "Войдите, чтобы добавить в избранное", variant: "destructive" });
      return;
    }
    setFavoriteLoading(true);
    try {
      const response = await fetch(AUTH_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token },
        body: JSON.stringify({ action: isFavorite ? 'remove_favorite' : 'add_favorite', item_type: 'shops', item_id: shop.id }),
      });
      if (response.ok) {
        setIsFavorite(!isFavorite);
        toast({ title: isFavorite ? "Удалено из избранного" : "Добавлено в избранное", description: shop.name });
      }
    } catch {
      toast({ title: "Ошибка", description: "Не удалось обновить избранное", variant: "destructive" });
    } finally {
      setFavoriteLoading(false);
    }
  };

  return (
    <div className="bg-card rounded-xl shadow-sm hover:shadow-md border border-border transition-all duration-300 overflow-hidden group relative">
      {/* Избранное */}
      <div className="absolute top-3 right-3 z-10">
        {!isEditing && (
          <button onClick={toggleFavorite} disabled={favoriteLoading}
            className="bg-background/95 backdrop-blur-sm rounded-full p-2 shadow-sm border border-border hover:bg-accent transition-colors">
            <Icon name="Heart" className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
          </button>
        )}
      </div>

      {/* Шапка с иконкой */}
      <div className={`relative h-28 sm:h-32 bg-gradient-to-br ${colorClass} flex items-center justify-center`}>
        {shop.image ? (
          <img src={shop.image} alt={shop.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <Icon name={iconName as 'Store'} className="h-12 w-12 text-white" />
        )}
        <div className="absolute bottom-2 left-2 bg-black/40 backdrop-blur-sm rounded px-2 py-1">
          <span className="text-white text-xs font-medium">{shop.category}</span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-bold text-foreground truncate flex-1 mr-2">{shop.name}</h3>
          {shop.rating && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <Icon name="Star" className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="text-sm font-semibold text-foreground">{shop.rating}</span>
            </div>
          )}
        </div>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">{shop.description}</p>

        <div className="space-y-2 mb-4">
          {shop.address && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icon name="MapPin" className="h-3 w-3 text-orange-500 flex-shrink-0" />
              <span className="truncate">{shop.address}</span>
            </div>
          )}
          {shop.working_hours && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icon name="Clock" className="h-3 w-3 text-orange-500 flex-shrink-0" />
              <span>{shop.working_hours}</span>
            </div>
          )}
          {shop.phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icon name="Phone" className="h-3 w-3 text-orange-500 flex-shrink-0" />
              <a href={`tel:${shop.phone}`} className="hover:text-foreground transition-colors">{shop.phone}</a>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {shop.phone && (
            <a href={`tel:${shop.phone}`} className="flex-1">
              <Button variant="outline" className="w-full" size="sm">
                <Icon name="Phone" className="h-4 w-4 mr-1" />
                Позвонить
              </Button>
            </a>
          )}
          {shop.website && (
            <a href={shop.website} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button className="w-full bg-accent hover:bg-accent/90" size="sm">
                <Icon name="Globe" className="h-4 w-4 mr-1" />
                Сайт
              </Button>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopCard;
