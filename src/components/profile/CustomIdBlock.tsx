import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import Icon from "@/components/ui/icon";

const AUTH_API = "https://functions.poehali.dev/55efb6f4-b3ab-4ac3-8b19-da9b21b5490e";

interface Props {
  currentCustomId: string | null;
  numericId: number;
  token: string;
  onSaved: (customId: string) => void;
}

const ALLOWED_RE = /^[a-zA-Z0-9_]*$/;

const CustomIdBlock: React.FC<Props> = ({ currentCustomId, numericId, token, onSaved }) => {
  const { toast } = useToast();
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);

  const handleChange = (v: string) => {
    if (!ALLOWED_RE.test(v)) return; // только en + цифры + _
    setValue(v.toLowerCase());
    setAvailable(null);
  };

  const handleCheck = async () => {
    if (value.length < 3) {
      toast({ title: "Минимум 3 символа", variant: "destructive" });
      return;
    }
    setChecking(true);
    try {
      const res = await fetch(`${AUTH_API}?action=public-profile&id=${value}`);
      setAvailable(res.status === 404);
    } catch {
      setAvailable(null);
    } finally {
      setChecking(false);
    }
  };

  const handleSave = async () => {
    if (!value || value.length < 3) return;
    setSaving(true);
    try {
      const res = await fetch(`${AUTH_API}?action=set-custom-id`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-Auth-Token": token },
        body: JSON.stringify({ custom_id: value }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: `ID @${value} установлен!` });
        onSaved(value);
      } else {
        toast({ title: data.error || "Ошибка", variant: "destructive" });
      }
    } catch {
      toast({ title: "Ошибка сохранения", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (currentCustomId) {
    return (
      <div className="bg-[#1e2332] rounded-lg p-3">
        <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
          <Icon name="AtSign" className="h-3 w-3" />
          <span>Мой ID</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white font-mono font-medium">@{currentCustomId}</span>
          <span className="text-xs text-zinc-500">· /u/{currentCustomId}</span>
        </div>
        <p className="text-xs text-zinc-600 mt-1">Изменить нельзя</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1e2332] rounded-lg p-3">
      <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
        <Icon name="AtSign" className="h-3 w-3" />
        <span>Мой ID</span>
        <span className="ml-auto text-amber-400 text-[10px] font-medium">1 раз бесплатно</span>
      </div>
      <p className="text-xs text-zinc-400 mb-2">
        Сейчас ваш ID: <span className="text-white font-mono">#{numericId}</span>. Замените на красивый — только латиница, цифры и _
      </p>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">@</span>
          <Input
            value={value}
            onChange={e => handleChange(e.target.value)}
            placeholder="my_id"
            maxLength={32}
            className="pl-7 bg-zinc-800 border-zinc-600 text-white text-sm h-8 font-mono"
          />
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-8 px-2 border-zinc-600 text-xs"
          onClick={handleCheck}
          disabled={checking || value.length < 3}
        >
          {checking
            ? <Icon name="Loader2" size={12} className="animate-spin" />
            : "Проверить"
          }
        </Button>
      </div>

      {/* Статус проверки */}
      {available === true && (
        <div className="flex items-center gap-1.5 mt-2">
          <Icon name="CheckCircle" size={13} className="text-green-400" />
          <span className="text-xs text-green-400">@{value} свободен</span>
          <Button
            size="sm"
            className="h-6 px-2 ml-auto bg-accent hover:bg-accent/90 text-xs"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <Icon name="Loader2" size={12} className="animate-spin" /> : "Сохранить"}
          </Button>
        </div>
      )}
      {available === false && (
        <div className="flex items-center gap-1.5 mt-2">
          <Icon name="XCircle" size={13} className="text-red-400" />
          <span className="text-xs text-red-400">@{value} уже занят</span>
        </div>
      )}
    </div>
  );
};

export default CustomIdBlock;
