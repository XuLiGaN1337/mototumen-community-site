import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const EVENTS_API = "https://functions.poehali.dev/7930c1a0-da7e-4bd6-b184-7bafce79c328";

const CATEGORIES = ["Мотопробег", "Обучение", "Соревнования", "Встречи", "Покатушки", "Трек-день", "Гимхана", "Другое"];

interface MotoEvent {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: string;
  price: number;
  image_url: string;
  organizer_name: string;
  is_archived: boolean;
}

const emptyForm = {
  title: "", description: "", date: "", time: "", location: "",
  category: "Другое", price: 0, image_url: "", organizer_name: "",
};

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });

const Events = () => {
  const navigate = useNavigate();
  const { token, isAdmin } = useAuth();

  const [events, setEvents] = useState<MotoEvent[]>([]);
  const [archived, setArchived] = useState<MotoEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"active" | "archive">("active");
  const [slide, setSlide] = useState(0);
  const [selected, setSelected] = useState<MotoEvent | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MotoEvent | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [a, b] = await Promise.all([
        fetch(`${EVENTS_API}/?archived=false`).then(r => r.json()),
        fetch(`${EVENTS_API}/?archived=true`).then(r => r.json()),
      ]);
      setEvents(a.events || []);
      setArchived(b.events || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const featured = events.slice(0, 3);
  const current = tab === "active" ? events : archived;

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (e: MotoEvent) => {
    setEditing(e);
    setForm({
      title: e.title, description: e.description || "", date: e.date.slice(0, 10),
      time: e.time || "", location: e.location || "", category: e.category || "Другое",
      price: e.price || 0, image_url: e.image_url || "", organizer_name: e.organizer_name || "",
    });
    setSelected(null);
    setFormOpen(true);
  };

  const save = async () => {
    if (!form.title || !form.date) return;
    setSaving(true);
    try {
      const url = editing ? `${EVENTS_API}/?id=${editing.id}` : `${EVENTS_API}/`;
      const method = editing ? "PUT" : "POST";
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", "X-Auth-Token": token || "" },
        body: JSON.stringify(form),
      });
      setFormOpen(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const archiveEvent = async (e: MotoEvent) => {
    await fetch(`${EVENTS_API}/?id=${e.id}`, {
      method: "DELETE",
      headers: { "X-Auth-Token": token || "" },
    });
    setSelected(null);
    load();
  };

  const restore = async (e: MotoEvent) => {
    await fetch(`${EVENTS_API}/?id=${e.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Auth-Token": token || "" },
      body: JSON.stringify({ is_archived: false }),
    });
    load();
  };

  return (
    <div className="min-h-screen bg-[#1e2332] text-white">
      <div className="container mx-auto px-4 py-8 max-w-5xl">

        {/* Шапка */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate(-1)} className="text-gray-400 hover:text-white px-2">
              <Icon name="ArrowLeft" size={20} />
            </Button>
            <div>
              <h1 className="text-3xl font-bold font-['Oswald']">События</h1>
              <p className="text-gray-400 text-sm">Мотособытия, встречи и мероприятия</p>
            </div>
          </div>
          {isAdmin && (
            <Button onClick={openCreate} className="bg-accent hover:bg-accent/90">
              <Icon name="Plus" size={16} className="mr-2" />
              Добавить
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-32">
            <Icon name="Loader2" size={40} className="animate-spin text-accent" />
          </div>
        ) : (
          <>
            {/* Слайдер */}
            {featured.length > 0 && tab === "active" && (
              <div className="mb-8">
                <h2 className="text-xl font-bold font-['Oswald'] mb-4">Главные события</h2>
                <div className="relative rounded-2xl overflow-hidden h-64 sm:h-80 bg-zinc-900">
                  {featured.map((ev, i) => (
                    <div key={ev.id}
                      className={`absolute inset-0 transition-opacity duration-500 cursor-pointer ${i === slide ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                      onClick={() => setSelected(ev)}>
                      {ev.image_url
                        ? <img src={ev.image_url} alt={ev.title} className="w-full h-full object-cover" />
                        : <div className="w-full h-full bg-gradient-to-br from-accent/30 to-zinc-900 flex items-center justify-center">
                            <Icon name="Calendar" size={64} className="text-accent/40" />
                          </div>
                      }
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-5">
                        <Badge className="bg-accent mb-2">{ev.category}</Badge>
                        <h3 className="text-xl sm:text-2xl font-bold font-['Oswald'] mb-1">{ev.title}</h3>
                        <div className="flex flex-wrap gap-3 text-sm text-white/80">
                          <span className="flex items-center gap-1"><Icon name="Calendar" size={13} />{formatDate(ev.date)}</span>
                          {ev.time && <span className="flex items-center gap-1"><Icon name="Clock" size={13} />{ev.time}</span>}
                          {ev.location && <span className="flex items-center gap-1"><Icon name="MapPin" size={13} />{ev.location}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                  {featured.length > 1 && (
                    <>
                      <button onClick={() => setSlide(s => (s - 1 + featured.length) % featured.length)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 rounded-full p-2 z-10">
                        <Icon name="ChevronLeft" size={20} />
                      </button>
                      <button onClick={() => setSlide(s => (s + 1) % featured.length)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 rounded-full p-2 z-10">
                        <Icon name="ChevronRight" size={20} />
                      </button>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                        {featured.map((_, i) => (
                          <button key={i} onClick={() => setSlide(i)}
                            className={`h-1.5 rounded-full transition-all ${i === slide ? "bg-white w-5" : "bg-white/40 w-1.5"}`} />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Табы */}
            <div className="flex gap-1 bg-[#252836] rounded-xl p-1 mb-6 w-fit">
              {(["active", "archive"] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? "bg-accent text-white" : "text-gray-400 hover:text-white"}`}>
                  {t === "active" ? "Предстоящие" : "Архив"}
                  {t === "active" && events.length > 0 && <span className="ml-2 bg-white/20 rounded-full px-1.5 py-0.5 text-xs">{events.length}</span>}
                  {t === "archive" && archived.length > 0 && <span className="ml-2 bg-white/20 rounded-full px-1.5 py-0.5 text-xs">{archived.length}</span>}
                </button>
              ))}
            </div>

            {/* Сетка */}
            {current.length === 0 ? (
              <div className="flex flex-col items-center py-24 text-center">
                <Icon name="CalendarX" size={56} className="text-zinc-600 mb-4" />
                <p className="text-zinc-400 font-medium">{tab === "active" ? "Предстоящих событий нет" : "Архив пуст"}</p>
                {tab === "active" && isAdmin && (
                  <Button onClick={openCreate} variant="outline" className="mt-4 border-accent text-accent hover:bg-accent/10">
                    Добавить первое событие
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {current.map(ev => (
                  <div key={ev.id} onClick={() => setSelected(ev)}
                    className="bg-[#252836] border border-white/5 hover:border-accent/50 rounded-xl overflow-hidden cursor-pointer transition-all group">
                    <div className="relative h-44 bg-zinc-900">
                      {ev.image_url
                        ? <img src={ev.image_url} alt={ev.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        : <div className="w-full h-full flex items-center justify-center">
                            <Icon name="Calendar" size={48} className="text-zinc-700" />
                          </div>
                      }
                      <div className="absolute top-3 left-3">
                        <div className="bg-accent text-white rounded-lg px-2.5 py-1.5 text-center min-w-[48px]">
                          <div className="text-xl font-bold font-['Oswald'] leading-none">{new Date(ev.date).getDate()}</div>
                          <div className="text-[10px] uppercase">{new Date(ev.date).toLocaleDateString("ru-RU", { month: "short" })}</div>
                        </div>
                      </div>
                      <Badge className="absolute top-3 right-3 bg-black/60 text-xs">{ev.category}</Badge>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold font-['Oswald'] text-lg leading-tight mb-1 line-clamp-2">{ev.title}</h3>
                      {ev.location && <p className="text-xs text-zinc-500 flex items-center gap-1 mb-2"><Icon name="MapPin" size={11} />{ev.location}</p>}
                      <span className="text-accent text-sm font-semibold">{ev.price === 0 ? "Бесплатно" : `${ev.price} ₽`}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Модал просмотра */}
      {selected && (
        <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
          <DialogContent className="bg-[#252836] border-zinc-700 text-white max-w-lg p-0 overflow-hidden">
            {selected.image_url
              ? <div className="relative h-52">
                  <img src={selected.image_url} alt={selected.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <Badge className="absolute bottom-4 left-4 bg-accent">{selected.category}</Badge>
                </div>
              : <div className="h-20 bg-gradient-to-br from-accent/20 to-zinc-900 flex items-center justify-center">
                  <Icon name="Calendar" size={36} className="text-accent/40" />
                </div>
            }
            <div className="p-5 space-y-3">
              <h2 className="text-2xl font-bold font-['Oswald']">{selected.title}</h2>
              <div className="flex flex-wrap gap-3 text-sm text-zinc-400">
                <span className="flex items-center gap-1.5"><Icon name="Calendar" size={14} className="text-accent" />{formatDate(selected.date)}</span>
                {selected.time && <span className="flex items-center gap-1.5"><Icon name="Clock" size={14} className="text-accent" />{selected.time}</span>}
                {selected.location && <span className="flex items-center gap-1.5"><Icon name="MapPin" size={14} className="text-accent" />{selected.location}</span>}
              </div>
              {selected.description && <p className="text-zinc-300 text-sm leading-relaxed">{selected.description}</p>}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-700">
                <span className="text-accent font-bold text-lg">{selected.price === 0 ? "Бесплатно" : `${selected.price} ₽`}</span>
                {selected.organizer_name && <span className="text-xs text-zinc-500">Организатор: {selected.organizer_name}</span>}
              </div>
              {isAdmin && (
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" className="flex-1 border-zinc-600 text-zinc-300 hover:text-white text-sm" onClick={() => openEdit(selected)}>
                    <Icon name="Edit" size={14} className="mr-1.5" />Редактировать
                  </Button>
                  {!selected.is_archived
                    ? <Button variant="outline" className="border-zinc-600 text-zinc-500 hover:text-white text-sm px-3" onClick={() => archiveEvent(selected)} title="В архив">
                        <Icon name="Archive" size={14} />
                      </Button>
                    : <Button variant="outline" className="border-zinc-600 text-zinc-500 hover:text-white text-sm px-3" onClick={() => restore(selected)} title="Вернуть">
                        <Icon name="ArchiveRestore" size={14} />
                      </Button>
                  }
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Форма создания/редактирования */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="bg-[#252836] border-zinc-700 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Редактировать событие" : "Новое событие"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Название *</label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Мотопробег Весенний старт" className="bg-zinc-800 border-zinc-700" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Дата *</label>
                <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Время</label>
                <Input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700" />
              </div>
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Место</label>
              <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                placeholder="Центральная площадь" className="bg-zinc-800 border-zinc-700" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Категория</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Стоимость (₽)</label>
                <Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
                  placeholder="0 — бесплатно" className="bg-zinc-800 border-zinc-700" />
              </div>
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Организатор</label>
              <Input value={form.organizer_name} onChange={e => setForm(f => ({ ...f, organizer_name: e.target.value }))}
                placeholder="МОТОТюмень" className="bg-zinc-800 border-zinc-700" />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Фото (URL)</label>
              <Input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                placeholder="https://..." className="bg-zinc-800 border-zinc-700" />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Описание</label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Подробности события..." className="bg-zinc-800 border-zinc-700 min-h-[80px]" />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 border-zinc-600" onClick={() => setFormOpen(false)}>Отмена</Button>
              <Button className="flex-1 bg-accent hover:bg-accent/90" onClick={save} disabled={saving || !form.title || !form.date}>
                {saving && <Icon name="Loader2" size={16} className="animate-spin mr-2" />}
                {editing ? "Сохранить" : "Создать"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Events;
