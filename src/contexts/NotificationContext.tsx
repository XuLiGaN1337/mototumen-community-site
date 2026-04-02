import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';

// ─── Типы ────────────────────────────────────────────────────────────────────

export type SoundType = 'default' | 'soft' | 'bell';
export type NotifyType = 'friend' | 'event' | 'announcement' | 'system' | 'admin';

export interface AppSettings {
  notifications: {
    friendRequests: boolean;
    newEvents: boolean;
    announcements: boolean;
    systemMessages: boolean;
    adminAlerts: boolean;   // только для админов
  };
  sound: {
    enabled: boolean;
    volume: number;         // 0-100
    soundType: SoundType;
  };
}

export interface AppNotification {
  id: string;
  type: NotifyType;
  title: string;
  message?: string;
  at: number;
}

interface NotificationContextType {
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  saveSettings: () => void;
  notifications: AppNotification[];
  notify: (type: NotifyType, title: string, message?: string) => void;
  dismissAll: () => void;
}

// ─── Дефолты ─────────────────────────────────────────────────────────────────

export const defaultSettings: AppSettings = {
  notifications: {
    friendRequests: true,
    newEvents: true,
    announcements: false,
    systemMessages: true,
    adminAlerts: true,
  },
  sound: {
    enabled: true,
    volume: 70,
    soundType: 'default',
  },
};

const STORAGE_KEY = 'app_settings_v2';

// ─── Звук через Web Audio API ────────────────────────────────────────────────

function playSound(type: SoundType, volume: number) {
  try {
    const AudioCtx = (window.AudioContext || (window as unknown as {webkitAudioContext: typeof AudioContext}).webkitAudioContext);
    const ctx = new AudioCtx();
    const gain = ctx.createGain();
    gain.gain.value = volume / 100;
    gain.connect(ctx.destination);

    const osc = ctx.createOscillator();
    osc.connect(gain);

    if (type === 'default') {
      // Двойной бип
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(660, ctx.currentTime + 0.1);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.value = 880;
      osc2.connect(gain);
      osc2.start(ctx.currentTime + 0.25);
      osc2.stop(ctx.currentTime + 0.4);
    } else if (type === 'soft') {
      // Мягкий одиночный тон
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } else {
      // Bell — затухающий колокол
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1047, ctx.currentTime);
      gain.gain.setValueAtTime(volume / 100, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.8);
    }

    setTimeout(() => ctx.close(), 1000);
  } catch {
    // Web Audio не поддерживается
  }
}

// ─── Контекст ─────────────────────────────────────────────────────────────────

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
};

// ─── Provider ────────────────────────────────────────────────────────────────

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) return { ...defaultSettings, ...JSON.parse(s) };
    } catch (e) { console.warn('settings parse error', e); }
    return defaultSettings;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings(prev => ({
      ...prev,
      ...patch,
      notifications: { ...prev.notifications, ...(patch.notifications || {}) },
      sound: { ...prev.sound, ...(patch.sound || {}) },
    }));
  }, []);

  const saveSettings = useCallback(() => {
    setSettings(prev => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prev));
      return prev;
    });
  }, []);

  const notify = useCallback((type: NotifyType, title: string, message?: string) => {
    // Проверяем настройки уведомлений
    const n = settings.notifications;
    const allowed =
      (type === 'friend' && n.friendRequests) ||
      (type === 'event' && n.newEvents) ||
      (type === 'announcement' && n.announcements) ||
      (type === 'system' && n.systemMessages) ||
      (type === 'admin' && n.adminAlerts);

    if (!allowed) return;

    // Звук
    if (settings.sound.enabled) {
      playSound(settings.sound.soundType, settings.sound.volume);
    }

    // Push-уведомление браузера (если разрешено)
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body: message, icon: '/favicon.ico' });
    }

    // In-app уведомление
    const id = `${Date.now()}-${Math.random()}`;
    setNotifications(prev => [{ id, type, title, message, at: Date.now() }, ...prev.slice(0, 19)]);

    // Авто-скрыть через 5 сек
    const t = setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
    timerRef.current.push(t);
  }, [settings]);

  const dismissAll = useCallback(() => {
    timerRef.current.forEach(clearTimeout);
    timerRef.current = [];
    setNotifications([]);
  }, []);

  // Запрашиваем разрешение на push при первой загрузке
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <NotificationContext.Provider value={{ settings, updateSettings, saveSettings, notifications, notify, dismissAll }}>
      {children}
      <NotificationToasts notifications={notifications} onDismiss={id => setNotifications(prev => prev.filter(n => n.id !== id))} />
    </NotificationContext.Provider>
  );
};

// ─── Toast компонент ──────────────────────────────────────────────────────────

const TYPE_ICONS: Record<NotifyType, string> = {
  friend: '👤',
  event: '🏍',
  announcement: '📢',
  system: '⚙️',
  admin: '🛡️',
};

const NotificationToasts: React.FC<{
  notifications: AppNotification[];
  onDismiss: (id: string) => void;
}> = ({ notifications, onDismiss }) => {
  if (!notifications.length) return null;
  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {notifications.slice(0, 5).map(n => (
        <div
          key={n.id}
          className="bg-[#252836] border border-white/10 rounded-xl px-4 py-3 shadow-2xl flex items-start gap-3 pointer-events-auto animate-in slide-in-from-right duration-300"
        >
          <span className="text-xl flex-shrink-0 mt-0.5">{TYPE_ICONS[n.type]}</span>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{n.title}</p>
            {n.message && <p className="text-gray-400 text-xs mt-0.5 line-clamp-2">{n.message}</p>}
          </div>
          <button onClick={() => onDismiss(n.id)} className="text-gray-500 hover:text-white flex-shrink-0 mt-0.5">
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};