import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Announcement {
  id?: number;
  title: string;
  description: string;
  category: string;
  image: string;
  author: string;
  contact: string;
  price: string;
  location: string;
  status: string;
  created_at?: string;
}

const CONTENT_API = "https://functions.poehali.dev/34a08e29-2d68-492d-958c-6de39b313388";

export const AnnouncementsAdminTab: React.FC = () => {
  const { token } = useAuth();
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"active" | "archived">("active");

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${CONTENT_API}?type=announcements`);
      const data = await res.json();
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch {
      toast({ title: "Ошибка загрузки", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!editing) return;
    try {
      setLoading(true);
      const method = editing.id ? "PUT" : "POST";
      const res = await fetch(`${CONTENT_API}?type=announcements`, {
        method,
        headers: { "Content-Type": "application/json", ...(token ? { "X-Auth-Token": token } : {}) },
        body: JSON.stringify(editing),
      });
      if (res.ok) {
        toast({ title: editing.id ? "Объявление обновлено" : "Объявление создано" });
        await load();
        setEditing(null);
      } else {
        const err = await res.json();
        toast({ title: err.error || "Ошибка сохранения", variant: "destructive" });
      }
    } catch {
      toast({ title: "Не удалось подключиться", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (ann: Announcement) => {
    if (!ann.id || !token) return;
    const isArchiving = ann.status !== "archived";
    if (!confirm(isArchiving ? `Архивировать «${ann.title}»?` : `Восстановить «${ann.title}»?`)) return;
    try {
      const res = await fetch(`${CONTENT_API}?type=announcements`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-Auth-Token": token },
        body: JSON.stringify({ id: ann.id, status: isArchiving ? "archived" : "active" }),
      });
      if (res.ok) {
        toast({ title: isArchiving ? "Архивировано" : "Восстановлено" });
        await load();
      } else {
        toast({ title: "Ошибка", variant: "destructive" });
      }
    } catch {
      toast({ title: "Ошибка", variant: "destructive" });
    }
  };

  const visible = announcements.filter(a =>
    filter === "active" ? a.status !== "archived" : a.status === "archived"
  );

  return (
    <div className="space-y-4 mt-4">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-white">Объявления</h3>
          <div className="flex gap-1">
            <Button size="sm" variant={filter === "active" ? "default" : "outline"}
              className={filter === "active" ? "h-7 text-xs bg-accent" : "h-7 text-xs border-zinc-600"}
              onClick={() => setFilter("active")}>
              Активные ({announcements.filter(a => a.status !== "archived").length})
            </Button>
            <Button size="sm" variant={filter === "archived" ? "default" : "outline"}
              className={filter === "archived" ? "h-7 text-xs bg-zinc-600" : "h-7 text-xs border-zinc-600"}
              onClick={() => setFilter("archived")}>
              Архив ({announcements.filter(a => a.status === "archived").length})
            </Button>
          </div>
        </div>
        <Button onClick={() => setEditing({ title: "", description: "", category: "Общее", image: "", author: "", contact: "", price: "", location: "", status: "active" })}
          className="bg-accent hover:bg-accent/90" size="sm">
          <Icon name="Plus" className="h-4 w-4 mr-1" />
          Добавить
        </Button>
      </div>

      {/* Форма редактирования */}
      {editing && (
        <Card className="bg-zinc-800 border-zinc-600">
          <CardContent className="p-4 space-y-3">
            <h4 className="text-white font-semibold">{editing.id ? "Редактировать" : "Новое"} объявление</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input placeholder="Заголовок *" value={editing.title}
                onChange={e => setEditing({ ...editing, title: e.target.value })}
                className="bg-zinc-900 border-zinc-700 text-white" />
              <Input placeholder="Категория" value={editing.category}
                onChange={e => setEditing({ ...editing, category: e.target.value })}
                className="bg-zinc-900 border-zinc-700 text-white" />
              <Input placeholder="Автор" value={editing.author}
                onChange={e => setEditing({ ...editing, author: e.target.value })}
                className="bg-zinc-900 border-zinc-700 text-white" />
              <Input placeholder="Контакт" value={editing.contact}
                onChange={e => setEditing({ ...editing, contact: e.target.value })}
                className="bg-zinc-900 border-zinc-700 text-white" />
              <Input placeholder="Цена" value={editing.price}
                onChange={e => setEditing({ ...editing, price: e.target.value })}
                className="bg-zinc-900 border-zinc-700 text-white" />
              <Input placeholder="Местоположение" value={editing.location}
                onChange={e => setEditing({ ...editing, location: e.target.value })}
                className="bg-zinc-900 border-zinc-700 text-white" />
            </div>
            <Textarea placeholder="Описание" value={editing.description}
              onChange={e => setEditing({ ...editing, description: e.target.value })}
              className="bg-zinc-900 border-zinc-700 text-white min-h-[80px]" />
            <Input placeholder="Ссылка на фото" value={editing.image}
              onChange={e => setEditing({ ...editing, image: e.target.value })}
              className="bg-zinc-900 border-zinc-700 text-white" />
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={loading} className="bg-accent hover:bg-accent/90">
                <Icon name="Save" className="h-4 w-4 mr-1" />Сохранить
              </Button>
              <Button onClick={() => setEditing(null)} variant="outline" className="border-zinc-600">Отмена</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Список */}
      <div className="grid gap-3">
        {loading && visible.length === 0 ? (
          <p className="text-zinc-400 text-center py-8">Загрузка...</p>
        ) : visible.length === 0 ? (
          <p className="text-zinc-400 text-center py-8">
            {filter === "archived" ? "Архив пуст" : "Нет активных объявлений"}
          </p>
        ) : (
          visible.map(ann => (
            <Card key={ann.id} className="bg-zinc-800 border-zinc-700">
              <CardContent className="p-4">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="font-semibold text-white truncate">{ann.title}</h4>
                      <Badge className="text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 flex-shrink-0">
                        {ann.category}
                      </Badge>
                      {ann.status === "archived" && (
                        <Badge className="text-xs bg-zinc-600/50 text-zinc-400 flex-shrink-0">Архив</Badge>
                      )}
                    </div>
                    <p className="text-sm text-zinc-400 line-clamp-1">{ann.description}</p>
                    <div className="flex gap-3 mt-1 text-xs text-zinc-500">
                      {ann.author && <span>👤 {ann.author}</span>}
                      {ann.price && <span>💰 {ann.price}</span>}
                      {ann.location && <span>📍 {ann.location}</span>}
                      {ann.created_at && <span>{new Date(ann.created_at).toLocaleDateString("ru-RU")}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button onClick={() => setEditing(ann)} variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-zinc-700">
                      <Icon name="Edit" size={14} />
                    </Button>
                    <Button onClick={() => handleArchive(ann)} variant="ghost" size="sm"
                      className={`h-8 w-8 p-0 ${ann.status === "archived" ? "hover:bg-green-900/30 text-green-400" : "hover:bg-amber-900/30 text-amber-400"}`}
                      title={ann.status === "archived" ? "Восстановить" : "Архивировать"}>
                      <Icon name={ann.status === "archived" ? "ArchiveRestore" : "Archive"} size={14} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
