import React from "react";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";

type FriendStatus = 'none' | 'pending_sent' | 'pending_received' | 'friends';

interface UserProfileStatsProps {
  friendsCount: number;
  vehiclesCount: number;
  favoritesCount: number;
  hasPilotCard: boolean;
  hasPassengerCard: boolean;
  userId: string;
  friendStatus: FriendStatus;
  isOwnProfile: boolean;
  token: string | null;
  isCeo: boolean;
  roleChanging: boolean;
  currentRole?: string;
  onTabChange: (tab: string) => void;
  onAddFriend: () => void;
  onRemoveFriend: () => void;
  onAcceptFriend: () => void;
  onRoleChange: (role: string) => void;
}

export const UserProfileStats: React.FC<UserProfileStatsProps> = ({
  friendsCount,
  vehiclesCount,
  favoritesCount,
  hasPilotCard,
  hasPassengerCard,
  userId,
  friendStatus,
  isOwnProfile,
  token,
  isCeo,
  roleChanging,
  currentRole,
  onTabChange,
  onAddFriend,
  onRemoveFriend,
  onAcceptFriend,
  onRoleChange,
}) => {
  return (
    <div className="space-y-4">
      {/* Статистика */}
      <div className="bg-[#252836] rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">Статистика</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onTabChange('friends')}
            className="bg-[#1e2332] rounded-lg p-4 hover:bg-[#2a2f42] transition-colors text-left"
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon name="Users" className="h-5 w-5 text-blue-500" />
              <span className="text-gray-400 text-sm">Друзья</span>
            </div>
            <p className="text-2xl font-bold text-white">{friendsCount}</p>
          </button>
          <button
            onClick={() => onTabChange('garage')}
            className="bg-[#1e2332] rounded-lg p-4 hover:bg-[#2a2f42] transition-colors text-left"
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon name="Car" className="h-5 w-5 text-purple-500" />
              <span className="text-gray-400 text-sm">Гараж</span>
            </div>
            <p className="text-2xl font-bold text-white">{vehiclesCount}</p>
          </button>
          <div className="bg-[#1e2332] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="Star" className="h-5 w-5 text-yellow-500" />
              <span className="text-gray-400 text-sm">Избранное</span>
            </div>
            <p className="text-2xl font-bold text-white">{favoritesCount}</p>
          </div>
          <div className="bg-[#1e2332] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="Calendar" className="h-5 w-5 text-green-500" />
              <span className="text-gray-400 text-sm">Мероприятия</span>
            </div>
            <p className="text-2xl font-bold text-white">0</p>
          </div>
        </div>
      </div>

      {/* Карточки пилота/пассажира */}
      {(hasPilotCard || hasPassengerCard) && (
        <div className="bg-[#252836] rounded-lg p-4">
          <div className="flex flex-wrap gap-2">
            {hasPilotCard && (
              <a
                href={`/pillion?tab=pilots&user_id=${userId}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/30 text-accent text-xs font-medium hover:bg-accent/20 transition-colors"
              >
                <Icon name="Bike" size={13} />
                Карточка пилота
              </a>
            )}
            {hasPassengerCard && (
              <a
                href={`/pillion?tab=passengers&user_id=${userId}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-medium hover:bg-blue-500/20 transition-colors"
              >
                <Icon name="Users" size={13} />
                Карточка пассажира
              </a>
            )}
          </div>
        </div>
      )}

      {/* Кнопки дружбы */}
      {!isOwnProfile && token && (
        <div className="flex gap-2">
          {friendStatus === 'none' && (
            <Button onClick={onAddFriend} className="bg-[#ff6b35] hover:bg-[#ff6b35]/90 text-white flex-1">
              <Icon name="UserPlus" className="h-4 w-4 mr-2" />
              Добавить в друзья
            </Button>
          )}
          {friendStatus === 'pending_sent' && (
            <Button disabled className="bg-gray-700 text-gray-400 flex-1 cursor-default">
              <Icon name="Clock" className="h-4 w-4 mr-2" />
              Заявка отправлена
            </Button>
          )}
          {friendStatus === 'pending_received' && (
            <>
              <Button onClick={onAcceptFriend} className="bg-green-600 hover:bg-green-700 text-white flex-1">
                <Icon name="Check" className="h-4 w-4 mr-2" />
                Принять заявку
              </Button>
              <Button onClick={onRemoveFriend} variant="outline" className="border-red-500 text-red-400 hover:bg-red-500/10 px-3">
                <Icon name="X" className="h-4 w-4" />
              </Button>
            </>
          )}
          {friendStatus === 'friends' && (
            <Button onClick={onRemoveFriend} variant="outline" className="border-gray-600 text-gray-400 hover:border-red-500 hover:text-red-400 flex-1">
              <Icon name="UserCheck" className="h-4 w-4 mr-2" />
              В друзьях · Убрать
            </Button>
          )}
        </div>
      )}

      {/* CEO: смена роли */}
      {isCeo && !isOwnProfile && (
        <div className="bg-[#252836] rounded-lg p-4 border border-yellow-900/40">
          <p className="text-xs text-yellow-600 mb-2 flex items-center gap-1">
            <Icon name="Crown" size={12} />
            CEO — управление ролью
          </p>
          <div className="flex flex-wrap gap-2">
            {([
              { role: 'user', label: 'Пользователь' },
              { role: 'gymkhana', label: '🏍️ Джимханист' },
              { role: 'organizer', label: '🎯 Организатор' },
              { role: 'moderator', label: '🛡️ Модератор' },
              { role: 'admin', label: '⚡ Админ' },
              { role: 'ceo', label: '👑 CEO' },
            ] as const).map(({ role, label }) => (
              <button
                key={role}
                disabled={roleChanging || currentRole === role}
                onClick={() => onRoleChange(role)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  currentRole === role
                    ? 'bg-yellow-600/30 text-yellow-400 border border-yellow-600/50 cursor-default'
                    : 'bg-[#1e2332] text-gray-400 hover:text-white hover:bg-[#2a2e3f] border border-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
