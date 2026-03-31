import React, { useState, useEffect } from "react";
import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/contexts/AuthContext";
import AuthModal from "@/components/auth/AuthModal";

interface Announcement {
  id?: number;
  title: string;
  description: string;
  category: string;
  image?: string;
  author: string;
  contact: string;
  price?: string;
  location?: string;
  created_at?: string;
}

const API_URL = "https://functions.poehali.dev/5b8dbbf1-556a-43c8-b39c-e8096eebd5d4";

const categories = [
  "Все",
  "Продажа",
  "Покупка",
  "Попутчики",
  "Услуги",
  "Обучение",
  "Эвакуатор",
  "Общее",
];

const Announcements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Все");
  const { isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  const toggleExpanded = (id: number) => {
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

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ type: "announcements" });
      if (selectedCategory !== "Все") {
        params.append("category", selectedCategory);
      }
      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const response = await fetch(`${API_URL}?${params}`);
      const data = await response.json();
      setAnnouncements(data);
    } catch (error) {
      console.error("Error loading announcements:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, [selectedCategory]);

  const handleSearch = () => {
    loadAnnouncements();
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("Все");
  };

  const handleContactClick = (contact: string) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    if (contact) {
      const url = contact.startsWith("http")
        ? contact
        : `https://t.me/${contact.replace("@", "")}`;
      window.open(url, "_blank");
    }
  };

  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="bg-dark-900 text-white py-8 sm:py-14 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold mb-3 sm:mb-6 tracking-tight font-['Oswald']">
            ОБЪЯВЛЕНИЯ
          </h1>
          <p className="text-base sm:text-xl text-gray-300 max-w-2xl mx-auto">
            Доска объявлений мотосообщества Тюмени
          </p>
        </div>
      </section>

      {/* Filters Section */}
      <section className="py-4 sm:py-6 px-4 bg-zinc-900/50 border-b border-zinc-800 sticky top-14 sm:top-16 z-30">
        <div className="container mx-auto">
          <div className="flex flex-col gap-3">
            {/* Search */}
            <div className="flex gap-2">
              <Input
                placeholder="Поиск объявлений..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="bg-zinc-800 border-zinc-700 text-white flex-1"
              />
              <Button onClick={handleSearch} className="bg-accent hover:bg-accent/90 px-3">
                <Icon name="Search" className="h-4 w-4" />
              </Button>
              {(searchTerm || selectedCategory !== "Все") && (
                <Button variant="ghost" onClick={clearFilters} className="text-zinc-400 hover:text-white px-3">
                  <Icon name="X" className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Category Filter — горизонтальный скролл */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
              {categories.map((category) => (
                <Badge
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  className={`cursor-pointer whitespace-nowrap flex-shrink-0 text-xs sm:text-sm py-1 px-2 sm:px-3 ${
                    selectedCategory === category
                      ? "bg-accent hover:bg-accent/90"
                      : "hover:bg-zinc-800"
                  }`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Badge>
              ))}
            </div>
          </div>

          <div className="mt-2 text-xs sm:text-sm text-zinc-400">
            {loading ? "Загрузка..." : (
              <>Найдено: <span className="text-white font-medium">{announcements.length}</span></>
            )}
          </div>
        </div>
      </section>

      {/* Announcements Grid */}
      <section className="py-6 sm:py-10 px-4 min-h-screen">
        <div className="container mx-auto">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-zinc-400">Загрузка объявлений...</p>
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-12">
              <Icon name="Inbox" className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                Объявлений не найдено
              </h3>
              <p className="text-zinc-400 mb-4 text-sm sm:text-base">
                {searchTerm || selectedCategory !== "Все"
                  ? "Попробуйте изменить фильтры"
                  : "Пока нет объявлений в этой категории"}
              </p>
              {(searchTerm || selectedCategory !== "Все") && (
                <Button onClick={clearFilters} className="bg-accent hover:bg-accent/90">
                  Сбросить фильтры
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {announcements.map((announcement) => {
                const isExpanded = expandedCards.has(announcement.id!);
                return (
                  <Card
                    key={announcement.id}
                    className="bg-zinc-800 border-zinc-700 hover:border-accent transition-all flex flex-col"
                  >
                    <CardHeader className="pb-2 p-4">
                      <div className="flex items-start justify-between mb-2">
                        <Badge className="bg-purple-500 text-white text-xs">
                          {announcement.category}
                        </Badge>
                        <span className="text-xs text-zinc-400 flex-shrink-0 ml-2">
                          {announcement.created_at
                            ? new Date(announcement.created_at).toLocaleDateString("ru-RU")
                            : ""}
                        </span>
                      </div>
                      <CardTitle className="text-white text-base sm:text-lg leading-tight font-['Oswald']">
                        {announcement.title}
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-3 flex-1 flex flex-col p-4 pt-0">
                      {announcement.image && (
                        <img
                          src={announcement.image}
                          alt={announcement.title}
                          className="w-full h-48 object-cover rounded-md"
                        />
                      )}

                      <div className="flex-1">
                        <p className={`text-zinc-400 text-sm ${isExpanded ? '' : 'line-clamp-3'}`}>
                          {announcement.description}
                        </p>
                        {announcement.description.length > 100 && (
                          <button
                            onClick={() => toggleExpanded(announcement.id!)}
                            className="text-accent text-xs hover:underline mt-1"
                          >
                            {isExpanded ? 'Свернуть' : 'Развернуть'}
                          </button>
                        )}
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Icon name="User" className="h-4 w-4 text-zinc-400" />
                          <span className="text-zinc-300">{announcement.author}</span>
                        </div>

                        {announcement.location && (
                          <div className="flex items-center gap-2">
                            <Icon name="MapPin" className="h-4 w-4 text-zinc-400" />
                            <span className="text-zinc-300">{announcement.location}</span>
                          </div>
                        )}

                        {announcement.price && (
                          <div className="flex items-center gap-2">
                            <Icon name="DollarSign" className="h-4 w-4 text-accent" />
                            <span className="text-accent font-bold">
                              {announcement.price}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 border-zinc-700"
                          onClick={() => handleContactClick(announcement.contact)}
                        >
                          <Icon name="MessageCircle" className="h-4 w-4 mr-1" />
                          Написать
                        </Button>
                        <Button
                          size="sm"
                          className="bg-accent hover:bg-accent/90"
                          onClick={() => handleContactClick(announcement.contact)}
                        >
                          <Icon name="ExternalLink" className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        message="Только авторизованные пользователи могут просматривать контакты"
      />
    </PageLayout>
  );
};

export default Announcements;