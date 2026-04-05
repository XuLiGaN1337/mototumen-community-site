import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";
import { getRoleEmoji } from "@/components/admin/RoleBadge";
import { CallsignPlate } from "@/components/profile/CallsignPlate";

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

const getDefaultAvatar = (gender?: string) =>
  gender === "female"
    ? "/img/323010ec-ee00-4bf5-b69e-88189dbc69e9.jpg"
    : "/img/5732fd0a-94d2-4175-8e07-8d3c8aed2373.jpg";

const UserPublicPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`${AUTH_API}?action=public-profile&id=${id}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then(data => {
        if (data && !data.error) {
          setProfile(data);
          // Если зашли по числовому id, а у пользователя есть custom_id — заменяем URL
          const canonical = data.custom_id || String(data.id);
          if (canonical !== id) {
            navigate(`/u/${canonical}`, { replace: true });
          }
        } else if (data?.error) {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const profileId = profile?.custom_id || profile?.id;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1e2332] flex items-center justify-center">
        <Icon name="Loader2" className="h-10 w-10 animate-spin text-accent" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#1e2332] flex flex-col items-center justify-center gap-4">
        <Icon name="UserX" size={64} className="text-zinc-600" />
        <h1 className="text-2xl font-bold text-white">Пользователь не найден</h1>
        <p className="text-zinc-400">/u/{id}</p>
        <Button onClick={() => navigate("/")} variant="outline" className="mt-2">На главную</Button>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-[#1e2332]">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="text-gray-400 hover:text-white mb-4">
          <Icon name="ArrowLeft" className="mr-2" size={18} />
          Назад
        </Button>

        <div className="bg-[#252836] rounded-xl overflow-hidden">
          {/* Шапка */}
          <div className="bg-gradient-to-br from-zinc-700/50 to-transparent px-6 pt-8 pb-6">
            <div className="flex items-start gap-5">
              <img
                src={profile.avatar_url || getDefaultAvatar(profile.gender)}
                alt={profile.name}
                className="w-24 h-24 rounded-full object-cover ring-4 ring-accent flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-2xl font-bold text-white">{profile.name}</h1>
                  {getRoleEmoji(profile.role) && (
                    <span className="text-xl">{getRoleEmoji(profile.role)}</span>
                  )}
                  {profile.is_organization && <span className="text-xl">🏢</span>}
                </div>
                {profile.callsign && (
                  <div className="mb-2"><CallsignPlate callsign={profile.callsign} /></div>
                )}
                <div className="flex items-center gap-2 flex-wrap text-sm text-zinc-400">
                  <span className="font-mono text-zinc-500">@{profileId}</span>
                  <span>·</span>
                  <span>Участник с {new Date(profile.created_at).toLocaleDateString("ru-RU", { month: "long", year: "numeric" })}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Инфо */}
          <div className="px-6 pb-6 space-y-5">
            {profile.bio && (
              <p className="text-zinc-300 text-sm leading-relaxed bg-[#1e2332] rounded-lg p-4">{profile.bio}</p>
            )}

            <div className="flex flex-wrap gap-3">
              {profile.location && (
                <div className="flex items-center gap-1.5 text-sm text-zinc-400">
                  <Icon name="MapPin" size={14} />
                  {profile.location}
                </div>
              )}
              {profile.organization && (
                <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 gap-1.5">
                  <Icon name="Building2" size={12} />
                  {profile.organization.name}
                </Badge>
              )}
            </div>

            {profile.vehicles && profile.vehicles.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Icon name="Bike" size={14} />
                  Гараж
                </h2>
                <div className="space-y-2">
                  {profile.vehicles.map(v => (
                    <div key={v.id} className="flex items-center gap-3 bg-[#1e2332] rounded-lg px-4 py-3">
                      <Icon name="Bike" size={16} className="text-accent flex-shrink-0" />
                      <span className="text-white font-medium">{v.brand} {v.model}</span>
                      {v.year && <span className="text-zinc-500 text-sm ml-auto">{v.year}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPublicPage;