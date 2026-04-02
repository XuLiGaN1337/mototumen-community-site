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
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const { token, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const displayAddress = school.address || school.location || '';
  const displayHours = school.working_hours || school.hours || '';
  const displayPhone = school.phone || '';
  const displayImage = school.image || '';

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
        body: JSON.stringify({ action: isFavorite ? 'remove_favorite' : 'add_favorite', item_type: 'schools', item_id: school.id }),
      });
      if (response.ok) {
        setIsFavorite(!isFavorite);
        toast({ title: isFavorite ? "Удалено из избранного" : "Добавлено в избранное", description: school.name });
      }
    } catch {
      toast({ title: "Ошибка", description: "Не удалось обновить избранное", variant: "destructive" });
    } finally {
      setFavoriteLoading(false);
    }
  };

  return (
    <div className="bg-card rounded-xl shadow-sm hover:shadow-md border border-border transition-all duration-300 overflow-hidden group relative">
      <div className="relative h-28 sm:h-32 bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center overflow-hidden">
        {displayImage ? (
          <img src={displayImage} alt={school.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <Icon name="GraduationCap" className="h-12 w-12 text-white" />
        )}
        {!isEditing && (
          <button onClick={toggleFavorite} disabled={favoriteLoading}
            className="absolute top-3 right-3 bg-background/95 backdrop-blur-sm rounded-full p-2 shadow-sm border border-border hover:bg-accent transition-colors">
            <Icon name="Heart" className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
          </button>
        )}
        <div className="absolute bottom-2 left-2 bg-black/40 backdrop-blur-sm rounded px-2 py-1">
          <span className="text-white text-xs font-medium">{school.category}</span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-bold text-foreground truncate flex-1 mr-2">{school.name}</h3>
          {school.rating != null && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <Icon name="Star" className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="text-sm font-semibold">{school.rating}</span>
            </div>
          )}
        </div>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">{school.description}</p>

        <div className="space-y-2 mb-4">
          {displayAddress && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icon name="MapPin" className="h-3 w-3 text-green-500 flex-shrink-0" />
              <span className="truncate">{displayAddress}</span>
            </div>
          )}
          {displayHours && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icon name="Clock" className="h-3 w-3 text-green-500 flex-shrink-0" />
              <span>{displayHours}</span>
            </div>
          )}
          {displayPhone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icon name="Phone" className="h-3 w-3 text-green-500 flex-shrink-0" />
              <a href={`tel:${displayPhone}`} className="hover:text-foreground transition-colors">{displayPhone}</a>
            </div>
          )}
          {school.price && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icon name="DollarSign" className="h-3 w-3 text-green-500 flex-shrink-0" />
              <span>{school.price}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {displayPhone && (
            <a href={`tel:${displayPhone}`} className="flex-1">
              <Button variant="outline" className="w-full" size="sm">
                <Icon name="Phone" className="h-4 w-4 mr-1" />
                Позвонить
              </Button>
            </a>
          )}
          {school.website && (
            <a href={school.website} target="_blank" rel="noopener noreferrer" className="flex-1">
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

export default SchoolCard;
