import React, { useState, useEffect } from "react";
import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import AuthModal from "@/components/auth/AuthModal";
import { useFilterCategories } from "@/hooks/useFilterCategories";
import { useUserProfileModal } from "@/hooks/useUserProfileModal";

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
  user_id?: number;
  status?: string;
}

const API_URL = "https://functions.poehali.dev/34a08e29-2d68-492d-958c-6de39b313388";

const FALLBACK_CATEGORIES = ["Продажа", "Покупка", "Попутчики", "Услуги", "Обучение", "Эвакуатор", "Общее"];

const emptyForm = () => ({
  title: "",
  description: "",
  category: "",
  contact: "",
  price: "",
  location: "",
  image: "",
});

type Tab = "public" | "my";

const Announcements: React.FC = () => {
  const [tab, setTab] = useState<Tab>("public");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Все");
  const { isAuthenticated, token, user } = useAuth();
  const { toast } = useToast();
  const { open: openProfile, modal: profileModal } = useUserProfileModal();
  const categories = useFilterCategories("announcements", FALLBACK_CATEGORIES);
  const filterCategories = ["Все", ...categories];
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [submitting, setSubmitting] = useState(false);

  const toggleExpanded = (id: number) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  const loadAnnouncements = async (currentTab: Tab = tab) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ type: "announcements" });
      if (currentTab === "my") {
        params.append("my", "true");
      } else {
        if (selectedCategory !== "Все") params.append("category", selectedCategory);
        if (searchTerm) params.append("search", searchTerm);
      }
      const headers: Record<string, string> = {};
      if (token) headers["X-Auth-Token"] = token;
      const response = await fetch(`${API_URL}?${params}`, { headers });
      if (!response.ok) { setAnnouncements([]); return; }
      const data = await response.json();
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch {
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAnnouncements(tab); }, [tab, selectedCategory]);

  const handleSearch = () => loadAnnouncements();
  const clearFilters = () => { setSearchTerm(""); setSelectedCategory("Все"); };

  const handleTabChange = (t: Tab) => {
    if (t === "my" && !isAuthenticated) { setShowAuthModal(true); return; }
    setTab(t);
    setSearchTerm("");
    setSelectedCategory("Все");
  };

  const handleContactClick = (contact: string) => {
    if (!isAuthenticated) { setShowAuthModal(true); return; }
    if (contact) {
      const url = contact.startsWith("http") ? contact : `https://t.me/${contact.replace("@", "")}`;
      window.open(url, "_blank");
    }
  };

  const handleCreateClick = () => {
    if (!isAuthenticated) { setShowAuthModal(true); return; }
    setForm(emptyForm());
    setShowCreateModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!token || !confirm("Удалить объявление?")) return;
    try {
      const res = await fetch(`${API_URL}?type=announcements`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "X-Auth-Token": token },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setAnnouncements(prev => prev.filter(a => a.id !== id));
        toast({ title: "Объявление удалено" });
      }
    } catch {
      toast({ title: "Ошибка", variant: "destructive" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!form.category) { toast({ title: "Выберите категорию", variant: "destructive" }); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}?type=announcements`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Auth-Token": token },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast({ title: "Объявление опубликовано!" });
        setShowCreateModal(false);
        loadAnnouncements("public");
        setTab("public");
      } else {
        const err = await res.json();
        toast({ title: err.error || "Ошибка", variant: "destructive" });
      }
    } catch {
      toast({ title: "Ошибка публикации", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageLayout>
      {/* Hero */}
      <section className="bg-dark-900 text-white py-8 sm:py-12 md:py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold mb-3 tracking-tight font-['Oswald']">
            МОТО‑АВИТО
          </h1>
          <p className="text-base sm:text-xl text-gray-300 max-w-2xl mx-auto mb-6">
            Доска объявлений мотосообщества Тюмени
          </p>

          {/* Tabs */}
          <div className="flex justify-center gap-2">
            <Button
              variant={tab === "public" ? "default" : "outline"}
              className={tab === "public" ? "bg-accent hover:bg-accent/90 text-white" : "border-zinc-600 text-zinc-300 hover:text-white hover:border-zinc-400"}
              onClick={() => handleTabChange("public")}
            >
              <Icon name="Globe" size={16} className="mr-2" />
              Опубликованные
            </Button>
            <Button
              variant={tab === "my" ? "default" : "outline"}
              className={tab === "my" ? "bg-accent hover:bg-accent/90 text-white" : "border-zinc-600 text-zinc-300 hover:text-white hover:border-zinc-400"}
              onClick={() => handleTabChange("my")}
            >
              <Icon name="User" size={16} className="mr-2" />
              Мои объявления
            </Button>
          </div>
        </div>
      </section>

      {/* Filters (только для публичной вкладки) */}
      {tab === "public" && (
        <section className="py-4 sm:py-5 px-4 bg-zinc-900/50 border-b border-zinc-800 sticky top-14 sm:top-16 z-30">
          <div className="container mx-auto">
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Поиск объявлений..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
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
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
                {filterCategories.map((cat) => (
                  <Badge
                    key={cat}
                    variant={selectedCategory === cat ? "default" : "outline"}
                    className={`cursor-pointer whitespace-nowrap flex-shrink-0 text-xs sm:text-sm py-1 px-2 sm:px-3 ${
                      selectedCategory === cat ? "bg-accent hover:bg-accent/90" : "hover:bg-zinc-800"
                    }`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="mt-2 text-xs sm:text-sm text-zinc-400">
              {loading ? "Загрузка..." : <>Найдено: <span className="text-white font-medium">{announcements.length}</span></>}
            </div>
          </div>
        </section>
      )}

      {/* Grid */}
      <section className="py-6 sm:py-10 px-4 pb-28 min-h-screen">
        <div className="container mx-auto">
          {tab === "my" && (
            <div className="mb-4 text-sm text-zinc-400">
              {loading ? "Загрузка..." : <><span className="text-white font-medium">{announcements.length}</span> {announcements.length === 1 ? "объявление" : "объявлений"}</>}
            </div>
          )}
          {loading ? (
            <div className="text-center py-12">
              <Icon name="Loader2" className="h-8 w-8 animate-spin text-accent mx-auto" />
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-16">
              <Icon name="Inbox" className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                {tab === "my" ? "У вас нет объявлений" : "Объявлений не найдено"}
              </h3>
              <p className="text-zinc-400 mb-6 text-sm">
                {tab === "my"
                  ? "Нажмите «Подать объявление», чтобы опубликовать первое"
                  : searchTerm || selectedCategory !== "Все" ? "Попробуйте изменить фильтры" : "Пока нет объявлений"}
              </p>
              {tab === "public" && (searchTerm || selectedCategory !== "Все") && (
                <Button onClick={clearFilters} variant="outline">Сбросить фильтры</Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {announcements.map((ann) => {
                const isExpanded = expandedCards.has(ann.id!);
                const isOwner = user && ann.user_id === user.id;
                return (
                  <Card key={ann.id} className="bg-zinc-800 border-zinc-700 hover:border-accent transition-all flex flex-col">
                    <CardHeader className="pb-2 p-4">
                      <div className="flex items-start justify-between mb-2">
                        <Badge className="bg-purple-500 text-white text-xs">{ann.category}</Badge>
                        <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                          <span className="text-xs text-zinc-400">
                            {ann.created_at ? new Date(ann.created_at).toLocaleDateString("ru-RU") : ""}
                          </span>
                          {(isOwner || tab === "my") && (
                            <button
                              onClick={() => handleDelete(ann.id!)}
                              className="text-zinc-500 hover:text-red-400 transition-colors"
                              title="Удалить"
                            >
                              <Icon name="Trash2" size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                      <CardTitle className="text-white text-base sm:text-lg leading-tight font-['Oswald']">
                        {ann.title}
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-3 flex-1 flex flex-col p-4 pt-0">
                      {ann.image && (
                        <img src={ann.image} alt={ann.title} className="w-full h-48 object-cover rounded-md" />
                      )}
                      <div className="flex-1">
                        <p className={`text-zinc-400 text-sm ${isExpanded ? "" : "line-clamp-3"}`}>
                          {ann.description}
                        </p>
                        {ann.description && ann.description.length > 120 && (
                          <button
                            onClick={() => toggleExpanded(ann.id!)}
                            className="text-accent text-xs mt-1 hover:underline"
                          >
                            {isExpanded ? "Свернуть" : "Читать далее"}
                          </button>
                        )}
                      </div>

                      <div className="space-y-1.5 text-sm">
                        {ann.price && (
                          <div className="flex items-center gap-2">
                            <Icon name="Tag" className="h-4 w-4 text-accent flex-shrink-0" />
                            <span className="text-accent font-bold">{ann.price}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Icon name="User" className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                          {ann.user_id ? (
                            <button
                              onClick={() => openProfile(ann.user_id!)}
                              className="text-zinc-300 hover:text-accent transition-colors text-sm"
                            >
                              {ann.author}
                            </button>
                          ) : (
                            <span className="text-zinc-300">{ann.author}</span>
                          )}
                        </div>
                        {ann.location && (
                          <div className="flex items-center gap-2">
                            <Icon name="MapPin" className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                            <span className="text-zinc-300">{ann.location}</span>
                          </div>
                        )}
                      </div>

                      {tab !== "my" && (
                        <Button
                          size="sm"
                          className="w-full bg-accent hover:bg-accent/90 text-white mt-auto"
                          onClick={() => handleContactClick(ann.contact)}
                        >
                          <Icon name="MessageCircle" className="h-4 w-4 mr-2" />
                          Написать
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Sticky кнопка снизу */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <Button
          onClick={handleCreateClick}
          className="bg-accent hover:bg-accent/90 text-white gap-2 px-6 py-5 text-base shadow-2xl shadow-accent/30 rounded-full"
        >
          <Icon name="Plus" size={20} />
          Подать объявление
        </Button>
      </div>

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-['Oswald']">Новое объявление</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Категория *</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue placeholder="Выберите категорию" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Заголовок *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Продам Honda CB600F 2018..."
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Описание *</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Подробное описание..."
                required
                className="min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Цена</Label>
                <Input
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="350 000 ₽"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Город / Район</Label>
                <Input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="Тюмень"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Контакт для связи *</Label>
              <Input
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                placeholder="@username или https://t.me/..."
                required
              />
              <p className="text-xs text-muted-foreground">Telegram-юзернейм или ссылка</p>
            </div>

            <div className="space-y-1.5">
              <Label>Ссылка на фото (необязательно)</Label>
              <Input
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1 bg-accent hover:bg-accent/90" disabled={submitting}>
                {submitting
                  ? <Icon name="Loader2" className="animate-spin mr-2" size={16} />
                  : <Icon name="Send" className="mr-2" size={16} />}
                Опубликовать
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                Отмена
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        message="Войдите, чтобы публиковать объявления и видеть контакты"
      />
      {profileModal}
    </PageLayout>
  );
};

export default Announcements;