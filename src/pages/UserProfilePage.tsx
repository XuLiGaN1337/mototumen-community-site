import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { GarageTab } from "@/components/profile/GarageTab";
import { FriendsTab } from "@/components/profile/FriendsTab";
import { UserProfileCard } from "@/components/userProfile/UserProfileCard";
import { UserProfileStats } from "@/components/userProfile/UserProfileStats";
import { UserProfileTabs } from "@/components/userProfile/UserProfileTabs";
import { AchievementsSection } from "@/components/profile/AchievementsSection";

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

  const isOwnProfile = !!(currentUser && currentUser.id === profile.id);

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
          <UserProfileTabs vehiclesCount={vehicles.length} friendsCount={friendsCount} />

          <TabsContent value="profile" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-4">
                <UserProfileCard
                  profile={profile}
                  photos={photos}
                  getDefaultAvatar={getDefaultAvatar}
                />
                <AchievementsSection
                  userId={profile.id}
                  token={token}
                  isCeo={isCeo}
                />
              </div>
              <UserProfileStats
                friendsCount={friendsCount}
                vehiclesCount={vehicles.length}
                favoritesCount={favoritesCount}
                hasPilotCard={hasPilotCard}
                hasPassengerCard={hasPassengerCard}
                userId={userId!}
                friendStatus={friendStatus}
                isOwnProfile={isOwnProfile}
                token={token}
                isCeo={isCeo}
                roleChanging={roleChanging}
                currentRole={profile.role}
                onTabChange={setActiveTab}
                onAddFriend={addFriend}
                onRemoveFriend={removeFriend}
                onAcceptFriend={acceptFriend}
                onRoleChange={handleRoleChange}
              />
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