import React, { useState } from 'react';
import Icon from '@/components/ui/icon';
import { AdminPasswordSettings } from './AdminPasswordSettings';
import { AdminDocuments } from './AdminDocuments';
import { AdminNotificationSettings } from './AdminNotificationSettings';

interface SettingsMenuProps {
  adminApi: string;
  users: any[];
  onUsersUpdate: () => void;
}

type SettingSection = 'password' | 'documents' | 'notifications';

export const SettingsMenu: React.FC<SettingsMenuProps> = ({ adminApi, users, onUsersUpdate }) => {
  const [activeSection, setActiveSection] = useState<SettingSection>('password');

  const menuItems = [
    {
      id: 'password' as SettingSection,
      icon: 'Lock',
      label: 'Аккаунт',
      description: 'Пароль администратора'
    },
    {
      id: 'notifications' as SettingSection,
      icon: 'Bell',
      label: 'Уведомления и звук',
      description: 'Настройки уведомлений'
    },
    {
      id: 'documents' as SettingSection,
      icon: 'Shield',
      label: 'Документы',
      description: 'Политика, соглашение, disclaimer'
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-3 flex-wrap justify-start">
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg border transition-all min-w-[120px] ${
              activeSection === item.id
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-card border-border hover:bg-accent'
            }`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
              activeSection === item.id ? 'bg-primary/20' : 'bg-primary/10'
            }`}>
              <Icon name={item.icon as 'Lock'} className="w-6 h-6" />
            </div>
            <span className="text-sm font-semibold text-center">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="border-t border-border pt-6">
        {activeSection === 'password' && (
          <div>
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <Icon name="Lock" className="w-6 h-6" />
              Пароль администратора
            </h2>
            <p className="text-muted-foreground mb-6">
              Измените пароль для доступа к админ-панели
            </p>
            <AdminPasswordSettings
              adminApi={adminApi}
              users={users}
              onPasswordReset={onUsersUpdate}
            />
          </div>
        )}

        {activeSection === 'notifications' && (
          <div>
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <Icon name="Bell" className="w-6 h-6" />
              Уведомления и звук
            </h2>
            <p className="text-muted-foreground mb-6">
              Настройте что и как вам сообщается
            </p>
            <AdminNotificationSettings />
          </div>
        )}

        {activeSection === 'documents' && (
          <div>
            <AdminDocuments />
          </div>
        )}
      </div>
    </div>
  );
};
