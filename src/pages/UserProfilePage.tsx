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

const AUTH_API = 'https://functions.poehali.dev/55efb6f4-b3ab-4ac3-8b19-da9b21b5490e';

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

  useEffect(() => {
    if (userId) {
      loadProfile();
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
          <TabsContent value="profile" className="mt-0">
            <div className="bg-[#252836] rounded-lg overflow-hidden">
              <div className="p-4 sm:p-6">
                {/* Шапка профиля — горизонтальная на мобилке */}
                <div className="flex items-start gap-4 mb-5">
                  <img
                    src={profile.avatar_url || getDefaultAvatar(profile.gender)}
                    alt={profile.name}
                    className="w-20 h-20 sm:w-28 sm:h-28 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wide">
                      Участник с {new Date(profile.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </p>
                    <h1 className="text-lg sm:text-2xl font-semibold text-white leading-tight truncate">
                      {profile.name}{getRoleEmoji(profile.role || 'user')}
                    </h1>
                    {profile.callsign && (
                      <div className="mt-1">
                        <CallsignPlate callsign={profile.callsign} region="72" size="sm" />
                      </div>
                    )}
                    {telegramUsername && (
                      <Button
                        onClick={() => window.open(`https://t.me/${telegramUsername}`, '_blank')}
                        variant="ghost"
                        size="sm"
                        className="text-[#0088cc] hover:text-white hover:bg-[#1e2332] mt-1 px-2 h-7"
                      >
                        <Icon name="Send" className="h-3 w-3 mr-1" />
                        Написать
                      </Button>
                    )}
                  </div>
                </div>

                {/* Инфо — локация и телефон */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4 text-sm text-gray-400">
                  {profile.location && (
                    <div className="flex items-center gap-1.5">
                      <Icon name="MapPin" className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                  {profile.phone && (
                    <div className="flex items-center gap-1.5">
                      <Icon name="Phone" className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                </div>

                {/* Статистика */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <button
                    onClick={() => setActiveTab('friends')}
                    className="bg-[#1e2332] rounded-lg p-2.5 text-center hover:bg-[#2a2e3f] transition-colors"
                  >
                    <div className="text-lg sm:text-xl font-bold text-white">{friendsCount}</div>
                    <div className="text-[11px] text-gray-500">Друзей</div>
                  </button>
                  <button
                    onClick={() => setActiveTab('garage')}
                    className="bg-[#1e2332] rounded-lg p-2.5 text-center hover:bg-[#2a2e3f] transition-colors"
                  >
                    <div className="text-lg sm:text-xl font-bold text-white">{vehicles.length}</div>
                    <div className="text-[11px] text-gray-500">Техника</div>
                  </button>
                  <div className="bg-[#1e2332] rounded-lg p-2.5 text-center">
                    <div className="text-lg sm:text-xl font-bold text-white">{favoritesCount}</div>
                    <div className="text-[11px] text-gray-500">Избранное</div>
                  </div>
                </div>

                {/* Кнопка дружбы */}
                {!isOwnProfile && token && (
                  <div className="flex gap-2 mb-4">
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
              </div>

              <TabsList className="w-full justify-start bg-transparent border-t border-gray-700 rounded-none px-2 sm:px-4 h-auto py-0">
                <TabsTrigger
                  value="profile"
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#ff6b35] rounded-none px-3 sm:px-4 py-3 text-gray-400 data-[state=active]:text-white text-sm"
                >
                  Обо мне
                </TabsTrigger>
                <TabsTrigger
                  value="garage"
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#ff6b35] rounded-none px-3 sm:px-4 py-3 text-gray-400 data-[state=active]:text-white text-sm"
                >
                  Гараж ({vehicles.length})
                </TabsTrigger>
                <TabsTrigger
                  value="friends"
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#ff6b35] rounded-none px-3 sm:px-4 py-3 text-gray-400 data-[state=active]:text-white text-sm"
                >
                  Друзья ({friendsCount})
                </TabsTrigger>
              </TabsList>

              <div className="p-4 sm:p-6">
                {profile.bio ? (
                  <p className="text-gray-300 text-sm sm:text-base leading-relaxed">{profile.bio}</p>
                ) : (
                  <p className="text-gray-500 text-center py-8 text-sm">Пользователь пока не рассказал о себе</p>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="garage" className="mt-0">
            <div className="bg-[#252836] rounded-lg overflow-hidden">
              <TabsList className="w-full justify-start bg-transparent border-b border-gray-700 rounded-none px-4 h-auto py-0">
                <TabsTrigger 
                  value="profile" 
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#ff6b35] rounded-none px-4 py-3 text-gray-400 data-[state=active]:text-white"
                >
                  Обо мне
                </TabsTrigger>
                <TabsTrigger 
                  value="garage" 
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#ff6b35] rounded-none px-4 py-3 text-gray-400 data-[state=active]:text-white"
                >
                  Гараж ({vehicles.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="friends" 
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#ff6b35] rounded-none px-4 py-3 text-gray-400 data-[state=active]:text-white"
                >
                  Друзья ({friendsCount})
                </TabsTrigger>
              </TabsList>
              
              <div className="p-3 sm:p-6">
                <GarageTab 
                  vehicles={vehicles} 
                  onRefresh={loadProfile}
                  readonly={!isOwnProfile}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="friends" className="mt-0">
            <div className="bg-[#252836] rounded-lg overflow-hidden">
              <TabsList className="w-full justify-start bg-transparent border-b border-gray-700 rounded-none px-2 sm:px-4 h-auto py-0">
                <TabsTrigger value="profile" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#ff6b35] rounded-none px-3 sm:px-4 py-3 text-gray-400 data-[state=active]:text-white text-sm">Обо мне</TabsTrigger>
                <TabsTrigger value="garage" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#ff6b35] rounded-none px-3 sm:px-4 py-3 text-gray-400 data-[state=active]:text-white text-sm">Гараж ({vehicles.length})</TabsTrigger>
                <TabsTrigger value="friends" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#ff6b35] rounded-none px-3 sm:px-4 py-3 text-gray-400 data-[state=active]:text-white text-sm">Друзья ({friendsCount})</TabsTrigger>
              </TabsList>
              <div className="p-4 sm:p-6">
                <FriendsTab userId={parseInt(userId!)} readonly={!isOwnProfile} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};