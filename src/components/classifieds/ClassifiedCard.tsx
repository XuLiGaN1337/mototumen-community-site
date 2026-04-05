import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import FavoriteButton from "@/components/ui/favorite-button";
import Icon from "@/components/ui/icon";

interface Classified {
  id: string;
  title: string;
  description: string;
  price?: number;
  priceType: "fixed" | "negotiable" | "free" | "exchange";
  images: string[];
  category: string;
  subcategory?: string;
  type: "sale" | "wanted" | "exchange" | "free";
  condition?: "new" | "used" | "broken";
  seller: {
    id: string;
    name: string;
    avatar?: string;
    rating: number;
    reviewCount: number;
    isVerified: boolean;
    responseTime: string;
    memberSince: string;
  };
  location: string;
  createdAt: string;
  featured: boolean;
  urgent: boolean;
  tags: string[];
  contactPreference: "phone" | "message" | "both";
  viewCount: number;
  favoriteCount: number;
}

interface ClassifiedCardProps {
  item: Classified;
  user: any;
}

const ClassifiedCard: React.FC<ClassifiedCardProps> = ({ item, user }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "sale":
        return { label: "Продажа", color: "bg-green-500" };
      case "wanted":
        return { label: "Куплю", color: "bg-blue-500" };
      case "exchange":
        return { label: "Обмен", color: "bg-purple-500" };
      case "free":
        return { label: "Бесплатно", color: "bg-orange-500" };
      default:
        return { label: type, color: "bg-gray-500" };
    }
  };

  const getConditionLabel = (condition?: string) => {
    switch (condition) {
      case "new":
        return "Новое";
      case "used":
        return "Б/У";
      case "broken":
        return "На запчасти";
      default:
        return "";
    }
  };

  const getPriceLabel = (item: Classified) => {
    if (item.priceType === "free") return "Бесплатно";
    if (item.priceType === "exchange") return "Обмен";
    if (!item.price) return "Договорная";
    return `${item.price.toLocaleString()} ₽`;
  };

  const typeInfo = getTypeLabel(item.type);

  return (
    <Card className="bg-zinc-800 border-zinc-700 hover:border-accent transition-all relative overflow-hidden group flex flex-col">
      {item.featured && (
        <div className="absolute top-2 left-2 z-10">
          <Badge className="bg-yellow-500 text-black">
            <Icon name="Star" className="h-3 w-3 mr-1" />
            Топ
          </Badge>
        </div>
      )}

      {item.urgent && (
        <div className="absolute top-2 right-2 z-10">
          <Badge className="bg-red-500 text-white">
            <Icon name="Zap" className="h-3 w-3 mr-1" />
            Срочно
          </Badge>
        </div>
      )}

      <CardHeader className="p-0">
        {item.images.length > 0 ? (
          <div className="relative w-full h-48 overflow-hidden bg-zinc-900">
            <img
              src={item.images[0]}
              alt={item.title}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute bottom-2 right-2">
              <FavoriteButton
                itemId={item.id}
                itemType="classified"
                initialCount={item.favoriteCount}
              />
            </div>
          </div>
        ) : (
          <div className="w-full h-48 bg-zinc-700 flex items-center justify-center relative">
            <Icon name="Package" className="h-16 w-16 text-zinc-600" />
            <div className="absolute bottom-2 right-2">
              <FavoriteButton
                itemId={item.id}
                itemType="classified"
                initialCount={item.favoriteCount}
              />
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-4 space-y-3 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-lg text-white line-clamp-2 mb-2">
              {item.title}
            </CardTitle>
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge className={`${typeInfo.color} text-white`}>
                {typeInfo.label}
              </Badge>
              {item.condition && (
                <Badge variant="outline" className="text-zinc-400">
                  {getConditionLabel(item.condition)}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1">
          <p className={`text-zinc-400 text-sm ${isExpanded ? '' : 'line-clamp-2'}`}>
            {item.description}
          </p>
          {item.description.length > 80 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-accent text-xs hover:underline mt-1"
            >
              {isExpanded ? 'Свернуть' : 'Развернуть'}
            </button>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-accent">
              {getPriceLabel(item)}
            </p>
            {item.price && item.priceType === "negotiable" && (
              <p className="text-xs text-zinc-500">Торг уместен</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2 border-t border-zinc-700">
          <Avatar className="h-8 w-8">
            <AvatarImage src={item.seller.avatar} />
            <AvatarFallback>{item.seller.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-1">
              <p className="text-sm text-white font-medium">
                {item.seller.name}
              </p>
              {item.seller.isVerified && (
                <Icon
                  name="BadgeCheck"
                  className="h-4 w-4 text-blue-500"
                />
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span className="flex items-center gap-1">
                <Icon name="Star" className="h-3 w-3 text-yellow-500" />
                {item.seller.rating}
              </span>
              <span>•</span>
              <span>{item.seller.reviewCount} отзывов</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-zinc-500">
          <span className="flex items-center gap-1">
            <Icon name="MapPin" className="h-3 w-3" />
            {item.location}
          </span>
          <span className="flex items-center gap-1">
            <Icon name="Eye" className="h-3 w-3" />
            {item.viewCount}
          </span>
          <span className="flex items-center gap-1">
            <Icon name="Clock" className="h-3 w-3" />
            {new Date(item.createdAt).toLocaleDateString("ru-RU")}
          </span>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex gap-2">
        <Button className="flex-1 bg-accent hover:bg-accent/90 text-white">
          <Icon name="MessageCircle" className="h-4 w-4 mr-2" />
          Написать
        </Button>
        {item.contactPreference !== "message" && (
          <Button
            variant="outline"
            className="border-accent text-accent hover:bg-accent/10"
          >
            <Icon name="Phone" className="h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default ClassifiedCard;