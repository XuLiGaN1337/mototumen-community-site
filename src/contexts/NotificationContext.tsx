import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';

// ─── Типы ────────────────────────────────────────────────────────────────────

export type SoundType = 'default' | 'soft' | 'bell';

export type NotifyType =
  | 'friend'        // Профиль: заявки в друзья
  | 'achievement'   // Профиль: новое достижение
  | 'badge'         // Профиль: новый значок
  | 'event'         // События: анонсы мероприятий
  | 'gymkhana'      // События: гимхана
  | 'announcement'  // Объявления: новые объявления
  | 'pillion'       // Объявления: ищу пилота/двойку
  | 'store'         // Магазин: новый товар ZM Store
  | 'system'        // Система: обновления, важная инфа
  | 'admin';        // Система: только для админов

export interface AppSettings {
  notifications: {
    // Профиль
    friendRequests: boolean;
    achievements: boolean;
    badges: boolean;
    // События
    newEvents: boolean;
    gymkhana: boolean;
    // Объявления
    announcements: boolean;
    pillion: boolean;
    // Магазин
    storeUpdates: boolean;
    // Система
    systemMessages: boolean;
    adminAlerts: boolean;
  };
  push: {
    enabled: boolean;        // браузерные push-уведомления
  };
  sound: {
    enabled: boolean;
    volume: number;          // 0-100
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
  pushPermission: NotificationPermission | null;
  requestPush: () => Promise<void>;
}

// ─── Дефолты ─────────────────────────────────────────────────────────────────

export const defaultSettings: AppSettings = {
  notifications: {
    friendRequests: true,
    achievements: true,
    badges: true,
    newEvents: true,
    gymkhana: true,
    announcements: false,
    pillion: false,
    storeUpdates: false,
    systemMessages: true,
    adminAlerts: true,
  },
  push: {
    enabled: false,
  },
  sound: {
    enabled: true,
    volume: 70,
    soundType: 'default',
  },
};

const STORAGE_KEY = 'app_settings_v3';

// ─── Звук через Web Audio API ────────────────────────────────────────────────

function playSound(type: SoundType, volume: number) {
  try {
    const AudioCtx = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    const ctx = new AudioCtx();
    const gain = ctx.createGain();
    gain.gain.value = volume / 100;
    gain.connect(ctx.destination);

    const osc = ctx.createOscillator();
    osc.connect(gain);

    if (type === 'default') {
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
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } else {
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

// ─── Маппинг тип → ключ настройки ────────────────────────────────────────────

function isAllowed(type: NotifyType, n: AppSettings['notifications']): boolean {
  switch (type) {
    case 'friend':       return n.friendRequests;
    case 'achievement':  return n.achievements;
    case 'badge':        return n.badges;
    case 'event':        return n.newEvents;
    case 'gymkhana':     return n.gymkhana;
    case 'announcement': return n.announcements;
    case 'pillion':      return n.pillion;
    case 'store':        return n.storeUpdates;
    case 'system':       return n.systemMessages;
    case 'admin':        return n.adminAlerts;
    default:             return true;
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
      if (s) {
        const parsed = JSON.parse(s);
        return {
          ...defaultSettings,
          ...parsed,
          notifications: { ...defaultSettings.notifications, ...(parsed.notifications || {}) },
          push: { ...defaultSettings.push, ...(parsed.push || {}) },
          sound: { ...defaultSettings.sound, ...(parsed.sound || {}) },
        };
      }
    } catch (e) { console.warn('settings parse error', e); }
    return defaultSettings;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | null>(
    'Notification' in window ? Notification.permission : null
  );
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings(prev => ({
      ...prev,
      ...patch,
      notifications: { ...prev.notifications, ...(patch.notifications || {}) },
      push: { ...prev.push, ...(patch.push || {}) },
      sound: { ...prev.sound, ...(patch.sound || {}) },
    }));
  }, []);

  const saveSettings = useCallback(() => {
    setSettings(prev => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prev));
      return prev;
    });
  }, []);

  const requestPush = useCallback(async () => {
    if (!('Notification' in window)) return;
    const result = await Notification.requestPermission();
    setPushPermission(result);
    if (result === 'granted') {
      updateSettings({ push: { enabled: true } });
    }
  }, [updateSettings]);

  const notify = useCallback((type: NotifyType, title: string, message?: string) => {
    if (!isAllowed(type, settings.notifications)) return;

    if (settings.sound.enabled) {
      playSound(settings.sound.soundType, settings.sound.volume);
    }

    if (settings.push.enabled && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body: message, icon: '/favicon.ico' });
    }

    const id = `${Date.now()}-${Math.random()}`;
    setNotifications(prev => [{ id, type, title, message, at: Date.now() }, ...prev.slice(0, 19)]);

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

  // Следим за разрешением push
  useEffect(() => {
    if (!('Notification' in window)) return;
    setPushPermission(Notification.permission);
  }, []);

  return (
    <NotificationContext.Provider value={{ settings, updateSettings, saveSettings, notifications, notify, dismissAll, pushPermission, requestPush }}>
      {children}
      <NotificationToasts notifications={notifications} onDismiss={id => setNotifications(prev => prev.filter(n => n.id !== id))} />
    </NotificationContext.Provider>
  );
};

// ─── Toast компонент ──────────────────────────────────────────────────────────

const TYPE_ICONS: Record<NotifyType, string> = {
  friend:       '👤',
  achievement:  '🏆',
  badge:        '🎖️',
  event:        '🏍',
  gymkhana:     '🏁',
  announcement: '📢',
  pillion:      '🛵',
  store:        '🛒',
  system:       '⚙️',
  admin:        '🛡️',
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
