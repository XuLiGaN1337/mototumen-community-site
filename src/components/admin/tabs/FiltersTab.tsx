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
  { id: "announcements", label: "Объявления", icon: "Megaphone", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  { id: "shops", label: "Магазины", icon: "Store", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  { id: "services", label: "Сервисы", icon: "Wrench", color: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
  { id: "schools", label: "Мотошколы", icon: "GraduationCap", color: "bg-green-500/20 text-green-300 border-green-500/30" },
];

export const FiltersTab: React.FC = () => {
  const { token } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLabel, setNewLabel] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState<Record<string, boolean>>({});

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${ADMIN_API}?action=filter-categories`);
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      toast({ title: "Ошибка загрузки", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (section: string) => {
    const label = (newLabel[section] || "").trim();
    if (!label) return;
    setAdding(prev => ({ ...prev, [section]: true }));
    try {
      const res = await fetch(`${ADMIN_API}?action=filter-categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Auth-Token": token || "" },
        body: JSON.stringify({ section, label }),
      });
      if (res.ok) {
        setNewLabel(prev => ({ ...prev, [section]: "" }));
        await load();
        toast({ title: `Категория «${label}» добавлена` });
      } else {
        const err = await res.json();
        toast({ title: err.error || "Ошибка", variant: "destructive" });
      }
    } catch {
      toast({ title: "Ошибка", variant: "destructive" });
    } finally {
      setAdding(prev => ({ ...prev, [section]: false }));
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!confirm(`Удалить категорию «${cat.label}»?`)) return;
    try {
      const res = await fetch(`${ADMIN_API}?action=filter-categories`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "X-Auth-Token": token || "" },
        body: JSON.stringify({ id: cat.id }),
      });
      if (res.ok) {
        setCategories(prev => prev.filter(c => c.id !== cat.id));
        toast({ title: `Категория «${cat.label}» удалена` });
      } else {
        toast({ title: "Ошибка удаления", variant: "destructive" });
      }
    } catch {
      toast({ title: "Ошибка", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Icon name="Loader2" className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">Фильтры и категории</h3>
          <p className="text-zinc-400 text-sm mt-0.5">Управление списками категорий для каждого раздела</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="border-zinc-700">
          <Icon name="RefreshCw" size={14} className="mr-1.5" />
          Обновить
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SECTIONS.map((section) => {
          const sectionCats = categories.filter(c => c.section === section.id);
          return (
            <Card key={section.id} className="bg-zinc-800 border-zinc-700">
              <CardHeader className="pb-3 p-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Icon name={section.icon as "Store"} size={16} className="text-accent" />
                  {section.label}
                  <span className="ml-auto text-xs text-zinc-500 font-normal">{sectionCats.length} категорий</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                <div className="flex flex-wrap gap-2 min-h-[36px]">
                  {sectionCats.length === 0 ? (
                    <span className="text-zinc-500 text-sm">Нет категорий</span>
                  ) : (
                    sectionCats.map(cat => (
                      <Badge
                        key={cat.id}
                        className={`${section.color} border text-xs gap-1.5 pr-1 pl-2.5 py-1`}
                      >
                        {cat.label}
                        <button
                          onClick={() => handleDelete(cat)}
                          className="ml-0.5 hover:text-red-400 transition-colors"
                          title="Удалить"
                        >
                          <Icon name="X" size={11} />
                        </button>
                      </Badge>
                    ))
                  )}
                </div>

                <div className="flex gap-2 pt-1">
                  <Input
                    value={newLabel[section.id] || ""}
                    onChange={e => setNewLabel(prev => ({ ...prev, [section.id]: e.target.value }))}
                    onKeyDown={e => e.key === "Enter" && handleAdd(section.id)}
                    placeholder="Новая категория..."
                    className="bg-zinc-900 border-zinc-600 text-white text-sm h-8"
                  />
                  <Button
                    size="sm"
                    className="h-8 px-3 bg-accent hover:bg-accent/90"
                    onClick={() => handleAdd(section.id)}
                    disabled={adding[section.id] || !newLabel[section.id]?.trim()}
                  >
                    {adding[section.id]
                      ? <Icon name="Loader2" size={14} className="animate-spin" />
                      : <Icon name="Plus" size={14} />
                    }
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default FiltersTab;
