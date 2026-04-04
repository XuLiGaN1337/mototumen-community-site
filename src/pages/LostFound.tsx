import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SearchFilter from "@/components/ui/search-filter";
import FavoriteButton from "@/components/ui/favorite-button";
import Icon from "@/components/ui/icon";

interface LostFoundItem {
  id: string;
  title: string;
  description: string;
  author: string;
  date: string;
  category: string;
  image?: string;
  location: string;
  contact: string;
  type: "lost" | "found";
  status: "active" | "resolved";
  reward?: number;
}

const LostFound = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    category: "",
    priceRange: "",
    sortBy: "date-desc",
    status: "active",
  });

  const [lostFoundItems] = useState<LostFoundItem[]>([
    {
      id: "1",
      title: "Потерял ключи от мотоцикла",
      description:
        "Потерял связку ключей от Honda CBR600 в районе центрального рынка. На брелке значок Honda.",
      author: "Михаил Р.",
      date: "2024-04-10",
      category: "Ключи",
      image: "https://picsum.photos/400/300?random=20",
      location: "Центральный рынок",
      contact: "@mikhail_cbr",
      type: "lost",
      status: "active",
      reward: 1000,
    },
    {
      id: "2",
      title: "Найден мотошлем",
      description:
        'Найден черный мотошлем Shoei возле парковки ТЦ "Кристалл". Ищу владельца.',
      author: "Елена К.",
      date: "2024-04-09",
      category: "Экипировка",
      image: "https://picsum.photos/400/300?random=21",
      location: 'ТЦ "Кристалл"',
      contact: "@elena_finds",
      type: "found",
      status: "active",
    },
    {
      id: "3",
      title: "Пропали перчатки",
      description:
        'Оставил кожаные мотоперчатки в кафе "Байкер". Черные с белыми вставками.',
      author: "Андрей С.",
      date: "2024-04-08",
      category: "Экипировка",
      location: 'Кафе "Байкер"',
      contact: "+7 (123) 456-78-90",
      type: "lost",
      status: "active",
    },
    {
      id: "4",
      title: "Найден номерной знак",
      description:
        "Найден номерной знак мотоцикла на трассе М-5. Номер частично поврежден.",
      author: "Дмитрий В.",
      date: "2024-04-07",
      category: "Документы",
      image: "https://picsum.photos/400/300?random=22",
      location: "Трасса М-5",
      contact: "@dmitry_road",
      type: "found",
      status: "active",
    },
    {
      id: "5",
      title: "Потерян чехол для мотоцикла",
      description:
        "Серый чехол для мотоцикла размера L. Потерян в районе автомойки на Мельничной.",
      author: "Сергей Т.",
      date: "2024-04-06",
      category: "Аксессуары",
      location: "Автомойка на Мельничной",
      contact: "@sergey_cover",
      type: "lost",
      status: "resolved",
    },
  ]);

  const categories = [...new Set(lostFoundItems.map((item) => item.category))];

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      category: "",
      priceRange: "",
      sortBy: "date-desc",
      status: "active",
    });
    setSearchTerm("");
  };

  const getFilteredItems = (type?: string) => {
    let items = lostFoundItems;

    if (type && type !== "all") {
      items = items.filter((item) => item.type === type);
    }

    return items.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        !filters.category || item.category === filters.category;
      const matchesStatus = !filters.status || item.status === filters.status;

      let matchesPrice = true;
      if (filters.priceRange && item.reward) {
        const [min, max] = filters.priceRange
          .split("-")
          .map((p) => parseInt(p) || 0);
        if (filters.priceRange === "10000+") {
          matchesPrice = item.reward >= 10000;
        } else {
          matchesPrice = item.reward >= min && item.reward <= (max || Infinity);
        }
      }

      return matchesSearch && matchesCategory && matchesStatus && matchesPrice;
    });
  };

  const renderItems = (items: LostFoundItem[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {items.map((item) => (
        <Card
          key={item.id}
          className="overflow-hidden hover:shadow-lg transition-shadow"
        >
          {item.image && (
            <div className="relative">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-48 object-cover"
              />
              <div className="absolute top-2 right-2 flex gap-2">
                <Badge
                  className={
                    item.type === "lost" ? "bg-red-500" : "bg-green-500"
                  }
                >
                  {item.type === "lost" ? "Потеряно" : "Найдено"}
                </Badge>
                <FavoriteButton
                  item={{
                    id: item.id,
                    type: "lost-found",
                    title: item.title,
                    description: item.description,
                    image: item.image,
                  }}
                />
              </div>
            </div>
          )}
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle
                  className="text-lg mb-2"
                  style={{ fontFamily: "Oswald, sans-serif" }}
                >
                  {item.title}
                </CardTitle>
                <div className="flex gap-2 mb-2">
                  <Badge variant="outline">{item.category}</Badge>
                  <Badge
                    className={
                      item.status === "active" ? "bg-blue-500" : "bg-gray-500"
                    }
                  >
                    {item.status === "active" ? "Активно" : "Решено"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p
              className="text-sm text-muted-foreground mb-4"
              style={{ fontFamily: "Open Sans, sans-serif" }}
            >
              {item.description}
            </p>

            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm">
                <Icon name="User" className="h-4 w-4 mr-2 text-accent" />
                <span>{item.author}</span>
              </div>
              <div className="flex items-center text-sm">
                <Icon name="Calendar" className="h-4 w-4 mr-2 text-accent" />
                <span>{new Date(item.date).toLocaleDateString("ru-RU")}</span>
              </div>
              <div className="flex items-center text-sm">
                <Icon name="MapPin" className="h-4 w-4 mr-2 text-accent" />
                <span>{item.location}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-lg font-bold text-accent">
                {item.reward
                  ? `Вознаграждение: ${item.reward} ₽`
                  : "Без вознаграждения"}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Icon name="MessageCircle" className="h-4 w-4 mr-1" />
                  Связаться
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8">
          <div>
            <h1
              className="text-2xl sm:text-4xl font-bold mb-1 sm:mb-2"
              style={{ fontFamily: "Oswald, sans-serif" }}
            >
              Потеряшки/Находки
            </h1>
            <p
              className="text-sm text-muted-foreground"
              style={{ fontFamily: "Open Sans, sans-serif" }}
            >
              Помогаем найти потерянные вещи и вернуть находки владельцам
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button
              variant="outline"
              className="border-red-500 text-red-500 hover:bg-red-50"
            >
              <Icon name="Search" className="h-4 w-4 mr-2" />
              Потерял
            </Button>
            <Button className="bg-green-500 hover:bg-green-600">
              <Icon name="Plus" className="h-4 w-4 mr-2" />
              Нашел
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="lg:col-span-1">
            <SearchFilter
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={clearFilters}
              categories={categories}
              showPriceFilter={true}
              showStatusFilter={true}
            />
          </div>

          <div className="lg:col-span-3">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">Все</TabsTrigger>
                <TabsTrigger value="lost" className="text-red-600">
                  Потеряно
                </TabsTrigger>
                <TabsTrigger value="found" className="text-green-600">
                  Найдено
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-6">
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">
                    Всего объявлений: {getFilteredItems().length}
                  </p>
                </div>
                {renderItems(getFilteredItems())}
              </TabsContent>

              <TabsContent value="lost" className="mt-6">
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">
                    Потерянных вещей: {getFilteredItems("lost").length}
                  </p>
                </div>
                {renderItems(getFilteredItems("lost"))}
              </TabsContent>

              <TabsContent value="found" className="mt-6">
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">
                    Найденных вещей: {getFilteredItems("found").length}
                  </p>
                </div>
                {renderItems(getFilteredItems("found"))}
              </TabsContent>
            </Tabs>

            {getFilteredItems(activeTab === "all" ? undefined : activeTab)
              .length === 0 && (
              <div className="text-center py-8">
                <Icon
                  name="Search"
                  className="h-16 w-16 mx-auto mb-4 text-muted-foreground"
                />
                <h3 className="text-lg font-semibold mb-2">
                  Ничего не найдено
                </h3>
                <p className="text-muted-foreground">
                  Попробуйте изменить параметры поиска
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LostFound;