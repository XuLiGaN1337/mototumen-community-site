import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';

const STORAGE_KEY = 'user_settings';

interface UserSettingsData {
  notifications: {
    friendRequests: boolean;
    newEvents: boolean;
    announcements: boolean;
    systemMessages: boolean;
  };
  sound: {
    enabled: boolean;
    volume: number;
    soundType: 'default' | 'soft' | 'bell';
  };
}

const defaultSettings: UserSettingsData = {
  notifications: {
    friendRequests: true,
    newEvents: true,
    announcements: false,
    systemMessages: true,
  },
  sound: {
    enabled: true,
    volume: 70,
    soundType: 'default',
  },
};

const SOUND_TYPES = [
  { id: 'default' as const, label: 'Стандартный', emoji: '🔔' },
  { id: 'soft' as const, label: 'Мягкий', emoji: '🎵' },
  { id: 'bell' as const, label: 'Тихий', emoji: '🔕' },
];

const Toggle: React.FC<{
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}> = ({ checked, onChange, label, description }) => (
  <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
    <div>
      <p className="text-sm font-medium text-white">{label}</p>
      {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
    </div>
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-[#ff6b35]' : 'bg-gray-700'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  </div>
);

type Tab = 'account' | 'notifications' | 'sound';

const UserSettings: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('account');
  const [saved, setSaved] = useState(false);

  const [settings, setSettings] = useState<UserSettingsData>(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      return s ? { ...defaultSettings, ...JSON.parse(s) } : defaultSettings;
    } catch { return defaultSettings; }
  });

  if (!isAuthenticated) {
    navigate('/');
    return null;
  }

  const updateNotification = (key: keyof UserSettingsData['notifications'], value: boolean) => {
    setSettings(prev => ({ ...prev, notifications: { ...prev.notifications, [key]: value } }));
    setSaved(false);
  };

  const updateSound = (key: keyof UserSettingsData['sound'], value: boolean | number | string) => {
    setSettings(prev => ({ ...prev, sound: { ...prev.sound, [key]: value } }));
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'account', label: 'Аккаунт', icon: 'User' },
    { id: 'notifications', label: 'Уведомления', icon: 'Bell' },
    { id: 'sound', label: 'Звук', icon: 'Volume2' },
  ];

  return (
    <div className="min-h-screen bg-[#1e2332]">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-gray-400 hover:text-white px-2">
            <Icon name="ArrowLeft" className="h-4 w-4 mr-1" />
            Назад
          </Button>
        </div>

        <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Icon name="Settings" className="h-6 w-6 text-[#ff6b35]" />
          Настройки
        </h1>

        {/* Табы */}
        <div className="flex gap-1 bg-[#252836] rounded-xl p-1 mb-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-[#ff6b35] text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Icon name={tab.icon as 'User'} className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Аккаунт */}
        {activeTab === 'account' && (
          <div className="bg-[#252836] rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-white/5">
              <div className="w-14 h-14 rounded-full bg-[#ff6b35]/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[#ff6b35] font-bold text-xl">{user?.name?.charAt(0)}</span>
                )}
              </div>
              <div>
                <p className="text-white font-semibold">{user?.name}</p>
                <p className="text-gray-400 text-sm">{user?.email}</p>
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Icon name="Hash" className="h-4 w-4" />
                <span>ID: #{user?.id}</span>
              </div>
              {user?.role && (
                <div className="flex items-center gap-2">
                  <Icon name="Shield" className="h-4 w-4" />
                  <span>Роль: {user.role}</span>
                </div>
              )}
            </div>

            <Button
              onClick={() => navigate('/profile')}
              variant="outline"
              className="w-full border-white/10 text-gray-300 hover:text-white mt-2"
            >
              <Icon name="Edit" className="h-4 w-4 mr-2" />
              Редактировать профиль
            </Button>
          </div>
        )}

        {/* Уведомления */}
        {activeTab === 'notifications' && (
          <div className="bg-[#252836] rounded-xl p-5">
            <p className="text-xs text-gray-500 mb-4">Выберите о чём получать уведомления</p>
            <Toggle
              checked={settings.notifications.friendRequests}
              onChange={v => updateNotification('friendRequests', v)}
              label="Заявки в друзья"
              description="Когда кто-то добавляет вас в друзья"
            />
            <Toggle
              checked={settings.notifications.newEvents}
              onChange={v => updateNotification('newEvents', v)}
              label="Новые события"
              description="Анонсы мероприятий сообщества"
            />
            <Toggle
              checked={settings.notifications.announcements}
              onChange={v => updateNotification('announcements', v)}
              label="Объявления"
              description="Новые объявления в сообществе"
            />
            <Toggle
              checked={settings.notifications.systemMessages}
              onChange={v => updateNotification('systemMessages', v)}
              label="Системные сообщения"
              description="Обновления и важная информация"
            />
          </div>
        )}

        {/* Звук */}
        {activeTab === 'sound' && (
          <div className="bg-[#252836] rounded-xl p-5 space-y-5">
            <Toggle
              checked={settings.sound.enabled}
              onChange={v => updateSound('enabled', v)}
              label="Звук уведомлений"
            />

            {settings.sound.enabled && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-white">Громкость</label>
                    <span className="text-sm text-gray-400">{settings.sound.volume}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={settings.sound.volume}
                    onChange={e => updateSound('volume', Number(e.target.value))}
                    className="w-full accent-[#ff6b35]"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-white mb-3 block">Тип звука</label>
                  <div className="flex gap-2">
                    {SOUND_TYPES.map(s => (
                      <button
                        key={s.id}
                        onClick={() => updateSound('soundType', s.id)}
                        className={`flex-1 py-2.5 px-3 rounded-lg border text-sm transition-all ${
                          settings.sound.soundType === s.id
                            ? 'border-[#ff6b35] bg-[#ff6b35]/10 text-[#ff6b35]'
                            : 'border-white/10 text-gray-400 hover:border-white/20'
                        }`}
                      >
                        {s.emoji} {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab !== 'account' && (
          <Button onClick={handleSave} className="w-full mt-4 bg-[#ff6b35] hover:bg-[#ff6b35]/90">
            {saved
              ? <><Icon name="Check" className="h-4 w-4 mr-2" />Сохранено</>
              : <><Icon name="Save" className="h-4 w-4 mr-2" />Сохранить</>
            }
          </Button>
        )}
      </div>
    </div>
  );
};

export default UserSettings;
