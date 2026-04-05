import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification, SoundType, AppSettings } from '@/contexts/NotificationContext';
import { AdminPasswordSettings } from '@/components/admin/AdminPasswordSettings';

const SOUND_TYPES: { id: SoundType; label: string; emoji: string }[] = [
  { id: 'default', label: 'Стандартный', emoji: '🔔' },
  { id: 'soft',    label: 'Мягкий',      emoji: '🎵' },
  { id: 'bell',    label: 'Тихий',       emoji: '🔕' },
];

const Toggle: React.FC<{
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
  icon?: string;
}> = ({ checked, onChange, label, description, icon }) => (
  <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
    <div className="flex items-center gap-2.5 flex-1 min-w-0 mr-3">
      {icon && <span className="text-base flex-shrink-0">{icon}</span>}
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
    </div>
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-[#ff6b35]' : 'bg-gray-700'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  </div>
);

const SectionHeader: React.FC<{ emoji: string; title: string; subtitle?: string }> = ({ emoji, title, subtitle }) => (
  <div className="flex items-center gap-2.5 mb-3">
    <span className="text-lg">{emoji}</span>
    <div>
      <p className="text-sm font-semibold text-white">{title}</p>
      {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
    </div>
  </div>
);

type Tab = 'account' | 'notifications' | 'admin';

const UserSettings: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin } = useAuth();
  const { settings, updateSettings, saveSettings, notify, pushPermission, requestPush } = useNotification();
  const [activeTab, setActiveTab] = useState<Tab>('account');
  const [saved, setSaved] = useState(false);

  if (!isAuthenticated) {
    navigate('/');
    return null;
  }

  const handleSave = () => {
    saveSettings();
    setSaved(true);
    notify('system', 'Настройки сохранены');
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTestSound = () => {
    notify('system', 'Тестовый звук', 'Так звучат уведомления');
  };

  const patchNotif = (key: keyof AppSettings['notifications'], val: boolean) =>
    updateSettings({ notifications: { ...settings.notifications, [key]: val } });

  const patchSound = (key: keyof AppSettings['sound'], val: boolean | number | SoundType) =>
    updateSettings({ sound: { ...settings.sound, [key]: val } });

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'account',       label: 'Аккаунт',      icon: 'User' },
    { id: 'notifications', label: 'Уведомления',  icon: 'Bell' },
    ...(isAdmin ? [{ id: 'admin' as Tab, label: 'Пароль', icon: 'Lock' }] : []),
  ];

  const pushBlocked = pushPermission === 'denied';
  const pushGranted = pushPermission === 'granted';

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
                activeTab === tab.id ? 'bg-[#ff6b35] text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Icon name={tab.icon as 'User'} className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ── Аккаунт ────────────────────────────────────── */}
        {activeTab === 'account' && (
          <div className="bg-[#252836] rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-white/5">
              <div className="w-14 h-14 rounded-full bg-[#ff6b35]/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                {user?.avatar_url
                  ? <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                  : <span className="text-[#ff6b35] font-bold text-xl">{user?.name?.charAt(0)}</span>
                }
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
            <Button onClick={() => navigate('/profile')} variant="outline" className="w-full border-white/10 text-gray-300 hover:text-white">
              <Icon name="Edit" className="h-4 w-4 mr-2" />
              Редактировать профиль
            </Button>
          </div>
        )}

        {/* ── Уведомления + Звук ──────────────────────────── */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">

            {/* Push-уведомления */}
            <div className="bg-[#252836] rounded-xl p-5">
              <SectionHeader emoji="🔔" title="Push-уведомления" subtitle="Уведомления браузера даже когда вкладка закрыта" />
              {pushBlocked ? (
                <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm">
                  <Icon name="AlertTriangle" className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-400 font-medium">Заблокировано браузером</p>
                    <p className="text-gray-500 text-xs mt-1">Разрешите уведомления вручную в настройках браузера (иконка замка в адресной строке)</p>
                  </div>
                </div>
              ) : pushGranted ? (
                <Toggle
                  checked={settings.push.enabled}
                  onChange={v => updateSettings({ push: { enabled: v } })}
                  label="Включить push-уведомления"
                  description="Браузер будет показывать уведомления"
                  icon="🌐"
                />
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500">Разрешите браузеру отправлять уведомления</p>
                  <Button onClick={requestPush} variant="outline" className="w-full border-[#ff6b35]/40 text-[#ff6b35] hover:bg-[#ff6b35]/10 text-sm">
                    <Icon name="Bell" className="h-4 w-4 mr-2" />
                    Разрешить push-уведомления
                  </Button>
                </div>
              )}
            </div>

            {/* Профиль */}
            <div className="bg-[#252836] rounded-xl p-5">
              <SectionHeader emoji="👤" title="Профиль" subtitle="Активность связанная с вашим аккаунтом" />
              <Toggle checked={settings.notifications.friendRequests} onChange={v => patchNotif('friendRequests', v)} label="Заявки в друзья" description="Когда кто-то хочет добавить вас" icon="🤝" />
              <Toggle checked={settings.notifications.achievements}   onChange={v => patchNotif('achievements', v)}   label="Достижения"        description="Когда вы получаете новое достижение" icon="🏆" />
              <Toggle checked={settings.notifications.badges}         onChange={v => patchNotif('badges', v)}         label="Значки"            description="Когда администратор выдаёт вам значок" icon="🎖️" />
            </div>

            {/* События */}
            <div className="bg-[#252836] rounded-xl p-5">
              <SectionHeader emoji="🏍" title="События" subtitle="Мероприятия и активности сообщества" />
              <Toggle checked={settings.notifications.newEvents} onChange={v => patchNotif('newEvents', v)} label="Новые события"  description="Анонсы мероприятий платформы" icon="📅" />
              <Toggle checked={settings.notifications.gymkhana}  onChange={v => patchNotif('gymkhana', v)}  label="Гимхана"        description="Соревнования и результаты" icon="🏁" />
            </div>

            {/* Объявления */}
            <div className="bg-[#252836] rounded-xl p-5">
              <SectionHeader emoji="📢" title="Объявления" subtitle="Мото-авито и поиск попутчиков" />
              <Toggle checked={settings.notifications.announcements} onChange={v => patchNotif('announcements', v)} label="Объявления"          description="Новые объявления в мото-авито" icon="📋" />
              <Toggle checked={settings.notifications.pillion}       onChange={v => patchNotif('pillion', v)}       label="Ищу пилота / двойку" description="Новые карточки поиска попутчиков" icon="🛵" />
            </div>

            {/* Магазин */}
            <div className="bg-[#252836] rounded-xl p-5">
              <SectionHeader emoji="🛒" title="ZM Store" subtitle="Уведомления о магазине" />
              <Toggle checked={settings.notifications.storeUpdates} onChange={v => patchNotif('storeUpdates', v)} label="Новые товары" description="Когда появляются новые товары в магазине" icon="📦" />
            </div>

            {/* Система */}
            <div className="bg-[#252836] rounded-xl p-5">
              <SectionHeader emoji="⚙️" title="Система" subtitle="Служебные уведомления платформы" />
              <Toggle checked={settings.notifications.systemMessages} onChange={v => patchNotif('systemMessages', v)} label="Системные" description="Обновления платформы и важная информация" icon="ℹ️" />
              {isAdmin && (
                <Toggle checked={settings.notifications.adminAlerts} onChange={v => patchNotif('adminAlerts', v)} label="Админ-оповещения" description="Новые пользователи, заявки на организацию" icon="🛡️" />
              )}
            </div>

            {/* Звук */}
            <div className="bg-[#252836] rounded-xl p-5 space-y-4">
              <SectionHeader emoji="🔊" title="Звук" subtitle="Звуковые уведомления в приложении" />

              <Toggle checked={settings.sound.enabled} onChange={v => patchSound('enabled', v)} label="Звук уведомлений" description="Воспроизводить звук при уведомлении" icon="🔔" />

              {settings.sound.enabled && (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-white">Громкость</label>
                      <span className="text-sm text-gray-400">{settings.sound.volume}%</span>
                    </div>
                    <input
                      type="range" min={0} max={100}
                      value={settings.sound.volume}
                      onChange={e => patchSound('volume', Number(e.target.value))}
                      className="w-full accent-[#ff6b35]"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-white mb-3 block">Тип звука</label>
                    <div className="flex gap-2">
                      {SOUND_TYPES.map(s => (
                        <button
                          key={s.id}
                          onClick={() => patchSound('soundType', s.id)}
                          className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-lg border text-xs transition-all ${
                            settings.sound.soundType === s.id
                              ? 'bg-[#ff6b35]/15 border-[#ff6b35] text-[#ff6b35]'
                              : 'border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
                          }`}
                        >
                          <span className="text-lg">{s.emoji}</span>
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button onClick={handleTestSound} variant="outline" className="w-full border-white/10 text-gray-300 hover:text-white text-sm">
                    <Icon name="Play" className="h-4 w-4 mr-2" />
                    Проверить звук
                  </Button>
                </>
              )}
            </div>

            <Button onClick={handleSave} className="w-full bg-[#ff6b35] hover:bg-[#e55a24]">
              {saved
                ? <><Icon name="Check" className="h-4 w-4 mr-2" />Сохранено</>
                : <><Icon name="Save" className="h-4 w-4 mr-2" />Сохранить настройки</>
              }
            </Button>
          </div>
        )}

        {/* ── Админ / Пароль ──────────────────────────────── */}
        {activeTab === 'admin' && isAdmin && (
          <AdminPasswordSettings />
        )}
      </div>
    </div>
  );
};

export default UserSettings;
