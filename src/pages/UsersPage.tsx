import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const AUTH_API = 'https://functions.poehali.dev/55efb6f4-b3ab-4ac3-8b19-da9b21b5490e';

interface User {
  id: number;
  name: string;
  username?: string;
  avatar_url?: string;
  location?: string;
  created_at: string;
}

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { token, user: currentUser } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async (search = "") => {
    setLoading(true);
    try {
      const url = search 
        ? `${AUTH_API}?action=public&search=${encodeURIComponent(search)}`
        : `${AUTH_API}?action=public`;
      
      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить пользователей",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addFriend = async (userId: number) => {
    if (!token) {
      toast({
        title: "Требуется авторизация",
        description: "Войдите чтобы добавлять в друзья",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`${AUTH_API}?action=friends`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token,
        },
        body: JSON.stringify({ friend_id: userId }),
      });

      const data = await response.json();
      
      if (response.ok) {
        if (data.message && data.message.includes('ожидаем')) {
          toast({ title: "Заявка уже отправлена", description: "Ожидаем принятие заявки" });
        } else {
          toast({ title: "Заявка отправлена!" });
        }
      } else {
        toast({ title: "Ошибка", description: data.error || "Не удалось отправить заявку", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Ошибка", variant: "destructive" });
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (value.length >= 2 || value.length === 0) {
      loadUsers(value);
    }
  };

  const filteredUsers = users.filter(u => currentUser && u.id !== currentUser.id);

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-6xl">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Link to="/profile">
              <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white px-2">
                <Icon name="ArrowLeft" className="h-4 w-4 mr-1" />
                Назад
              </Button>
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Сообщество</h1>
          <p className="text-zinc-400 text-sm sm:text-base">Найди единомышленников и добавь в друзья</p>
        </div>

        <div className="mb-5">
          <div className="relative">
            <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-zinc-400" />
            <Input
              type="text"
              placeholder="Поиск по имени..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 sm:pl-10 bg-zinc-800 border-zinc-700 text-white h-11 sm:h-12"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Icon name="Loader2" className="h-8 w-8 animate-spin text-accent" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <Icon name="Users" className="h-12 w-12 mx-auto text-zinc-600 mb-3" />
            <p className="text-zinc-400">Пользователи не найдены</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="bg-zinc-800 border border-zinc-700 rounded-lg p-3 sm:p-5 hover:border-accent transition-all"
              >
                {/* Горизонтальный layout на мобилке, вертикальный на десктопе */}
                <Link to={`/user/${user.id}`}>
                  <div className="flex sm:flex-col items-center sm:items-center gap-3 sm:gap-0 mb-3 sm:mb-4 text-left sm:text-center">
                    <div className="w-14 h-14 sm:w-20 sm:h-20 bg-accent rounded-full flex-shrink-0 flex items-center justify-center sm:mb-3 overflow-hidden">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white font-bold text-xl sm:text-2xl">{user.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-base sm:text-lg truncate">{user.name}</h3>
                      {user.username && (
                        <p className="text-sm text-zinc-400 truncate">@{user.username}</p>
                      )}
                      {user.location && (
                        <p className="text-xs text-zinc-500 flex items-center gap-1 mt-1">
                          <Icon name="MapPin" className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{user.location}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
                <div className="flex gap-2">
                  <Link to={`/user/${user.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full border-zinc-700 h-9">
                      Профиль
                    </Button>
                  </Link>
                  {token && (
                    <Button
                      size="sm"
                      onClick={() => addFriend(user.id)}
                      className="bg-accent hover:bg-accent/90 h-9 px-3"
                    >
                      <Icon name="UserPlus" className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};