import React, { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";
import { getRoleEmoji } from "@/components/admin/RoleBadge";

const AUTH_API = "https://functions.poehali.dev/55efb6f4-b3ab-4ac3-8b19-da9b21b5490e";

interface PublicProfile {
  id: number;
  name: string;
  role: string;
  is_organization: boolean;
  custom_id: string | null;
  created_at: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  callsign?: string;
  gender?: string;
  organization?: { id: number; name: string; category: string } | null;
  vehicles?: { id: number; brand: string; model: string; year: number }[];
}

interface Props {
  userId: string | number | null;
  open: boolean;
  onClose: () => void;
}

const getDefaultAvatar = (gender?: string) =>
  gender === "female"
    ? "/img/323010ec-ee00-4bf5-b69e-88189dbc69e9.jpg"
    : "/img/5732fd0a-94d2-4175-8e07-8d3c8aed2373.jpg";

const UserProfileModal: React.FC<Props> = ({ userId, open, onClose }) => {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !userId) return;
    setProfile(null);
    setError(null);
    setLoading(true);
    fetch(`${AUTH_API}?action=public-profile&id=${userId}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setProfile(data);
      })
      .catch(() => setError("Не удалось загрузить профиль"))
      .finally(() => setLoading(false));
  }, [open, userId]);

  const profileId = profile?.custom_id || profile?.id;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm p-0 overflow-hidden bg-[#252836] border-zinc-700">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Icon name="Loader2" className="h-8 w-8 animate-spin text-accent" />
          </div>
        )}
        {error && (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <Icon name="UserX" size={40} className="text-zinc-600 mb-3" />
            <p className="text-zinc-400">{error}</p>
          </div>
        )}
        {profile && !loading && (
          <div>
            {/* Шапка с аватаром */}
            <div className="relative bg-gradient-to-b from-zinc-700 to-[#252836] px-6 pt-6 pb-4">
              <div className="flex items-start gap-4">
                <img
                  src={profile.avatar_url || getDefaultAvatar(profile.gender)}
                  alt={profile.name}
                  className="w-20 h-20 rounded-full object-cover ring-4 ring-accent flex-shrink-0"
                />
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h2 className="text-xl font-bold text-white leading-tight">{profile.name}</h2>
                    {getRoleEmoji(profile.role) && (
                      <span className="text-lg">{getRoleEmoji(profile.role)}</span>
                    )}
                    {profile.is_organization && <span className="text-lg">🏢</span>}
                  </div>
                  {profile.callsign && (
                    <p className="text-sm text-accent font-mono mt-0.5">#{profile.callsign}</p>
                  )}
                  <p className="text-xs text-zinc-500 mt-1">
                    @{profileId} · с {new Date(profile.created_at).toLocaleDateString("ru-RU", { month: "long", year: "numeric" })}
                  </p>
                </div>
              </div>
            </div>

            {/* Контент */}
            <div className="px-6 pb-6 space-y-4">
              {profile.bio && (
                <p className="text-sm text-zinc-300 leading-relaxed">{profile.bio}</p>
              )}

              <div className="flex flex-wrap gap-2">
                {profile.location && (
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <Icon name="MapPin" size={12} />
                    {profile.location}
                  </div>
                )}
                {profile.organization && (
                  <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs gap-1">
                    <Icon name="Building2" size={10} />
                    {profile.organization.name}
                  </Badge>
                )}
              </div>

              {profile.vehicles && profile.vehicles.length > 0 && (
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <Icon name="Bike" size={12} />
                    Гараж
                  </p>
                  <div className="space-y-1.5">
                    {profile.vehicles.map(v => (
                      <div key={v.id} className="flex items-center gap-2 bg-zinc-800/60 rounded-lg px-3 py-2">
                        <Icon name="Bike" size={14} className="text-accent flex-shrink-0" />
                        <span className="text-sm text-white">{v.brand} {v.model}</span>
                        {v.year && <span className="text-xs text-zinc-500 ml-auto">{v.year}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ссылка на профиль */}
              <div className="pt-2 border-t border-zinc-700">
                <a
                  href={`/u/${profileId}`}
                  className="flex items-center gap-2 text-xs text-zinc-500 hover:text-accent transition-colors"
                  onClick={onClose}
                >
                  <Icon name="ExternalLink" size={12} />
                  /u/{profileId}
                </a>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UserProfileModal;
