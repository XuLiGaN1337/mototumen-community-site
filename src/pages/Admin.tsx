import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import Icon from "@/components/ui/icon";
import { AdminModeration } from "@/components/admin/AdminModeration";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { AdminContent } from "@/components/admin/AdminContent";
import { getRoleEmoji, getRoleLabel } from "@/components/admin/RoleBadge";
import { AdminPasswordSetup } from "@/components/admin/AdminPasswordSetup";
import { AdminPasswordVerify } from "@/components/admin/AdminPasswordVerify";
import { AdminPasswordSettings } from "@/components/admin/AdminPasswordSettings";
import { AdminSellers } from "@/components/admin/AdminSellers";
import AdminSeasons from "@/components/admin/AdminSeasons";
import { FiltersTab } from "@/components/admin/tabs/FiltersTab";

const ADMIN_API = 'https://functions.poehali.dev/f34bd996-f5f2-4c81-8b7b-fb5621187a7f';

const Admin = () => {
  const { user, isAdmin, token, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [pendingItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      setHasPassword(false);
      return;
    }
    const checkPassword = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(`${ADMIN_API}?action=my-admin-password-status`, {
          headers: { 'X-Auth-Token': token },
          signal: controller.signal,
        });
        clearTimeout(timeout);
        const data = await res.json();
        setHasPassword(res.ok ? Boolean(data.hasPassword) : false);
      } catch (error) {
        console.error('[ADMIN] Failed to check password status:', error);
        setHasPassword(false);
      }
    };
    checkPassword();
  }, [token, authLoading]);

  useEffect(() => {
    if (!isAdmin || !token || hasPassword === null || (hasPassword && !isPasswordVerified)) return;

    const fetchData = async () => {
      try {
        const statsRes = await fetch(`${ADMIN_API}?action=stats`, {
          headers: { 'X-Auth-Token': token }
        });
        const statsData = await statsRes.json();
        setStats(statsData.stats);
        setRecentActivity(statsData.recent_activity || []);

        const usersRes = await fetch(`${ADMIN_API}?action=users`, {
          headers: { 'X-Auth-Token': token }
        });
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);
      } catch (error) {
        console.error('Failed to fetch admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [isAdmin, token, hasPassword, isPasswordVerified]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004488]"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (hasPassword === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004488] mx-auto mb-4"></div>
          <p className="text-gray-400">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!hasPassword) {
    return (
      <AdminPasswordSetup
        onPasswordSet={() => {
          setHasPassword(true);
          setIsPasswordVerified(true);
        }}
        adminApi={ADMIN_API}
        token={token || ''}
      />
    );
  }

  if (hasPassword && !isPasswordVerified) {
    return (
      <AdminPasswordVerify
        onVerified={() => setIsPasswordVerified(true)}
        onPasswordReset={() => {
          setHasPassword(true);
          setIsPasswordVerified(true);
        }}
        adminApi={ADMIN_API}
        token={token || ''}
        userName={user?.name}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004488] mx-auto mb-4"></div>
          <p className="text-gray-400">Загрузка...</p>
        </div>
      </div>
    );
  }

  const handleApprove = (id: string) => {
    console.log("Approve item:", id);
  };

  const handleReject = (id: string) => {
    console.log("Reject item:", id);
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      const res = await fetch(ADMIN_API, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token || ''
        },
        body: JSON.stringify({ user_id: userId, role: newRole })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setUsers(users.map(u => 
          u.id === userId ? { ...u, role: newRole } : u
        ));
      } else {
        alert(data.error || 'Ошибка при изменении роли');
      }
    } catch (error) {
      console.error('Failed to update role:', error);
      alert('Не удалось изменить роль');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Точно удалить этого пользователя?')) return;
    
    try {
      const res = await fetch(ADMIN_API, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token || ''
        },
        body: JSON.stringify({ user_id: userId })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setUsers(users.filter(u => u.id !== userId));
      } else {
        alert(data.error || 'Ошибка при удалении');
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Не удалось удалить пользователя');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-2 md:px-4 py-4 md:py-8">
        <div className="flex items-center justify-between mb-6 md:mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-2 md:gap-4">
            <Button
              variant="ghost"
              onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')}
              className="hover:bg-primary/10"
            >
              <Icon name="ArrowLeft" className="h-4 w-4 md:h-5 md:w-5 md:mr-2" />
              <span className="hidden md:inline">Назад</span>
            </Button>
            <h1
              className="text-2xl md:text-4xl font-bold"
              style={{ fontFamily: "Oswald, sans-serif" }}
            >
              Админка
            </h1>
          </div>
          <Badge className="bg-red-500 text-white text-sm md:text-base">
            {getRoleEmoji(user?.role || 'admin')} {getRoleLabel(user?.role || 'admin')}
          </Badge>
        </div>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-4 md:grid-cols-8 gap-1 bg-background mb-8">
            <TabsTrigger value="dashboard" className="flex flex-col gap-0.5 h-auto py-2">
              <span className="text-lg leading-none">📊</span>
              <span className="text-[10px] md:text-xs leading-tight">Дашборд</span>
            </TabsTrigger>
            <TabsTrigger value="organizations" className="flex flex-col gap-0.5 h-auto py-2">
              <span className="text-lg leading-none">📋</span>
              <span className="text-[10px] md:text-xs leading-tight">Заявки</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex flex-col gap-0.5 h-auto py-2">
              <span className="text-lg leading-none">👥</span>
              <span className="text-[10px] md:text-xs leading-tight">Юзеры</span>
            </TabsTrigger>
            <TabsTrigger value="content" className="flex flex-col gap-0.5 h-auto py-2">
              <span className="text-lg leading-none">📝</span>
              <span className="text-[10px] md:text-xs leading-tight">Контент</span>
            </TabsTrigger>
            <TabsTrigger value="sellers" className="flex flex-col gap-0.5 h-auto py-2">
              <span className="text-lg leading-none">🛒</span>
              <span className="text-[10px] md:text-xs leading-tight">Продавцы</span>
            </TabsTrigger>
            <TabsTrigger value="moderation" className="flex flex-col gap-0.5 h-auto py-2">
              <span className="text-lg leading-none">🔍</span>
              <span className="text-[10px] md:text-xs leading-tight">Модерация</span>
            </TabsTrigger>
            <TabsTrigger value="seasons" className="flex flex-col gap-0.5 h-auto py-2">
              <span className="text-lg leading-none">🍁</span>
              <span className="text-[10px] md:text-xs leading-tight">Сезоны</span>
            </TabsTrigger>
            <TabsTrigger value="filters" className="flex flex-col gap-0.5 h-auto py-2">
              <span className="text-lg leading-none">🏷️</span>
              <span className="text-[10px] md:text-xs leading-tight">Фильтры</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <AdminDashboard stats={stats} recentActivity={recentActivity} />
            {user?.role === 'ceo' && (
              <AdminPasswordSettings
                adminApi={ADMIN_API}
                users={users}
                onPasswordReset={async () => {
                  const usersRes = await fetch(`${ADMIN_API}?action=users`, {
                    headers: { 'X-Auth-Token': token || '' }
                  });
                  const usersData = await usersRes.json();
                  setUsers(usersData.users || []);
                }}
              />
            )}
          </TabsContent>

          <TabsContent value="organizations" className="space-y-6">
            <AdminModeration 
              pendingItems={pendingItems} 
              onApprove={handleApprove} 
              onReject={handleReject} 
            />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <AdminUsers users={users} currentUserRole={user?.role} onRoleChange={handleRoleChange} onDeleteUser={handleDeleteUser} />
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <AdminContent stats={stats} />
          </TabsContent>

          <TabsContent value="moderation" className="space-y-6">
            <div className="text-center py-12 text-muted-foreground">
              Модерация контента в разработке
            </div>
          </TabsContent>

          <TabsContent value="seasons" className="space-y-6">
            <AdminSeasons />
          </TabsContent>

          <TabsContent value="filters" className="space-y-6">
            <FiltersTab />
          </TabsContent>


        </Tabs>
      </div>
    </div>
  );
};

export default Admin;