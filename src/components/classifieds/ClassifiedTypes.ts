export interface Classified {
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

export interface Filters {
  priceRange: string;
  condition: string;
  priceType: string;
  sortBy: string;
  location: string;
}

export const getTypeConfig = (type: string) => {
  switch (type) {
    case "sale":
      return { label: "Продажа", color: "bg-blue-500", icon: "ShoppingCart" };
    case "wanted":
      return { label: "Куплю", color: "bg-green-500", icon: "Search" };
    case "exchange":
      return { label: "Обмен", color: "bg-purple-500", icon: "ArrowLeftRight" };
    case "free":
      return { label: "Даром", color: "bg-orange-500", icon: "Gift" };
    default:
      return { label: "Объявление", color: "bg-gray-500", icon: "FileText" };
  }
};

export const getConditionColor = (condition?: string) => {
  switch (condition) {
    case "new": return "bg-green-500";
    case "used": return "bg-blue-500";
    case "broken": return "bg-red-500";
    default: return "bg-gray-500";
  }
};

export const getConditionText = (condition?: string) => {
  switch (condition) {
    case "new": return "Новое";
    case "used": return "Б/у";
    case "broken": return "Требует ремонта";
    default: return "";
  }
};

export const getPriceText = (classified: Classified) => {
  switch (classified.priceType) {
    case "fixed":
      return `${classified.price?.toLocaleString()} ₽`;
    case "negotiable":
      return classified.price
        ? `${classified.price.toLocaleString()} ₽ (торг)`
        : "Договорная";
    case "free":
      return "Бесплатно";
    case "exchange":
      return "Обмен";
    default:
      return "Не указано";
  }
};
