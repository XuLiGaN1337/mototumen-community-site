import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface OrganizationCardData {
  id: number;
  name: string;
  description: string;
  category: string;
  rating: number;
  is_open: boolean;
  working_hours: string;
  address: string;
  latitude?: number;
  longitude?: number;
  phones: string[];
  website?: string;
  organization_id: number;
}

interface OrganizationCardProps {
  org: OrganizationCardData;
}

const AUTH_API = 'https://functions.poehali.dev/55efb6f4-b3ab-4ac3-8b19-da9b21b5490e';

export const OrganizationCard: React.FC<OrganizationCardProps> = ({ org }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [showPhones, setShowPhones] = useState(false);
  const { token, isAuthenticated } = useAuth();
  const { toast } = useToast();

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
          item_id: org.id,
        }),
      });

      if (response.ok) {
        setIsFavorite(!isFavorite);
        toast({
          title: isFavorite ? "Удалено из избранного" : "Добавлено в избранное",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        variant: "destructive",
      });
    } finally {
      setFavoriteLoading(false);
    }
  };

  const openNavigation = () => {
    if (org.latitude && org.longitude) {
      window.open(`https://www.google.com/maps?q=${org.latitude},${org.longitude}`, '_blank');
    } else if (org.address) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(org.address)}`, '_blank');
    }
  };

  const openWebsite = () => {
    if (org.website) {
      const url = org.website.startsWith('http') ? org.website : `https://${org.website}`;
      window.open(url, '_blank');
    }
  };

  const callPhone = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const openOrganization = () => {
    window.location.href = `/organization/${org.organization_id}`;
  };

  return (
    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg overflow-hidden relative">
      <div className="absolute top-3 right-3 z-10 flex gap-2">
        <button
          onClick={toggleFavorite}
          disabled={favoriteLoading}
          className="bg-background/95 backdrop-blur-sm rounded-full p-2.5 shadow-md hover:bg-background transition-all"
        >
          <Icon
            name="Heart"
            className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`}
          />
        </button>
        <div className={`flex items-center gap-1.5 backdrop-blur-sm rounded-full px-3 py-2 shadow-md ${
          org.is_open ? 'bg-green-500/90' : 'bg-red-500/90'
        }`}>
          <Icon name="AlertCircle" className="h-4 w-4 text-white" />
          <span className="text-xs font-bold text-white uppercase">
            {org.is_open ? 'Открыто' : 'Закрыто'}
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="inline-block bg-black/40 backdrop-blur-sm rounded-lg px-3 py-1.5 mb-4">
          <span className="text-white text-sm font-medium">{org.category}</span>
        </div>

        <h3 className="text-2xl font-bold text-white mb-2">{org.name}</h3>

        <p className="text-white/90 text-sm leading-relaxed mb-4 line-clamp-3">
          {org.description}
        </p>

        <div className="bg-background/10 backdrop-blur-sm rounded-lg p-4 mb-4 space-y-3">
          <button
            onClick={openNavigation}
            className="flex items-start gap-3 text-white hover:text-white/80 transition-colors w-full text-left group"
          >
            <Icon name="MapPin" className="h-5 w-5 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
            <span className="text-sm">{org.address}</span>
          </button>

          <div className="flex items-center gap-3 text-white">
            <Icon name="Clock" className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm">{org.working_hours || 'Не указано'}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Icon name="Star" className="h-5 w-5 text-yellow-300 fill-yellow-300" />
            <span className="text-xl font-bold text-white">{org.rating.toFixed(1)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          {org.website && (
            <Button
              onClick={openWebsite}
              variant="secondary"
              className="w-full bg-white/90 hover:bg-white text-orange-600 font-semibold"
            >
              <Icon name="Globe" className="mr-2 h-4 w-4" />
              Сайт
            </Button>
          )}

          <div className="relative">
            <Button
              onClick={() => {
                if (org.phones.length === 1) {
                  callPhone(org.phones[0]);
                } else {
                  setShowPhones(!showPhones);
                }
              }}
              variant="secondary"
              className="w-full bg-white/90 hover:bg-white text-orange-600 font-semibold"
            >
              <Icon name="Phone" className="mr-2 h-4 w-4" />
              Звонок
            </Button>

            {showPhones && org.phones.length > 1 && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-background border border-border rounded-lg shadow-xl max-h-48 overflow-y-auto z-20">
                {org.phones.map((phone, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      callPhone(phone);
                      setShowPhones(false);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-accent transition-colors border-b last:border-b-0 text-sm font-medium"
                  >
                    {phone}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <Button
          onClick={openOrganization}
          className="w-full bg-white hover:bg-white/90 text-orange-600 font-bold text-base py-6"
        >
          <Icon name="Store" className="mr-2 h-5 w-5" />
          Открыть магазин
        </Button>
      </div>
    </div>
  );
};