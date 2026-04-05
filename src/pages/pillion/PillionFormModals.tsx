import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Icon from "@/components/ui/icon";
import { useToast } from "@/hooks/use-toast";
import { API_URL, emptyPilotForm, emptyPassengerForm, formatDate } from "./pillionTypes";

// ─── ФОРМА ПИЛОТА ─────────────────────────────────────────────────────────────

interface PilotFormModalProps {
  open: boolean;
  onClose: () => void;
  token: string;
  initial?: Partial<ReturnType<typeof emptyPilotForm>>;
  onSaved: () => void;
}

export const PilotFormModal: React.FC<PilotFormModalProps> = ({
  open,
  onClose,
  token,
  initial,
  onSaved,
}) => {
  const { toast } = useToast();
  const [form, setForm] = useState(emptyPilotForm());
  const [saving, setSaving] = useState(false);
  const [newDate, setNewDate] = useState("");

  useEffect(() => {
    if (open) {
      setForm(initial ? { ...emptyPilotForm(), ...initial } : emptyPilotForm());
      setNewDate("");
    }
  }, [open, initial]);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const addDate = () => {
    if (!newDate || form.preferred_dates.includes(newDate)) return;
    set("preferred_dates", [...form.preferred_dates, newDate]);
    setNewDate("");
  };

  const removeDate = (d: string) =>
    set("preferred_dates", form.preferred_dates.filter((x) => x !== d));

  const save = async () => {
    if (!form.moto_brand.trim() || !form.moto_model.trim()) {
      toast({ title: "Укажи марку и модель мотоцикла", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const r = await fetch(`${API_URL}?action=pilot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Token": token,
        },
        body: JSON.stringify(form),
      });
      if (r.ok) {
        toast({ title: "Карточка сохранена" });
        onSaved();
        onClose();
      } else {
        const d = await r.json();
        toast({ title: d.error || "Ошибка", variant: "destructive" });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-700 text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-lg font-bold">
            {initial ? "Редактировать карточку пилота" : "Создать карточку пилота"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-gray-400 text-xs mb-1 block">Марка мотоцикла *</Label>
              <Input
                value={form.moto_brand}
                onChange={(e) => set("moto_brand", e.target.value)}
                placeholder="Honda, Yamaha..."
                className="bg-zinc-800 border-zinc-600 text-white placeholder-gray-500"
              />
            </div>
            <div>
              <Label className="text-gray-400 text-xs mb-1 block">Модель *</Label>
              <Input
                value={form.moto_model}
                onChange={(e) => set("moto_model", e.target.value)}
                placeholder="CBR600, MT-07..."
                className="bg-zinc-800 border-zinc-600 text-white placeholder-gray-500"
              />
            </div>
          </div>

          <div>
            <Label className="text-gray-400 text-xs mb-1 block">Стаж вождения (лет)</Label>
            <Input
              type="number"
              min={0}
              max={60}
              value={form.experience_years}
              onChange={(e) => set("experience_years", Number(e.target.value))}
              className="bg-zinc-800 border-zinc-600 text-white w-32"
            />
          </div>

          <div>
            <Label className="text-gray-400 text-xs mb-2 block">Стиль езды</Label>
            <div className="flex gap-2">
              {(["спокойный", "смешанный", "активный"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => set("riding_style", s)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    form.riding_style === s
                      ? s === "спокойный"
                        ? "bg-green-500/20 text-green-400 border-green-500/50"
                        : s === "активный"
                        ? "bg-red-500/20 text-red-400 border-red-500/50"
                        : "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
                      : "bg-zinc-800 text-zinc-400 border-zinc-600 hover:border-zinc-500"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-gray-400 text-xs mb-2 block">Запасная экипировка для двойки</Label>
            <div className="space-y-2">
              {(
                [
                  { key: "has_helmet", label: "Есть запасной шлем" },
                  { key: "has_jacket", label: "Есть запасная куртка" },
                  { key: "has_gloves", label: "Есть запасные перчатки" },
                ] as const
              ).map(({ key, label }) => (
                <div key={key} className="flex items-center gap-2">
                  <Checkbox
                    id={`pilot-${key}`}
                    checked={form[key]}
                    onCheckedChange={(v) => set(key, !!v)}
                    className="border-zinc-500"
                  />
                  <label htmlFor={`pilot-${key}`} className="text-gray-300 text-sm cursor-pointer">
                    {label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-gray-400 text-xs mb-1 block">О себе</Label>
            <Textarea
              value={form.about}
              onChange={(e) => set("about", e.target.value)}
              placeholder="Расскажи о себе и своих поездках..."
              className="bg-zinc-800 border-zinc-600 text-white placeholder-gray-500 resize-none"
              rows={3}
            />
          </div>

          <div>
            <Label className="text-gray-400 text-xs mb-1 block">
              Контакт (Telegram или телефон)
            </Label>
            <Input
              value={form.contact}
              onChange={(e) => set("contact", e.target.value)}
              placeholder="@username или +7..."
              className="bg-zinc-800 border-zinc-600 text-white placeholder-gray-500"
            />
          </div>

          <div>
            <Label className="text-gray-400 text-xs mb-2 block">Ближайшие даты</Label>
            <div className="flex gap-2 mb-2">
              <Input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="bg-zinc-800 border-zinc-600 text-white flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addDate}
                className="border-zinc-600 text-gray-300 hover:text-white"
              >
                <Icon name="Plus" size={16} />
              </Button>
            </div>
            {form.preferred_dates.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.preferred_dates.map((d) => (
                  <span
                    key={d}
                    className="flex items-center gap-1 text-xs bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded px-2 py-1"
                  >
                    {formatDate(d)}
                    <button
                      type="button"
                      onClick={() => removeDate(d)}
                      className="hover:text-red-400 ml-1"
                    >
                      <Icon name="X" size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="pilot-is_active"
              checked={form.is_active}
              onCheckedChange={(v) => set("is_active", !!v)}
              className="border-zinc-500"
            />
            <label htmlFor="pilot-is_active" className="text-gray-300 text-sm cursor-pointer">
              Показывать карточку в списке
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 border-zinc-600 text-gray-300"
              onClick={onClose}
              disabled={saving}
            >
              Отмена
            </Button>
            <Button
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
              onClick={save}
              disabled={saving}
            >
              {saving ? <Icon name="Loader2" size={16} className="animate-spin mr-2" /> : null}
              Сохранить
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ─── ФОРМА ПАССАЖИРА ──────────────────────────────────────────────────────────

interface PassengerFormModalProps {
  open: boolean;
  onClose: () => void;
  token: string;
  initial?: Partial<ReturnType<typeof emptyPassengerForm>>;
  onSaved: () => void;
}

export const PassengerFormModal: React.FC<PassengerFormModalProps> = ({
  open,
  onClose,
  token,
  initial,
  onSaved,
}) => {
  const { toast } = useToast();
  const [form, setForm] = useState(emptyPassengerForm());
  const [saving, setSaving] = useState(false);
  const [newDate, setNewDate] = useState("");

  useEffect(() => {
    if (open) {
      setForm(initial ? { ...emptyPassengerForm(), ...initial } : emptyPassengerForm());
      setNewDate("");
    }
  }, [open, initial]);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const addDate = () => {
    if (!newDate || form.preferred_dates.includes(newDate)) return;
    set("preferred_dates", [...form.preferred_dates, newDate]);
    setNewDate("");
  };

  const removeDate = (d: string) =>
    set("preferred_dates", form.preferred_dates.filter((x) => x !== d));

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch(`${API_URL}?action=passenger`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Token": token,
        },
        body: JSON.stringify(form),
      });
      if (r.ok) {
        toast({ title: "Карточка сохранена" });
        onSaved();
        onClose();
      } else {
        const d = await r.json();
        toast({ title: d.error || "Ошибка", variant: "destructive" });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-700 text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-lg font-bold">
            {initial ? "Редактировать карточку пассажира" : "Создать карточку пассажира"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-gray-400 text-xs mb-1 block">
              Опыт как двойка (лет)
            </Label>
            <Input
              type="number"
              min={0}
              max={50}
              value={form.experience_years}
              onChange={(e) => set("experience_years", Number(e.target.value))}
              className="bg-zinc-800 border-zinc-600 text-white w-32"
            />
          </div>

          <div>
            <Label className="text-gray-400 text-xs mb-2 block">Своя экипировка</Label>
            <div className="space-y-2">
              {(
                [
                  { key: "has_helmet", label: "Есть свой шлем" },
                  { key: "has_jacket", label: "Есть своя куртка" },
                  { key: "has_gloves", label: "Есть свои перчатки" },
                ] as const
              ).map(({ key, label }) => (
                <div key={key} className="flex items-center gap-2">
                  <Checkbox
                    id={`pass-${key}`}
                    checked={form[key]}
                    onCheckedChange={(v) => set(key, !!v)}
                    className="border-zinc-500"
                  />
                  <label
                    htmlFor={`pass-${key}`}
                    className="text-gray-300 text-sm cursor-pointer"
                  >
                    {label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-gray-400 text-xs mb-1 block">О себе</Label>
            <Textarea
              value={form.about}
              onChange={(e) => set("about", e.target.value)}
              placeholder="Расскажи о себе..."
              className="bg-zinc-800 border-zinc-600 text-white placeholder-gray-500 resize-none"
              rows={3}
            />
          </div>

          <div>
            <Label className="text-gray-400 text-xs mb-1 block">
              Контакт (Telegram или телефон)
            </Label>
            <Input
              value={form.contact}
              onChange={(e) => set("contact", e.target.value)}
              placeholder="@username или +7..."
              className="bg-zinc-800 border-zinc-600 text-white placeholder-gray-500"
            />
          </div>

          <div>
            <Label className="text-gray-400 text-xs mb-2 block">Ближайшие даты</Label>
            <div className="flex gap-2 mb-2">
              <Input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="bg-zinc-800 border-zinc-600 text-white flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addDate}
                className="border-zinc-600 text-gray-300 hover:text-white"
              >
                <Icon name="Plus" size={16} />
              </Button>
            </div>
            {form.preferred_dates.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.preferred_dates.map((d) => (
                  <span
                    key={d}
                    className="flex items-center gap-1 text-xs bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded px-2 py-1"
                  >
                    {formatDate(d)}
                    <button
                      type="button"
                      onClick={() => removeDate(d)}
                      className="hover:text-red-400 ml-1"
                    >
                      <Icon name="X" size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="pass-is_active"
              checked={form.is_active}
              onCheckedChange={(v) => set("is_active", !!v)}
              className="border-zinc-500"
            />
            <label
              htmlFor="pass-is_active"
              className="text-gray-300 text-sm cursor-pointer"
            >
              Показывать карточку в списке
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 border-zinc-600 text-gray-300"
              onClick={onClose}
              disabled={saving}
            >
              Отмена
            </Button>
            <Button
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
              onClick={save}
              disabled={saving}
            >
              {saving ? (
                <Icon name="Loader2" size={16} className="animate-spin mr-2" />
              ) : null}
              Сохранить
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
