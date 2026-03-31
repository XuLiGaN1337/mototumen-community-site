import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/contexts/AuthContext";
import AuthModal from "@/components/auth/AuthModal";

interface BoardItem {
  id?: number;
  title: string;
  author: string;
  category: string;
  location?: string;
  price?: string;
  description: string;
  contact?: string;
  created_at?: string;
}

const API_URL = "https://functions.poehali.dev/5b8dbbf1-556a-43c8-b39c-e8096eebd5d4";

const BoardSection: React.FC = () => {
  const [announcements, setAnnouncements] = useState<BoardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        const response = await fetch(`${API_URL}?type=announcements`);
        const data = await response.json();
        setAnnouncements(data.slice(0, 6));
      } catch (error) {
        console.error("Error loading announcements:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAnnouncements();
  }, []);

  const handleViewAllAnnouncements = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    window.open('https://t.me/anthony_genevezy', '_blank');
  };

  const handleContactClick = (contact?: string) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    if (contact) {
      window.open(contact.startsWith('http') ? contact : `https://t.me/${contact}`, '_blank');
    } else {
      window.open('https://t.me/anthony_genevezy', '_blank');
    }
  };

  return (
    <section className="py-8 sm:py-10 md:py-16 px-4">
      <div className="container mx-auto">
        {/* Section Header */}
        <div className="text-center mb-6 sm:mb-8 md:mb-12">
          <h2
            className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 text-white"
            style={{ fontFamily: "Oswald, sans-serif" }}
          >
            Доска <span className="relative inline-block">
              <span className="bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-600 bg-clip-text text-transparent font-extrabold animate-pulse">
                PREMIUM
              </span>
              <span className="absolute -inset-1 bg-gradient-to-r from-yellow-400/20 via-yellow-300/30 to-yellow-600/20 blur-sm animate-ping"></span>
              <span className="absolute -inset-0.5 bg-gradient-to-r from-yellow-400/30 via-yellow-300/40 to-yellow-600/30 rounded-lg blur-xs animate-pulse"></span>
            </span> объявлений
          </h2>
          <p
            className="text-zinc-400 text-sm sm:text-base md:text-lg"
            style={{ fontFamily: "Open Sans, sans-serif" }}
          >
            Объявления от участников сообщества
          </p>
        </div>

        {/* Board Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-4 md:gap-6">
          {loading ? (
            <div className="col-span-full text-center py-8">
              <p className="text-zinc-400">Загрузка объявлений...</p>
            </div>
          ) : announcements.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <p className="text-zinc-400">Пока нет объявлений</p>
            </div>
          ) : (
            announcements.map((item, index) => (
              <Card
                key={item.id || index}
                className="bg-zinc-800 border-zinc-700 hover-scale animate-fade-in"
              >
                <CardHeader className="pb-2 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <Badge className="bg-purple-500 text-white text-xs">
                      {item.category}
                    </Badge>
                    <span className="text-xs text-zinc-400">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString('ru-RU') : ''}
                    </span>
                  </div>
                  <CardTitle
                    className="text-white text-base leading-tight"
                    style={{ fontFamily: "Oswald, sans-serif" }}
                  >
                    {item.title}
                  </CardTitle>
                  <p
                    className="text-zinc-400 text-sm line-clamp-2 mt-1"
                    style={{ fontFamily: "Open Sans, sans-serif" }}
                  >
                    {item.description}
                  </p>
                </CardHeader>

                <CardContent className="pt-0 p-4">
                  <div className="space-y-1.5 text-sm mb-4">
                    <div className="flex items-center gap-2">
                      <Icon name="User" className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                      <span className="text-zinc-300 truncate">{item.author}</span>
                    </div>
                    {item.location && (
                      <div className="flex items-center gap-2">
                        <Icon name="MapPin" className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                        <span className="text-zinc-300 truncate">{item.location}</span>
                      </div>
                    )}
                    {item.price && (
                      <div className="flex items-center gap-2">
                        <Icon name="DollarSign" className="h-4 w-4 text-accent flex-shrink-0" />
                        <span className="text-accent font-bold">{item.price}</span>
                      </div>
                    )}
                  </div>

                  <Button
                    size="sm"
                    className="w-full bg-accent hover:bg-accent/90 text-white"
                    onClick={() => handleContactClick(item.contact)}
                  >
                    <Icon name="MessageCircle" className="h-4 w-4 mr-2" />
                    Написать
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* View All Button */}
        <div className="text-center mt-4 sm:mt-6 md:mt-8">
          <Button
            size="lg"
            className="bg-accent hover:bg-accent/90 text-white w-full sm:w-auto"
            onClick={handleViewAllAnnouncements}
          >
            <Icon name="Plus" className="h-5 w-5 mr-2" />
            Перейти ко всем объявлениям
          </Button>
        </div>
      </div>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        message="Только авторизованные пользователи могут просматривать контакты и объявления"
      />
    </section>
  );
};

export default BoardSection;