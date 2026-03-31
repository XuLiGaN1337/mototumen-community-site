import React from 'react';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';
import { CallsignPlate } from '@/components/profile/CallsignPlate';
import { getRoleEmoji } from '@/components/admin/RoleBadge';

interface ProfileHeaderProps {
  user: any;
  profileData: any;
  editForm: any;
  avatarPreview: string | null;
  isEditing: boolean;
  onEdit: () => void;
  onLogout: () => void;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAvatar?: () => void;
  getDefaultAvatar: (gender: string) => string;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  profileData,
  editForm,
  avatarPreview,
  isEditing,
  onEdit,
  onLogout,
  onAvatarChange,
  onRemoveAvatar,
  getDefaultAvatar,
}) => {
  const hasCustomAvatar = user.avatar_url && user.avatar_url.startsWith('http');
  return (
    <div className="bg-[#252836] rounded-lg p-3 sm:p-4 relative">
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex gap-1 sm:gap-2">
        <button
          onClick={onEdit}
          className="p-2 hover:bg-[#1e2332] rounded-lg transition-colors"
          title="Редактировать"
        >
          <Icon name="Edit" className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-white" />
        </button>
        <button
          onClick={onLogout}
          className="p-2 hover:bg-[#1e2332] rounded-lg transition-colors"
          title="Выйти"
        >
          <Icon name="LogOut" className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-white" />
        </button>
      </div>

      <div className="flex items-start gap-3 sm:gap-4 mb-4">
        <div className="relative group flex-shrink-0">
          <img
            src={avatarPreview || user.avatar_url || getDefaultAvatar(editForm.gender)}
            alt={user.name}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover ring-4 ring-blue-500"
          />
          {isEditing && (
            <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
              <Icon name="Camera" className="h-5 w-5 text-white" />
              <input
                type="file"
                accept="image/*"
                onChange={onAvatarChange}
                className="hidden"
              />
            </label>
          )}
          {hasCustomAvatar && !isEditing && onRemoveAvatar && (
            <button
              onClick={onRemoveAvatar}
              className="absolute -bottom-1 -right-1 p-1.5 bg-red-600 hover:bg-red-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              title="Удалить аватар"
            >
              <Icon name="X" className="h-3 w-3 text-white" />
            </button>
          )}
        </div>
        <div className="flex-1 pr-12 sm:pr-16 min-w-0">
          <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wide">
            Участник с {profileData?.profile?.created_at ? new Date(profileData.profile.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''}
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-2 truncate">
            {user.name}
            {profileData?.profile?.roles?.map((roleObj: any) => (
              <span key={roleObj.role} className="ml-2 text-xl">{getRoleEmoji(roleObj.role)}</span>
            ))}
          </h1>

          {editForm.callsign && (
            <div className="mb-3">
              <CallsignPlate callsign={editForm.callsign} />
            </div>
          )}

          {user.telegram_username && (
            <a
              href={`https://t.me/${user.telegram_username.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2 py-1 bg-[#1e2332] rounded-lg text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              <Icon name="Send" className="h-3 w-3" />
              @{user.telegram_username.replace('@', '')}
            </a>
          )}
        </div>
      </div>

      {user.bio && (
        <p className="text-gray-300 text-sm leading-relaxed bg-[#1e2332] rounded-lg p-3 mb-4">
          {user.bio}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {user.phone && (
          <div className="bg-[#1e2332] rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
              <Icon name="Phone" className="h-3 w-3" />
              <span>Телефон</span>
            </div>
            <p className="text-white font-medium text-sm">{user.phone}</p>
          </div>
        )}
        {user.location && (
          <div className="bg-[#1e2332] rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
              <Icon name="MapPin" className="h-3 w-3" />
              <span>Локация</span>
            </div>
            <p className="text-white font-medium text-sm">{user.location}</p>
          </div>
        )}
        <div className="bg-[#1e2332] rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
            <Icon name="User" className="h-3 w-3" />
            <span>Пол</span>
          </div>
          <p className="text-white font-medium text-sm">
            {user.gender === 'female' ? 'Женский' : 'Мужской'}
          </p>
        </div>
        <div className="bg-[#1e2332] rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
            <Icon name="Hash" className="h-3 w-3" />
            <span>ID</span>
          </div>
          <p className="text-white font-mono text-sm">#{user.id}</p>
        </div>
      </div>
    </div>
  );
};