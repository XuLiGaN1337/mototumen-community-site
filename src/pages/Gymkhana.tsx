import React, { useRef, useState, useEffect } from "react";
import PageLayout from "@/components/layout/PageLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const API = "https://functions.poehali.dev/8ddbc450-a28e-4841-a858-c30f189ce661";

interface GymEvent {
  id: number;
  title: string;
  event_date: string;
  event_day: string;
  time_start: string;
  time_end: string;
  location: string;
  type: "free" | "paid";
  price?: string;
  spots: string;
}

interface HistoryPoint {
  id: number;
  year: string;
  title: string;
  text: string;
  side: "left" | "right";
  icon: string;
  sort_order: number;
}

const emptyEvent = (): Omit<GymEvent, "id"> => ({
  title: "", event_date: "", event_day: "", time_start: "",
  time_end: "", location: "", type: "free", price: "", spots: "∞",
});

const emptyHistory = (): Omit<HistoryPoint, "id" | "sort_order"> => ({
  year: "", title: "", text: "", side: "left", icon: "Star",
});

const Gymkhana: React.FC = () => {
  const aboutRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const { user, token } = useAuth();
  const { toast } = useToast();

  const [filter, setFilter] = useState<"all" | "free" | "paid">("all");
  const [events, setEvents] = useState<GymEvent[]>([]);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Режим редактирования
  const canEdit = user?.role === "gymkhana" || user?.role === "admin" || user?.role === "ceo";

  // Диалог события
  const [eventDialog, setEventDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<GymEvent | null>(null);
  const [eventForm, setEventForm] = useState(emptyEvent());
  const [savingEvent, setSavingEvent] = useState(false);

  // Диалог истории
  const [historyDialog, setHistoryDialog] = useState(false);
  const [editingHistory, setEditingHistory] = useState<HistoryPoint | null>(null);
  const [historyForm, setHistoryForm] = useState(emptyHistory());
  const [savingHistory, setSavingHistory] = useState(false);

  useEffect(() => { loadEvents(); loadHistory(); }, []);

  const loadEvents = async () => {
    setLoadingEvents(true);
    try {
      const r = await fetch(`${API}?section=events`);
      const d = await r.json();
      setEvents(Array.isArray(d) ? d : []);
    } finally { setLoadingEvents(false); }
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const r = await fetch(`${API}?section=history`);
      const d = await r.json();
      setHistory(Array.isArray(d) ? d : []);
    } finally { setLoadingHistory(false); }
  };

  // ── СОБЫТИЯ ──────────────────────────────────────────────
  const openNewEvent = () => {
    setEditingEvent(null);
    setEventForm(emptyEvent());
    setEventDialog(true);
  };

  const openEditEvent = (ev: GymEvent) => {
    setEditingEvent(ev);
    setEventForm({ ...ev });
    setEventDialog(true);
  };

  const saveEvent = async () => {
    if (!token) return;
    setSavingEvent(true);
    try {
      const method = editingEvent ? "PUT" : "POST";
      const body = editingEvent ? { ...eventForm, id: editingEvent.id } : eventForm;
      const r = await fetch(`${API}?section=events`, {
        method,
        headers: { "Content-Type": "application/json", "X-Auth-Token": token },
        body: JSON.stringify(body),
      });
      if (r.ok) {
        toast({ title: editingEvent ? "Сохранено" : "Добавлено" });
        setEventDialog(false);
        loadEvents();
      } else {
        const d = await r.json();
        toast({ title: d.error || "Ошибка", variant: "destructive" });
      }
    } finally { setSavingEvent(false); }
  };

  const deleteEvent = async (id: number) => {
    if (!token || !confirm("Удалить событие?")) return;
    const r = await fetch(`${API}?section=events`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "X-Auth-Token": token },
      body: JSON.stringify({ id }),
    });
    if (r.ok) { toast({ title: "Удалено" }); loadEvents(); }
  };

  // ── ИСТОРИЯ ──────────────────────────────────────────────
  const openNewHistory = () => {
    setEditingHistory(null);
    setHistoryForm(emptyHistory());
    setHistoryDialog(true);
  };

  const openEditHistory = (h: HistoryPoint) => {
    setEditingHistory(h);
    setHistoryForm({ year: h.year, title: h.title, text: h.text, side: h.side, icon: h.icon });
    setHistoryDialog(true);
  };

  const saveHistory = async () => {
    if (!token) return;
    setSavingHistory(true);
    try {
      const method = editingHistory ? "PUT" : "POST";
      const body = editingHistory ? { ...historyForm, id: editingHistory.id } : historyForm;
      const r = await fetch(`${API}?section=history`, {
        method,
        headers: { "Content-Type": "application/json", "X-Auth-Token": token },
        body: JSON.stringify(body),
      });
      if (r.ok) {
        toast({ title: editingHistory ? "Сохранено" : "Добавлено" });
        setHistoryDialog(false);
        loadHistory();
      } else {
        const d = await r.json();
        toast({ title: d.error || "Ошибка", variant: "destructive" });
      }
    } finally { setSavingHistory(false); }
  };

  const deleteHistory = async (id: number) => {
    if (!token || !confirm("Удалить запись из истории?")) return;
    const r = await fetch(`${API}?section=history`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "X-Auth-Token": token },
      body: JSON.stringify({ id }),
    });
    if (r.ok) { toast({ title: "Удалено" }); loadHistory(); }
  };

  const filtered = events.filter((e) => filter === "all" || e.type === filter);

  return (
    <PageLayout>
      {/* ─── HERO ─── */}
      <section className="relative bg-dark-900 text-white overflow-hidden" style={{ minHeight: "92vh" }}>
        <div className="absolute inset-0 bg-gradient-to-br from-[#001830] via-dark-900 to-black" />
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #004488 0%, transparent 50%), radial-gradient(circle at 80% 20%, #004488 0%, transparent 40%)" }} />
        <div className="relative z-10 container mx-auto px-4 flex flex-col items-center justify-center text-center" style={{ minHeight: "92vh" }}>
          <Badge className="mb-6 bg-[#004488]/20 border border-[#004488] text-[#4488cc] text-sm px-4 py-1">
            Тюмень • с 2018 года
          </Badge>
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black font-['Oswald'] tracking-tight mb-4 leading-none">
            МОТО<br /><span className="text-[#004488]">ДЖИМХАНА</span>
          </h1>
          <p className="text-gray-400 text-lg sm:text-xl max-w-xl mx-auto mb-10">
            Искусство точного управления мотоциклом. Скорость — не главное. Точность — всё.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => calendarRef.current?.scrollIntoView({ behavior: "smooth" })}
              className="px-8 py-3 bg-[#004488] hover:bg-[#0055aa] text-white font-semibold rounded-lg transition-colors">
              Записаться на тренировку
            </button>
            <button onClick={() => aboutRef.current?.scrollIntoView({ behavior: "smooth" })}
              className="px-8 py-3 border border-zinc-600 text-zinc-300 hover:text-white hover:border-zinc-400 font-semibold rounded-lg transition-colors">
              Узнать больше
            </button>
          </div>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center text-zinc-600 animate-bounce">
            <span className="text-xs mb-1">История</span>
            <Icon name="ChevronDown" size={20} />
          </div>
        </div>
      </section>

      {/* ─── ИСТОРИЯ ─── */}
      <section className="bg-dark-900 py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-14">
            <div className="flex items-center justify-center gap-3 mb-3">
              <h2 className="text-3xl sm:text-4xl font-black font-['Oswald'] text-white">
                ПУТЬ <span className="text-[#004488]">ДЖИМХАНЫ</span>
              </h2>
              {canEdit && (
                <button onClick={openNewHistory}
                  className="w-8 h-8 rounded-full bg-[#004488]/30 hover:bg-[#004488] border border-[#004488]/50 flex items-center justify-center transition-colors"
                  title="Добавить запись">
                  <Icon name="Plus" size={14} className="text-[#4488cc]" />
                </button>
              )}
            </div>
            <p className="text-zinc-400">От первой конусной площадки до городского чемпионата</p>
          </div>

          <div className="relative">
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#004488] via-[#004488]/50 to-transparent -translate-x-1/2 hidden sm:block" />
            <div className="space-y-0">
              {loadingHistory ? (
                <div className="text-center py-12"><Icon name="Loader2" className="h-8 w-8 animate-spin text-[#004488] mx-auto" /></div>
              ) : history.map((point) => (
                <div key={point.id} className={`relative flex items-center gap-6 sm:gap-0 group ${point.side === "left" ? "sm:flex-row" : "sm:flex-row-reverse"}`}>
                  <div className={`flex-1 sm:py-8 ${point.side === "left" ? "sm:pr-12 sm:text-right" : "sm:pl-12 sm:text-left"}`}>
                    <div className="inline-block mb-2">
                      <span className="text-[#004488] font-black text-2xl font-['Oswald']">{point.year}</span>
                    </div>
                    <h3 className="text-white font-bold text-lg mb-2">{point.title}</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed">{point.text}</p>
                    {canEdit && (
                      <div className={`flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity ${point.side === "left" ? "sm:justify-end" : "sm:justify-start"}`}>
                        <button onClick={() => openEditHistory(point)}
                          className="p-1 rounded text-zinc-500 hover:text-[#4488cc] hover:bg-[#004488]/20 transition-colors">
                          <Icon name="Pencil" size={13} />
                        </button>
                        <button onClick={() => deleteHistory(point.id)}
                          className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                          <Icon name="Trash2" size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="hidden sm:flex relative z-10 w-12 h-12 flex-shrink-0 items-center justify-center rounded-full bg-[#004488] border-4 border-dark-900 shadow-lg shadow-[#004488]/30">
                    <Icon name={point.icon as "Star"} size={18} className="text-white" />
                  </div>
                  <div className="hidden sm:block flex-1" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── О КЛУБЕ ─── */}
      <section ref={aboutRef} className="bg-zinc-900 py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black font-['Oswald'] text-white mb-3">
              KTO TAKOE <span className="text-[#004488]">MOTOGYMKHANA TYUMEN</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              { icon: "Users", title: "Сообщество", text: "Более 150 активных участников. Открыты для всех — от новичков до опытных гонщиков. Главное — желание развиваться." },
              { icon: "Target", title: "Дисциплина", text: "Джимхана — это точность, а не скорость. Прохождение конусных фигур на время без штрафных секунд за сбитые конусы." },
              { icon: "Award", title: "Соревнования", text: "Городской чемпионат с 7 этапами в сезоне. Участие в Чемпионате УрФО. Собственная система классификации и рейтинга." },
            ].map((item, i) => (
              <Card key={i} className="bg-dark-800 border-zinc-700">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-[#004488]/20 border border-[#004488]/40 flex items-center justify-center mx-auto mb-4">
                    <Icon name={item.icon as "Users"} size={22} className="text-[#4488cc]" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-zinc-400 text-sm">{item.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="bg-dark-800 border border-zinc-700 rounded-xl p-8">
            <h3 className="text-white font-black text-xl font-['Oswald'] mb-6 text-center">ОРГАНИЗАТОРЫ</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { name: "Андрей Кулик", role: "Основатель клуба", desc: "Привёз джимхану в Тюмень в 2018 году. Участник чемпионатов России.", tg: "@kulik_moto" },
                { name: "Команда MotoGymkhana", role: "Судьи и инструкторы", desc: "8 сертифицированных инструкторов и судей с опытом федеральных соревнований.", tg: "@motogym_tumen" },
              ].map((org, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#004488]/20 border border-[#004488]/40 flex items-center justify-center flex-shrink-0">
                    <Icon name="User" size={20} className="text-[#4488cc]" />
                  </div>
                  <div>
                    <p className="text-white font-bold">{org.name}</p>
                    <p className="text-[#4488cc] text-sm mb-1">{org.role}</p>
                    <p className="text-zinc-400 text-sm mb-2">{org.desc}</p>
                    <a href={`https://t.me/${org.tg.replace("@", "")}`} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-zinc-500 hover:text-[#4488cc] transition-colors">{org.tg}</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── КАЛЕНДАРЬ ─── */}
      <section ref={calendarRef} className="bg-dark-900 py-16 px-4 pb-24">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-3">
              <h2 className="text-3xl sm:text-4xl font-black font-['Oswald'] text-white">
                КАЛЕНДАРЬ <span className="text-[#004488]">ТРЕНИРОВОК</span>
              </h2>
              {canEdit && (
                <button onClick={openNewEvent}
                  className="w-8 h-8 rounded-full bg-[#004488]/30 hover:bg-[#004488] border border-[#004488]/50 flex items-center justify-center transition-colors"
                  title="Добавить событие">
                  <Icon name="Plus" size={14} className="text-[#4488cc]" />
                </button>
              )}
            </div>
            <p className="text-zinc-400 text-sm">Апрель — Май 2026</p>
          </div>

          <div className="flex gap-2 justify-center mb-8">
            {(["all", "free", "paid"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f ? "bg-[#004488] text-white" : "bg-zinc-800 text-zinc-400 hover:text-white"}`}>
                {f === "all" ? "Все" : f === "free" ? "Бесплатные" : "Платные"}
              </button>
            ))}
          </div>

          {loadingEvents ? (
            <div className="text-center py-12"><Icon name="Loader2" className="h-8 w-8 animate-spin text-[#004488] mx-auto" /></div>
          ) : (
            <div className="space-y-3">
              {filtered.map((ev) => (
                <div key={ev.id}
                  className="bg-zinc-800 border border-zinc-700 hover:border-[#004488]/50 rounded-xl p-4 sm:p-5 flex gap-4 transition-colors group">
                  <div className="flex-shrink-0 text-center w-14">
                    <div className="text-[#004488] font-black text-xl font-['Oswald'] leading-none">
                      {ev.event_date.split(" ")[0]}
                    </div>
                    <div className="text-zinc-500 text-xs uppercase">{ev.event_date.split(" ")[1]}</div>
                    <div className="text-zinc-600 text-xs mt-1">{ev.event_day}</div>
                  </div>
                  <div className="w-px bg-zinc-700 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-white font-bold text-sm sm:text-base">{ev.title}</h3>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {ev.type === "free" ? (
                          <Badge className="bg-green-900/40 text-green-400 border border-green-800 text-xs">Бесплатно</Badge>
                        ) : (
                          <Badge className="bg-[#004488]/30 text-[#4488cc] border border-[#004488]/50 text-xs">{ev.price}</Badge>
                        )}
                        {canEdit && (
                          <>
                            <button onClick={() => openEditEvent(ev)}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded text-zinc-500 hover:text-[#4488cc] hover:bg-[#004488]/20 transition-all">
                              <Icon name="Pencil" size={13} />
                            </button>
                            <button onClick={() => deleteEvent(ev.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
                              <Icon name="Trash2" size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                      <span className="flex items-center gap-1"><Icon name="Clock" size={12} />{ev.time_start} – {ev.time_end}</span>
                      <span className="flex items-center gap-1"><Icon name="MapPin" size={12} />{ev.location}</span>
                      <span className="flex items-center gap-1"><Icon name="Users" size={12} />{ev.spots === "∞" ? "без ограничений" : `осталось мест: ${ev.spots}`}</span>
                    </div>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="text-center py-12 text-zinc-500">Нет событий</div>
              )}
            </div>
          )}

          <div className="mt-10 text-center">
            <p className="text-zinc-500 text-sm mb-4">Вопросы по расписанию и регистрации</p>
            <a href="https://t.me/motogym_tumen" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#004488] hover:bg-[#0055aa] text-white font-semibold rounded-lg transition-colors">
              <Icon name="Send" size={16} />
              Написать в Telegram
            </a>
          </div>
        </div>
      </section>

      {/* ─── ДИАЛОГ: СОБЫТИЕ ─── */}
      <Dialog open={eventDialog} onOpenChange={setEventDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingEvent ? "Редактировать событие" : "Новое событие"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-zinc-400 text-xs">Название</Label>
              <Input value={eventForm.title} onChange={e => setEventForm(p => ({ ...p, title: e.target.value }))}
                className="bg-zinc-800 border-zinc-700 text-white mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-zinc-400 text-xs">Дата (напр. 12 апр)</Label>
                <Input value={eventForm.event_date} onChange={e => setEventForm(p => ({ ...p, event_date: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700 text-white mt-1" placeholder="12 апр" />
              </div>
              <div>
                <Label className="text-zinc-400 text-xs">День недели</Label>
                <Input value={eventForm.event_day} onChange={e => setEventForm(p => ({ ...p, event_day: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700 text-white mt-1" placeholder="суббота" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-zinc-400 text-xs">Начало</Label>
                <Input value={eventForm.time_start} onChange={e => setEventForm(p => ({ ...p, time_start: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700 text-white mt-1" placeholder="11:00" />
              </div>
              <div>
                <Label className="text-zinc-400 text-xs">Конец</Label>
                <Input value={eventForm.time_end} onChange={e => setEventForm(p => ({ ...p, time_end: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700 text-white mt-1" placeholder="15:00" />
              </div>
            </div>
            <div>
              <Label className="text-zinc-400 text-xs">Место</Label>
              <Input value={eventForm.location} onChange={e => setEventForm(p => ({ ...p, location: e.target.value }))}
                className="bg-zinc-800 border-zinc-700 text-white mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-zinc-400 text-xs">Тип</Label>
                <Select value={eventForm.type} onValueChange={v => setEventForm(p => ({ ...p, type: v as "free" | "paid" }))}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Бесплатное</SelectItem>
                    <SelectItem value="paid">Платное</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-zinc-400 text-xs">Цена (если платное)</Label>
                <Input value={eventForm.price || ""} onChange={e => setEventForm(p => ({ ...p, price: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700 text-white mt-1" placeholder="500 ₽" />
              </div>
            </div>
            <div>
              <Label className="text-zinc-400 text-xs">Мест (∞ = без ограничений)</Label>
              <Input value={eventForm.spots} onChange={e => setEventForm(p => ({ ...p, spots: e.target.value }))}
                className="bg-zinc-800 border-zinc-700 text-white mt-1" placeholder="∞" />
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={saveEvent} disabled={savingEvent}
                className="flex-1 bg-[#004488] hover:bg-[#0055aa] text-white">
                {savingEvent ? <Icon name="Loader2" size={16} className="animate-spin" /> : "Сохранить"}
              </Button>
              <Button variant="outline" onClick={() => setEventDialog(false)} className="border-zinc-700 text-zinc-400">
                Отмена
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── ДИАЛОГ: ИСТОРИЯ ─── */}
      <Dialog open={historyDialog} onOpenChange={setHistoryDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingHistory ? "Редактировать запись истории" : "Новая запись истории"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-zinc-400 text-xs">Год</Label>
                <Input value={historyForm.year} onChange={e => setHistoryForm(p => ({ ...p, year: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700 text-white mt-1" placeholder="2025" />
              </div>
              <div>
                <Label className="text-zinc-400 text-xs">Сторона</Label>
                <Select value={historyForm.side} onValueChange={v => setHistoryForm(p => ({ ...p, side: v as "left" | "right" }))}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Левая</SelectItem>
                    <SelectItem value="right">Правая</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-zinc-400 text-xs">Заголовок</Label>
              <Input value={historyForm.title} onChange={e => setHistoryForm(p => ({ ...p, title: e.target.value }))}
                className="bg-zinc-800 border-zinc-700 text-white mt-1" />
            </div>
            <div>
              <Label className="text-zinc-400 text-xs">Текст</Label>
              <Textarea value={historyForm.text} onChange={e => setHistoryForm(p => ({ ...p, text: e.target.value }))}
                className="bg-zinc-800 border-zinc-700 text-white mt-1 min-h-[100px]" />
            </div>
            <div>
              <Label className="text-zinc-400 text-xs">Иконка (lucide)</Label>
              <Input value={historyForm.icon} onChange={e => setHistoryForm(p => ({ ...p, icon: e.target.value }))}
                className="bg-zinc-800 border-zinc-700 text-white mt-1" placeholder="Star, Trophy, Flag..." />
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={saveHistory} disabled={savingHistory}
                className="flex-1 bg-[#004488] hover:bg-[#0055aa] text-white">
                {savingHistory ? <Icon name="Loader2" size={16} className="animate-spin" /> : "Сохранить"}
              </Button>
              <Button variant="outline" onClick={() => setHistoryDialog(false)} className="border-zinc-700 text-zinc-400">
                Отмена
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
};

export default Gymkhana;
