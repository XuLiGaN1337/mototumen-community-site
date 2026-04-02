import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { GarageTab } from "@/components/profile/GarageTab";
import { FriendsTab } from "@/components/profile/FriendsTab";
import { useMediaUpload } from "@/hooks/useMediaUpload";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileEditModal } from "@/components/profile/ProfileEditModal";
import { FavoritesSection } from "@/components/profile/FavoritesSection";
import { ProfileStats } from "@/components/profile/ProfileStats";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { PhotoGallery } from "@/components/profile/PhotoGallery";
import LinkedAccounts from "@/components/profile/LinkedAccounts";

const AUTH_API = 'https://functions.poehali.dev/55efb6f4-b3ab-4ac3-8b19-da9b21b5490e';

interface FavoriteItem {
  item_type: string;
  item_id: number;
  created_at: string;
}

interface UserPhoto {
  id: number;
  photo_url: string;
  source: string;
  created_at: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const { user, token, isAuthenticated, logout, updateProfile } = useAuth();
  const { toast } = useToast();
  const { uploadFile, uploading: uploadingMedia } = useMediaUpload();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [profileData, setProfileData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [pendingFriendRequests, setPendingFriendRequests] = useState(0);
  const [photos, setPhotos] = useState<UserPhoto[]>([]);

  const [editForm, setEditForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    bio: user?.bio || "",
    location: user?.location || "",
    avatar_url: user?.avatar_url || "",
    gender: user?.gender || "male",
    callsign: user?.callsign || "",
    telegram: user?.telegram || "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    
    loadProfile();
  }, [isAuthenticated]);

  const loadProfile = async () => {
    if (!token) {
      console.log('[Profile] Загрузка профиля пропущена: нет токена');
      return;
    }
    
    console.log('[Profile] Начинаем загрузку профиля');
    
    try {
      setLoading(true);
      const response = await fetch(AUTH_API, {
        headers: {
          'X-Auth-Token': token,
        },
      });
      
      console.log('[Profile] Ответ от API:', { status: response.status, ok: response.ok });
      
      if (response.ok) {
        const data = await response.json();
        console.log('[Profile] Данные профиля получены:', data);
        
        setProfileData(data);
        setFavorites(data.favorites || []);
        setPendingFriendRequests(data.pending_friend_requests || 0);
        setPhotos(data.photos || []);
        
        setEditForm({
          name: data.profile.name || user?.name || "",
          phone: data.profile.phone || "",
          bio: data.profile.bio || "",
          location: data.profile.location || "",
          avatar_url: data.profile.avatar_url || "",
          gender: data.profile.gender || "male",
          callsign: data.profile.callsign || "",
          telegram: data.profile.telegram || data.profile.telegram_username || "",
        });
        
        console.log('[Profile] Форма редактирования заполнена');
      } else {
        const errorData = await response.text();
        console.error('[Profile] Ошибка загрузки профиля:', { status: response.status, body: errorData });
      }
    } catch (error) {
      console.error('[Profile] Исключение при загрузке профиля:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log('[Profile] Выбран файл аватара:', file ? { name: file.name, size: file.size, type: file.type } : 'нет файла');
    
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
        console.log('[Profile] Превью аватара создано');
      };
      reader.readAsDataURL(file);
    }
  };

