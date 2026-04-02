import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useUserProfileModal } from "@/hooks/useUserProfileModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ADMIN_API = 'https://functions.poehali.dev/f34bd996-f5f2-4c81-8b7b-fb5621187a7f';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  is_organization?: boolean;
  created_at: string;
  telegram_id?: number;
  username?: string;
  phone?: string;
  location?: string;
}

export const UsersTab: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { token } = useAuth();
  const { toast } = useToast();
  const { open: openProfile, modal: profileModal } = useUserProfileModal();

  useEffect(() => {
    if (token) {
      loadUsers();
    }
  }, [token]);

  const loadUsers = async () => {
    console.log('[UsersTab] loadUsers called, token:', token ? 'exists' : 'null');
    if (!token) {
      console.log('[UsersTab] No token, skipping load');
      return;
    }

    setLoading(true);
    console.log('[UsersTab] Fetching from:', ADMIN_API);
    console.log('[UsersTab] Token value (first 20 chars):', token?.substring(0, 20) + '...');
    const headers = { 'X-Auth-Token': token };
    console.log('[UsersTab] Sending headers:', Object.keys(headers));
    try {
      const response = await fetch(ADMIN_API, {
        headers,
      });
      console.log('[UsersTab] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('[UsersTab] Got users:', data.users?.length || 0);
        setUsers(data.users);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('[UsersTab] Error response:', response.status, errorData);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить пользователей: " + (errorData.error || response.statusText),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось подключиться к серверу",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: number, newRole: string) => {
    if (!token) return;

    try {
      const response = await fetch(ADMIN_API, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token,
        },
        body: JSON.stringify({
          user_id: userId,
          role: newRole,
        }),
      });

      if (response.ok) {
        toast({
          title: "Роль обновлена",
          description: `Пользователь теперь ${newRole}`,
        });
        loadUsers();
      } else {
        toast({
          title: "Ошибка",
          description: "Не удалось обновить роль",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось подключиться к серверу",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'moderator':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Администратор';
      case 'moderator':
        return 'Модератор';
      default:
        return 'Пользователь';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Icon name="Loader2" className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">Пользователи</h3>
          <p className="text-zinc-400">Всего: {users.length}</p>
        </div>
        <Button onClick={loadUsers} variant="outline" className="border-zinc-700">
          <Icon name="RefreshCw" className="h-4 w-4 mr-2" />
          Обновить
        </Button>
      </div>

      <div className="relative">
        <Icon name="Search" className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <Input
          type="text"
          placeholder="Поиск по имени, email или username..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-zinc-800 border-zinc-700 text-white"
        />
      </div>

      <div className="grid gap-4">
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 hover:border-accent transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <button
                      onClick={() => openProfile(user.id)}
                      className="text-white font-semibold hover:text-accent transition-colors"
                    >
                      {user.name}
                    </button>
                    <p className="text-sm text-zinc-400">{user.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                  {user.telegram_id && (
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Icon name="Send" className="h-3 w-3" />
                      <span>Telegram ID: {user.telegram_id}</span>
                    </div>
                  )}
                  {user.username && (
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Icon name="AtSign" className="h-3 w-3" />
                      <span>@{user.username}</span>
                    </div>
                  )}
                  {user.phone && (
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Icon name="Phone" className="h-3 w-3" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                  {user.location && (
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Icon name="MapPin" className="h-3 w-3" />
                      <span>{user.location}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <Icon name="Calendar" className="h-3 w-3 text-zinc-400" />
                  <span className="text-xs text-zinc-400">
                    Зарегистрирован: {new Date(user.created_at).toLocaleDateString('ru-RU')}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-3">
                <div className="flex items-center gap-2">
                  {user.is_organization && (
                    <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs">
                      🏢 Организация
                    </Badge>
                  )}
                  <Badge className={getRoleBadgeColor(user.role)}>
                    {getRoleLabel(user.role)}
                  </Badge>
                </div>

                {user.name === 'Anton' ? (
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <Icon name="Shield" className="h-3 w-3" />
                    <span>Главный администратор</span>
                  </div>
                ) : (
                  <Select
                    value={user.role}
                    onValueChange={(value) => updateUserRole(user.id, value)}
                  >
                    <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700">
                      <SelectItem value="user">Пользователь</SelectItem>
                      <SelectItem value="moderator">Модератор</SelectItem>
                      <SelectItem value="admin">Администратор</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <Icon name="Users" className="h-16 w-16 mx-auto text-zinc-600 mb-4" />
          <p className="text-zinc-400">Пользователи не найдены</p>
        </div>
      )}
      {profileModal}
    </div>
  );
};