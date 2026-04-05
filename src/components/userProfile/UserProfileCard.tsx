import React from "react";
import Icon from "@/components/ui/icon";
import { getRoleEmoji } from "@/components/admin/RoleBadge";
import { CallsignPlate } from "@/components/profile/CallsignPlate";
import { PhotoGallery } from "@/components/profile/PhotoGallery";

interface UserProfile {
  id: number;
  name: string;
  username?: string;
  avatar_url?: string;
  location?: string;
  bio?: string;
  phone?: string;
  telegram?: string;
  telegram_username?: string;
  gender?: string;
  callsign?: string;
  role?: string;
  created_at: string;
}

interface UserProfileCardProps {
  profile: UserProfile;
  photos: { id: number; photo_url: string; source: string; created_at: string }[];
  getDefaultAvatar: (gender?: string) => string;
}

export const UserProfileCard: React.FC<UserProfileCardProps> = ({ profile, photos, getDefaultAvatar }) => {
  const telegramUsername = profile.telegram || profile.telegram_username || profile.username;

  return (
    <div className="space-y-4">
      <div className="bg-[#252836] rounded-lg p-3 sm:p-4">
        <div className="flex items-start gap-3 sm:gap-4 mb-4">
          <div className="flex-shrink-0">
            <img
              src={profile.avatar_url || getDefaultAvatar(profile.gender)}
              alt={profile.name}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover ring-4 ring-blue-500"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wide">
              Участник с {new Date(profile.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </p>
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-2 truncate">
              {profile.name}
              <span className="ml-2 text-xl">{getRoleEmoji(profile.role || 'user')}</span>
            </h1>
            {profile.callsign && (
              <div className="mb-2">
                <CallsignPlate callsign={profile.callsign} region="72" size="sm" />
              </div>
            )}
            {telegramUsername && (
              <a
                href={`https://t.me/${telegramUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2 py-1 bg-[#1e2332] rounded-lg text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                <Icon name="Send" className="h-3 w-3" />
                @{telegramUsername.replace('@', '')}
              </a>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {profile.phone && (
            <div className="bg-[#1e2332] rounded-lg p-3">
              <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                <Icon name="Phone" className="h-3 w-3" />
                <span>Телефон</span>
              </div>
              <p className="text-white font-medium text-sm">{profile.phone}</p>
            </div>
          )}
          {profile.location && (
            <div className="bg-[#1e2332] rounded-lg p-3">
              <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                <Icon name="MapPin" className="h-3 w-3" />
                <span>Локация</span>
              </div>
              <p className="text-white font-medium text-sm">{profile.location}</p>
            </div>
          )}
        </div>

        {profile.bio && (
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-1.5 uppercase tracking-wide">О себе</p>
            <p className="text-gray-300 text-sm leading-relaxed bg-[#1e2332] rounded-lg p-3">
              {profile.bio}
            </p>
          </div>
        )}
      </div>

      {photos.length > 0 && (
        <div className="bg-[#252836] rounded-lg p-3 sm:p-4">
          <PhotoGallery photos={photos} readonly={true} />
        </div>
      )}
    </div>
  );
};