  const getDefaultAvatar = (gender: string) => {
    return gender === 'female' 
      ? '/img/323010ec-ee00-4bf5-b69e-88189dbc69e9.jpg'
      : '/img/5732fd0a-94d2-4175-8e07-8d3c8aed2373.jpg';
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    console.log('[Profile] Начинаем сохранение профиля', { editForm, hasAvatarFile: !!avatarFile });
    
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updates: any = {
        phone: editForm.phone,
        bio: editForm.bio,
        location: editForm.location,
        gender: editForm.gender,
        callsign: editForm.callsign,
        telegram: editForm.telegram,
      };
      
      console.log('[Profile] Подготовлены обновления:', updates);
      
      if (avatarFile) {
        console.log('[Profile] Загружаем аватар:', { name: avatarFile.name, size: avatarFile.size });
        const uploadResult = await uploadFile(avatarFile, { 
          folder: 'avatars' 
        });
        
        if (uploadResult) {
          console.log('[Profile] Аватар загружен успешно:', uploadResult.url);
          updates.avatar_url = uploadResult.url;
        } else {
          console.error('[Profile] Ошибка: uploadFile вернул null');
          throw new Error('Не удалось загрузить аватар');
        }
      }
      
      console.log('[Profile] Отправляем запрос на обновление профиля');
      await updateProfile(updates);
      console.log('[Profile] Профиль обновлен успешно');
      
      toast({
        title: "Профиль обновлен",
        description: "Изменения успешно сохранены",
      });
      
      setIsEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      
      console.log('[Profile] Перезагружаем данные профиля');
      await loadProfile();
      console.log('[Profile] Профиль перезагружен');
    } catch (error) {
      console.error('[Profile] Ошибка сохранения профиля:', error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось сохранить изменения",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!token) return;
    try {
      setLoading(true);
      await fetch(AUTH_API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token },
        body: JSON.stringify({ remove_avatar: true }),
      });
      toast({ title: "Аватар убран", description: "Фото перенесено в галерею" });
      await loadProfile();
    } catch {
      toast({ title: "Ошибка", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSetPhotoAsAvatar = async (photoId: number) => {
    if (!token) return;
    try {
      setLoading(true);
      await fetch(`${AUTH_API}?action=photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token },
        body: JSON.stringify({ action: 'set_as_avatar', photo_id: photoId }),
      });
      toast({ title: "Аватар обновлён" });
      await loadProfile();
    } catch {
      toast({ title: "Ошибка", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePhoto = async (photoId: number) => {
    if (!token) return;
    try {
      setLoading(true);
      await fetch(`${AUTH_API}?action=photos&photo_id=${photoId}`, {
        method: 'DELETE',
        headers: { 'X-Auth-Token': token },
      });
      setPhotos(prev => prev.filter(p => p.id !== photoId));
      toast({ title: "Фото удалено" });
    } catch {
      toast({ title: "Ошибка", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadPhoto = async (file: File) => {
    if (!token) return;
    try {
      const uploadResult = await uploadFile(file, { folder: 'photos' });
      if (!uploadResult) throw new Error('Не удалось загрузить фото');

      await fetch(`${AUTH_API}?action=photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token },
        body: JSON.stringify({ action: 'add_photo', photo_url: uploadResult.url }),
      });
      toast({ title: "Фото загружено" });
      await loadProfile();
    } catch {
      toast({ title: "Ошибка загрузки", variant: "destructive" });
    }
  };

  const handleEditFormChange = (field: string, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#1e2332]">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="mb-4">
          <Button
            variant="ghost"
            onClick={() => {
              if (activeTab !== "profile") {
                setActiveTab("profile");
              } else {
                if (window.history.length > 1) { navigate(-1); } else { navigate('/'); }
              }
            }}
            className="text-gray-400 hover:text-white"
          >
            <Icon name="ArrowLeft" className="mr-2" size={20} />
            Назад
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-0">
          <ProfileTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            pendingFriendRequests={pendingFriendRequests}
            vehiclesCount={profileData?.vehicles_count || 0}
          />

          <TabsContent value="profile" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-4">
                <ProfileHeader
                  user={user}
                  profileData={profileData}
                  editForm={editForm}
                  avatarPreview={avatarPreview}
                  isEditing={isEditing}
                  onEdit={() => setIsEditing(true)}
                  onLogout={logout}
                  onAvatarChange={handleAvatarChange}
                  getDefaultAvatar={getDefaultAvatar}
                  organization={profileData?.organization}
                />
                
                <FavoritesSection favorites={favorites} />

                <PhotoGallery
                  photos={photos}
                  onSetAsAvatar={handleSetPhotoAsAvatar}
                  onRemovePhoto={handleRemovePhoto}
                  onRemoveAvatar={handleRemoveAvatar}
                  onUploadPhoto={handleUploadPhoto}
                  currentAvatarUrl={profileData?.profile?.avatar_url}
                  loading={loading}
                  uploading={uploadingMedia}
                />
              </div>

              <div className="space-y-4">
                <ProfileStats
                  profileData={profileData}
                  pendingFriendRequests={pendingFriendRequests}
                  onTabChange={setActiveTab}
                />
                {token && <LinkedAccounts token={token} />}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="garage" className="mt-0">
            <GarageTab />
          </TabsContent>

          <TabsContent value="friends" className="mt-0">
            <FriendsTab />
          </TabsContent>
        </Tabs>

        <ProfileEditModal
          isOpen={isEditing}
          loading={loading}
          uploadingMedia={uploadingMedia}
          editForm={editForm}
          onClose={() => {
            setIsEditing(false);
            setAvatarFile(null);
            setAvatarPreview(null);
          }}
          onSave={handleSaveProfile}
          onChange={handleEditFormChange}
        />
      </div>
    </div>
  );
};

export default Profile;