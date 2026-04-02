import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'admin_notification_settings';

interface NotificationSettings {
  newUser: boolean;
  passwordReset: boolean;
  orgRequest: boolean;
  moderation: boolean;
  soundEnabled: boolean;
  soundVolume: number;
  soundType: 'default' | 'soft' | 'bell';
}

const defaultSettings: NotificationSettings = {
  newUser: true,
  passwordReset: true,
  orgRequest: true,
  moderation: true,
  soundEnabled: true,
  soundVolume: 70,
  soundType: 'default',
};

const SOUND_TYPES = [
  { id: 'default', label: 'Стандартный', emoji: '🔔' },
  { id: 'soft', label: 'Мягкий', emoji: '🎵' },
  { id: 'bell', label: 'Колокол', emoji: '🔕' },
] as const;

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }> = ({ checked, onChange, label, description }) => (
  <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
    <div>
      <p className="text-sm font-medium">{label}</p>
      {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
    </div>
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-primary' : 'bg-muted'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  </div>
);

export const AdminNotificationSettings: React.FC = () => {
  const [settings, setSettings] = useState<NotificationSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    } catch { return defaultSettings; }
  });
  const [saved, setSaved] = useState(false);

  const update = (key: keyof NotificationSettings, value: boolean | number | string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-lg">
      <div className="bg-card border border-border rounded-lg p-5">
        <h3 className="font-semibold mb-1 flex items-center gap-2">
          <Icon name="Bell" className="w-4 h-4" />
          Уведомления
        </h3>
        <p className="text-xs text-muted-foreground mb-4">Выберите о чём получать уведомления</p>
        <Toggle checked={settings.newUser} onChange={v => update('newUser', v)} label="Новый пользователь" description="Когда кто-то регистрируется" />
        <Toggle checked={settings.passwordReset} onChange={v => update('passwordReset', v)} label="Запрос сброса пароля" description="Когда администратор запрашивает сброс" />
        <Toggle checked={settings.orgRequest} onChange={v => update('orgRequest', v)} label="Заявки организаций" description="Новые заявки на статус организации" />
        <Toggle checked={settings.moderation} onChange={v => update('moderation', v)} label="Модерация" description="Контент требует проверки" />
      </div>

      <div className="bg-card border border-border rounded-lg p-5">
        <h3 className="font-semibold mb-1 flex items-center gap-2">
          <Icon name="Volume2" className="w-4 h-4" />
          Звук
        </h3>
        <p className="text-xs text-muted-foreground mb-4">Настройки звука уведомлений</p>
        <Toggle checked={settings.soundEnabled} onChange={v => update('soundEnabled', v)} label="Звук уведомлений" />

        {settings.soundEnabled && (
          <div className="mt-4 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Громкость</label>
                <span className="text-sm text-muted-foreground">{settings.soundVolume}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={settings.soundVolume}
                onChange={e => update('soundVolume', Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Тип звука</label>
              <div className="flex gap-2">
                {SOUND_TYPES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => update('soundType', s.id)}
                    className={`flex-1 py-2 px-3 rounded-lg border text-sm transition-all ${settings.soundType === s.id ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-accent'}`}
                  >
                    {s.emoji} {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <Button onClick={handleSave} className="w-full">
        {saved ? <><Icon name="Check" className="w-4 h-4 mr-2" />Сохранено</> : <><Icon name="Save" className="w-4 h-4 mr-2" />Сохранить настройки</>}
      </Button>
    </div>
  );
};
