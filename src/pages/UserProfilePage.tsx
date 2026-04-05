import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { GarageTab } from "@/components/profile/GarageTab";
import { FriendsTab } from "@/components/profile/FriendsTab";
import { getRoleEmoji } from "@/components/admin/RoleBadge";
import { CallsignPlate } from "@/components/profile/CallsignPlate";
import { PhotoGallery } from "@/components/profile/PhotoGallery";

const AUTH_API = 'https://functions.poehali.dev/55efb6f4-b3ab-4ac3-8b19-da9b21b5490e';
const ADMIN_API = 'https://functions.poehali.dev/f34bd996-f5f2-4c81-8b7b-fb5621187a7f';
const PILLION_API = 'https://functions.poehali.dev/9c00014f-3839-44bc-900d-0a59358d4e97';

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

interface Vehicle {
  id: number;
  vehicle_type: string;
  brand: string;
  model: string;
  year?: number;
  description?: string;
  is_primary: boolean;
}

export const UserProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [friendsCount, setFriendsCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  const [friendStatus, setFriendStatus] = useState<'none' | 'pending_sent' | 'pending_received' | 'friends'>('none');
  const { token, user: currentUser } = useAuth();
  const { toast } = useToast();
  const [roleChanging, setRoleChanging] = useState(false);
  const [hasPilotCard, setHasPilotCard] = useState(false);
  const [hasPassengerCard, setHasPassengerCard] = useState(false);
  const [photos, setPhotos] = useState<{id:number; photo_url:string; source:string; created_at:string}[]>([]);

  const isCeo = currentUser?.role === 'ceo';

  useEffect(() => {
    if (userId) {
      loadProfile();
      loadPillionCards();
      loadPhotos();
    }
  }, [userId]);

  useEffect(() => {
    if (userId && token && currentUser) {
      loadFriendStatus();
    }
  }, [userId, token, currentUser]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${AUTH_API}?action=public&user_id=${userId}`);

      if (response.ok) {
        const data = await response.json();
        setProfile(data.user);
        setVehicles(data.vehicles || []);
        setFriendsCount(data.friends_count || 0);
        setFavoritesCount(data.favorites_count || 0);
      } else {
        toast({
          title: "Ошибка",
          description: "Профиль недоступен",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить профиль",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPillionCards = async () => {
    if (!userId) return;
    try {
      const [pilotRes, passRes] = await Promise.all([
        fetch(`${PILLION_API}?action=pilots&user_id=${userId}`),
        fetch(`${PILLION_API}?action=passengers&user_id=${userId}`),
      ]);
      if (pilotRes.ok) {
        const data = await pilotRes.json();
        setHasPilotCard(Array.isArray(data) ? data.length > 0 : !!data);
      }
      if (passRes.ok) {
        const data = await passRes.json();
        setHasPassengerCard(Array.isArray(data) ? data.length > 0 : !!data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadPhotos = async () => {
    if (!userId || !token) return;
    try {
      const r = await fetch(`${AUTH_API}?action=photos&user_id=${userId}`, {
        headers: { 'X-Auth-Token': token },
      });
      if (r.ok) {
        const d = await r.json();
        setPhotos(d.photos || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadFriendStatus = async () => {
    if (!token || !userId || !currentUser) return;
    try {
      const response = await fetch(`${AUTH_API}?action=friends`, {
        headers: { 'X-Auth-Token': token },
      });
      if (!response.ok) return;
      const data = await response.json();
      const targetId = parseInt(userId);
      const found = (data.friends || []).find((f: { id: number; status: string; direction: string }) => f.id === targetId);
      if (!found) {
        setFriendStatus('none');
      } else if (found.status === 'accepted') {
        setFriendStatus('friends');
      } else if (found.status === 'pending' && found.direction === 'sent') {
        setFriendStatus('pending_sent');
      } else if (found.status === 'pending' && found.direction === 'received') {
        setFriendStatus('pending_received');
      }
    } catch {
      // ignore
    }
  };

  const addFriend = async () => {
    if (!token) {
      toast({ title: "Требуется авторизация", variant: "destructive" });
      return;
    }
    try {
      const response = await fetch(`${AUTH_API}?action=friends`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token },
        body: JSON.stringify({ friend_id: parseInt(userId!) }),
      });
      const data = await response.json();
      if (response.ok) {
        toast({ title: "Заявка отправлена!" });
        setFriendStatus('pending_sent');
      } else {
        toast({ title: "Ошибка", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Ошибка", variant: "destructive" });
    }
  };

  const removeFriend = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${AUTH_API}?action=friends&friend_id=${userId}`, {
        method: 'DELETE',
        headers: { 'X-Auth-Token': token },
      });
      if (response.ok) {
        toast({ title: "Удалён из друзей" });
        setFriendStatus('none');
        setFriendsCount(prev => Math.max(0, prev - 1));
      }
    } catch {
      toast({ title: "Ошибка", variant: "destructive" });
    }
  };

  const acceptFriend = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${AUTH_API}?action=friends`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token },
        body: JSON.stringify({ friend_id: parseInt(userId!), status: 'accepted' }),
      });
      if (response.ok) {
        toast({ title: "Заявка принята!" });
        setFriendStatus('friends');
        setFriendsCount(prev => prev + 1);
      }
    } catch {
      toast({ title: "Ошибка", variant: "destructive" });
    }
  };

  const getDefaultAvatar = (gender?: string) => {
    return gender === 'female' 
      ? '/img/323010ec-ee00-4bf5-b69e-88189dbc69e9.jpg'
      : '/img/5732fd0a-94d2-4175-8e07-8d3c8aed2373.jpg';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1e2332] flex items-center justify-center">
        <Icon name="Loader2" className="h-8 w-8 animate-spin text-[#ff6b35]" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#1e2332] flex items-center justify-center">
        <div className="text-center">
          <Icon name="UserX" className="h-16 w-16 mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">Профиль не найден</p>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser && currentUser.id === profile.id;

  const handleRoleChange = async (newRole: string) => {
    if (!token || !isCeo || !profile) return;
    if (!confirm(`Выдать роль «${newRole}» пользователю ${profile.name}?`)) return;
    setRoleChanging(true);
    try {
      const res = await fetch(`${ADMIN_API}?action=user-role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token },
        body: JSON.stringify({ userId: profile.id, role: newRole }),
      });
      const data = await res.json();
      if (res.ok) {
        setProfile(prev => prev ? { ...prev, role: newRole } : prev);
        toast({ title: `Роль изменена на «${newRole}»` });
      } else {
        toast({ title: data.error || 'Ошибка', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Ошибка сети', variant: 'destructive' });
    } finally {
      setRoleChanging(false);
    }
  };
  const telegramUsername = profile.telegram || profile.telegram_username || profile.username;

  return (
    <div className="min-h-screen bg-[#1e2332]">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="mb-4">
          <Button
            variant="ghost"
            onClick={() => {
              if (activeTab !== "profile") {
                setActiveTab("profile");
              } else if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate('/');
              }
            }}
            className="text-gray-400 hover:text-white"
          >
            <Icon name="ArrowLeft" className="mr-2" size={20} />
            Назад
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-0">
          {/* Табы — как в личном профиле */}
          <div className="bg-[#252836] rounded-lg p-2 mb-4">
            <TabsList className="grid w-full grid-cols-3 bg-[#1e2332]">
              <TabsTrigger value="profile" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <Icon name="User" className="h-4 w-4 mr-2" />
                Профиль
              </TabsTrigger>
              <TabsTrigger value="garage" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <Icon name="Car" className="h-4 w-4 mr-2" />
                Гараж
                {vehicles.length > 0 && (
                  <span className="ml-2 bg-purple-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {vehicles.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="friends" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <Icon name="Users" className="h-4 w-4 mr-2" />
                Друзья
                {friendsCount > 0 && (
                  <span className="ml-2 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {friendsCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="profile" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Левая колонка — шапка профиля */}
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

                  {profile.bio && (
                    <p className="text-gray-300 text-sm leading-relaxed bg-[#1e2332] rounded-lg p-3 mb-4">
                      {profile.bio}
                    </p>
                  )}

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
                </div>

                {/* Фото */}
                {photos.length > 0 && (
                  <div className="bg-[#252836] rounded-lg p-3 sm:p-4">
                    <PhotoGallery photos={photos} readonly={true} />
                  </div>
                )}
              </div>

              {/* Правая колонка — статистика + кнопки */}
              <div className="space-y-4">
                {/* Статистика — как в личном профиле */}
                <div className="bg-[#252836] rounded-lg p-6">
                  <h2 className="text-xl font-bold text-white mb-4">Статистика</h2>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setActiveTab('friends')}
                      className="bg-[#1e2332] rounded-lg p-4 hover:bg-[#2a2f42] transition-colors text-left"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Icon name="Users" className="h-5 w-5 text-blue-500" />
                        <span className="text-gray-400 text-sm">Друзья</span>
                      </div>
                      <p className="text-2xl font-bold text-white">{friendsCount}</p>
                    </button>
                    <button
                      onClick={() => setActiveTab('garage')}
                      className="bg-[#1e2332] rounded-lg p-4 hover:bg-[#2a2f42] transition-colors text-left"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Icon name="Car" className="h-5 w-5 text-purple-500" />
                        <span className="text-gray-400 text-sm">Гараж</span>
                      </div>
                      <p className="text-2xl font-bold text-white">{vehicles.length}</p>
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

                {/* Кнопка дружбы */}
                {!isOwnProfile && token && (
                  <div className="flex gap-2">
                    {friendStatus === 'none' && (
                      <Button onClick={addFriend} className="bg-[#ff6b35] hover:bg-[#ff6b35]/90 text-white flex-1">
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
                        <Button onClick={acceptFriend} className="bg-green-600 hover:bg-green-700 text-white flex-1">
                          <Icon name="Check" className="h-4 w-4 mr-2" />
                          Принять заявку
                        </Button>
                        <Button onClick={removeFriend} variant="outline" className="border-red-500 text-red-400 hover:bg-red-500/10 px-3">
                          <Icon name="X" className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {friendStatus === 'friends' && (
                      <Button onClick={removeFriend} variant="outline" className="border-gray-600 text-gray-400 hover:border-red-500 hover:text-red-400 flex-1">
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
                          disabled={roleChanging || profile.role === role}
                          onClick={() => handleRoleChange(role)}
                          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                            profile.role === role
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
            </div>
          </TabsContent>

          <TabsContent value="garage" className="mt-0">
            <div className="bg-[#252836] rounded-lg p-3 sm:p-6">
              <GarageTab
                vehicles={vehicles}
                onRefresh={loadProfile}
                readonly={!isOwnProfile}
              />
            </div>
          </TabsContent>

          <TabsContent value="friends" className="mt-0">
            <div className="bg-[#252836] rounded-lg p-4 sm:p-6">
              <FriendsTab userId={parseInt(userId!)} readonly={!isOwnProfile} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};