import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const ADMIN_API = "https://functions.poehali.dev/f34bd996-f5f2-4c81-8b7b-fb5621187a7f";

interface Category {
  id: number;
  section: string;
  label: string;
  sort_order: number;
}

const SECTIONS = [
  { key: "announcements", label: "Объявления", icon: "Megaphone", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  { key: "shops",         label: "Магазины",   icon: "ShoppingBag", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  { key: "services",      label: "Сервисы",    icon: "Wrench",      color: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
  { key: "schools",       label: "Мотошколы",  icon: "GraduationCap", color: "bg-green-500/20 text-green-300 border-green-500/30" },
];

const FiltersTab: React.FC = () => {
  const { token } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("announcements");
  const [newLabel, setNewLabel] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState("");

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${ADMIN_API}?action=filter-categories`, {
        headers: { "X-Auth-Token": token },
      });
      const data = await res.json();
      setCategories(data.categories || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [token]);

  const sectionCats = categories
    .filter(c => c.section === activeSection)
    .sort((a, b) => a.sort_order - b.sort_order);

  const handleAdd = async () => {
    if (!newLabel.trim() || !token) return;
    setAdding(true);
    try {
      const res = await fetch(`${ADMIN_API}?action=filter-categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Auth-Token": token },
        body: JSON.stringify({ section: activeSection, label: newLabel.trim() }),
      });
      if (res.ok) {
        setNewLabel("");
        await load();
        toast({ title: "Категория добавлена" });
      } else {
        const e = await res.json();
        toast({ title: e.error || "Ошибка", variant: "destructive" });
      }
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: number, label: string) => {
    if (!token || !confirm(`Удалить категорию «${label}»?`)) return;
    try {
      const res = await fetch(`${ADMIN_API}?action=filter-categories`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "X-Auth-Token": token },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setCategories(prev => prev.filter(c => c.id !== id));
        toast({ title: "Категория удалена" });
      }
    } catch {
      toast({ title: "Ошибка", variant: "destructive" });
    }
  };

  const handleRename = async (id: number) => {
    if (!token || !editLabel.trim()) return;
    try {
      const res = await fetch(`${ADMIN_API}?action=filter-categories`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-Auth-Token": token },
        body: JSON.stringify({ id, label: editLabel.trim() }),
      });
      if (res.ok) {
        setCategories(prev => prev.map(c => c.id === id ? { ...c, label: editLabel.trim() } : c));
        setEditingId(null);
        toast({ title: "Сохранено" });
      }
    } catch {
      toast({ title: "Ошибка", variant: "destructive" });
    }
  };

  const handleMoveUp = async (cat: Category, idx: number) => {
    if (idx === 0 || !token) return;
    const prev = sectionCats[idx - 1];
    await Promise.all([
      fetch(`${ADMIN_API}?action=filter-categories`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-Auth-Token": token },
        body: JSON.stringify({ id: cat.id, sort_order: prev.sort_order }),
      }),
      fetch(`${ADMIN_API}?action=filter-categories`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-Auth-Token": token },
        body: JSON.stringify({ id: prev.id, sort_order: cat.sort_order }),
      }),
    ]);
    await load();
  };

  const handleMoveDown = async (cat: Category, idx: number) => {
    if (idx === sectionCats.length - 1 || !token) return;
    const next = sectionCats[idx + 1];
    await Promise.all([
      fetch(`${ADMIN_API}?action=filter-categories`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-Auth-Token": token },
        body: JSON.stringify({ id: cat.id, sort_order: next.sort_order }),
      }),
      fetch(`${ADMIN_API}?action=filter-categories`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-Auth-Token": token },
        body: JSON.stringify({ id: next.id, sort_order: cat.sort_order }),
      }),
    ]);
    await load();
  };

  const activeSec = SECTIONS.find(s => s.key === activeSection)!;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-xl font-bold text-white">Фильтры</h3>
          <p className="text-zinc-400 text-sm mt-1">Управление категориями фильтров по разделам</p>
        </div>
        <Button onClick={load} variant="outline" size="sm" className="border-zinc-700">
          <Icon name="RefreshCw" size={14} className="mr-2" />
          Обновить
        </Button>
      </div>

      {/* Section tabs */}
      <div className="flex flex-wrap gap-2">
        {SECTIONS.map(sec => (
          <button
            key={sec.key}
            onClick={() => setActiveSection(sec.key)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
              activeSection === sec.key
                ? sec.color + " border-current"
                : "text-zinc-400 border-zinc-700 hover:text-white hover:border-zinc-500"
            }`}
          >
            <Icon name={sec.icon as "Megaphone"} size={14} />
            {sec.label}
            <span className="text-xs opacity-70">
              {categories.filter(c => c.section === sec.key).length}
            </span>
          </button>
        ))}
      </div>

      <Card className="bg-zinc-800/60 border-zinc-700">
        <CardHeader className="p-4 pb-3">
          <div className="flex items-center gap-2">
            <Icon name={activeSec.icon as "Megaphone"} size={16} className="text-accent" />
            <CardTitle className="text-base text-white">
              Категории раздела «{activeSec.label}»
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-3">
          {/* Добавить */}
          <div className="flex gap-2">
            <Input
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAdd()}
              placeholder="Название новой категории..."
              className="bg-zinc-900 border-zinc-600 text-white"
            />
            <Button
              onClick={handleAdd}
              disabled={adding || !newLabel.trim()}
              className="bg-accent hover:bg-accent/90 shrink-0"
            >
              <Icon name="Plus" size={16} className="mr-1" />
              Добавить
            </Button>
          </div>

          {/* Список */}
          {loading ? (
            <div className="flex justify-center py-6">
              <Icon name="Loader2" size={20} className="animate-spin text-accent" />
            </div>
          ) : sectionCats.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 text-sm">
              Нет категорий. Добавьте первую выше.
            </div>
          ) : (
            <div className="space-y-2">
              {sectionCats.map((cat, idx) => (
                <div
                  key={cat.id}
                  className="flex items-center gap-2 bg-zinc-900/60 border border-zinc-700 rounded-lg px-3 py-2.5"
                >
                  {/* Порядок */}
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => handleMoveUp(cat, idx)}
                      disabled={idx === 0}
                      className="text-zinc-500 hover:text-white disabled:opacity-20 transition-colors"
                    >
                      <Icon name="ChevronUp" size={14} />
                    </button>
                    <button
                      onClick={() => handleMoveDown(cat, idx)}
                      disabled={idx === sectionCats.length - 1}
                      className="text-zinc-500 hover:text-white disabled:opacity-20 transition-colors"
                    >
                      <Icon name="ChevronDown" size={14} />
                    </button>
                  </div>

                  <span className="text-zinc-600 text-xs w-5 text-center">{idx + 1}</span>

                  {/* Редактирование */}
                  {editingId === cat.id ? (
                    <div className="flex gap-2 flex-1">
                      <Input
                        value={editLabel}
                        onChange={e => setEditLabel(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleRename(cat.id)}
                        className="h-7 text-sm bg-zinc-800 border-zinc-600 text-white flex-1"
                        autoFocus
                      />
                      <Button size="sm" className="h-7 px-2 bg-accent hover:bg-accent/90" onClick={() => handleRename(cat.id)}>
                        <Icon name="Check" size={13} />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setEditingId(null)}>
                        <Icon name="X" size={13} />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Badge className={`flex-1 justify-start text-sm font-normal ${activeSec.color}`}>
                        {cat.label}
                      </Badge>
                      <button
                        onClick={() => { setEditingId(cat.id); setEditLabel(cat.label); }}
                        className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
                        title="Переименовать"
                      >
                        <Icon name="Pencil" size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id, cat.label)}
                        className="text-zinc-500 hover:text-red-400 transition-colors p-1"
                        title="Удалить"
                      >
                        <Icon name="Trash2" size={13} />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-zinc-500 pt-1">
            Категории отображаются в фильтрах раздела «{activeSec.label}» в том же порядке.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default FiltersTab;
