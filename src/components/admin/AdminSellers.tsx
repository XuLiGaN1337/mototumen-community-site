import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import Icon from '@/components/ui/icon';

const ZM_API = 'https://functions.poehali.dev/c79cc1b5-5a45-4360-8054-9dc37d34ea9a';
const ADMIN_API = 'https://functions.poehali.dev/f34bd996-f5f2-4c81-8b7b-fb5621187a7f';

interface Seller {
  id: number;
  user_id: string;
  telegram_id: string;
  full_name: string;
  role: string;
  is_active: boolean;
  assigned_at: string;
  user_name?: string;
  email?: string;
}

interface User {
  id: number;
  name: string;
  username?: string;
  email?: string;
}

export const AdminSellers = () => {
  const { token } = useAuth();
  const { toast } = useToast();

  const [sellers, setSellers] = useState<Seller[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [telegramId, setTelegramId] = useState('');
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAll(); }, []);

  const h = () => ({ 'X-Auth-Token': token || '' });

  const loadAll = async () => {
    setLoading(true);
    try {
      const [sellersRes, usersRes] = await Promise.all([
        fetch(`${ZM_API}?action=sellers`, { headers: h() }),
        fetch(`${ADMIN_API}?action=users`, { headers: h() }),
      ]);
      if (sellersRes.ok) { const d = await sellersRes.json(); setSellers(d.sellers || []); }
      if (usersRes.ok) { const d = await usersRes.json(); setUsers(d.users || []); }
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!selectedUser) {
      toast({ title: 'Выберите пользователя', variant: 'destructive' });
      return;
    }
    setAdding(true);
    try {
      const res = await fetch(`${ZM_API}?action=sellers`, {
        method: 'POST',
        headers: { ...h(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: String(selectedUser.id),
          full_name: selectedUser.name || selectedUser.username || `Пользователь #${selectedUser.id}`,
          telegram_id: telegramId.trim(),
          role: 'seller',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Продавец добавлен' });
        setSelectedUser(null);
        setSearch('');
        setTelegramId('');
        loadAll();
      } else {
        toast({ title: data.error || 'Ошибка', variant: 'destructive' });
      }
    } finally {
      setAdding(false);
    }
  };

  const toggleSeller = async (s: Seller) => {
    const res = await fetch(`${ZM_API}?action=sellers`, {
      method: 'PUT',
      headers: { ...h(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: s.id, is_active: !s.is_active }),
    });
    if (res.ok) {
      toast({ title: s.is_active ? 'Деактивирован' : 'Активирован' });
      loadAll();
    }
  };

  const deleteSeller = async (id: number) => {
    if (!confirm('Удалить продавца?')) return;
    const res = await fetch(`${ZM_API}?action=sellers&id=${id}`, { method: 'DELETE', headers: h() });
    if (res.ok) { toast({ title: 'Удалён' }); setSellers(prev => prev.filter(s => s.id !== id)); }
  };

  const sellerIds = new Set(sellers.map(s => s.user_id));
  const filteredUsers = search.length >= 1
    ? users.filter(u =>
        (u.name?.toLowerCase().includes(search.toLowerCase()) ||
         u.username?.toLowerCase().includes(search.toLowerCase()) ||
         String(u.id).includes(search)) &&
        !sellerIds.has(String(u.id))
      ).slice(0, 8)
    : [];

  return (
    <div className="space-y-6">
      {/* Добавить продавца */}
      <Card>
        <CardHeader>
          <CardTitle>Назначить продавца ZM Store</CardTitle>
          <CardDescription>Выберите пользователя из системы — он получит доступ к /zm-store</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Поиск пользователя</label>
            {selectedUser ? (
              <div className="flex items-center gap-3 p-3 border rounded-lg bg-accent/10">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                  <Icon name="User" size={14} className="text-accent" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{selectedUser.name || selectedUser.username}</p>
                  <p className="text-xs text-muted-foreground">ID: {selectedUser.id} {selectedUser.email ? `· ${selectedUser.email}` : ''}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setSelectedUser(null); setSearch(''); }}>
                  <Icon name="X" size={14} />
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Input
                  placeholder="Введите имя или ID..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                {filteredUsers.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-52 overflow-y-auto">
                    {filteredUsers.map(u => (
                      <div key={u.id}
                        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-accent/10 transition-colors"
                        onClick={() => { setSelectedUser(u); setSearch(''); }}
                      >
                        <span className="text-xs text-muted-foreground w-6 text-right">#{u.id}</span>
                        <span className="font-medium text-sm">{u.name || u.username}</span>
                        {u.email && <span className="text-xs text-muted-foreground ml-auto">{u.email}</span>}
                      </div>
                    ))}
                  </div>
                )}
                {search.length >= 1 && filteredUsers.length === 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-background border rounded-lg p-3 text-sm text-muted-foreground">
                    Не найдено
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Telegram ID (необязательно)</label>
            <Input placeholder="573967828" value={telegramId} onChange={e => setTelegramId(e.target.value)} />
          </div>

          <Button onClick={handleAdd} disabled={adding || !selectedUser} className="w-full">
            {adding
              ? <><Icon name="Loader2" size={14} className="animate-spin mr-2" />Добавление...</>
              : <><Icon name="UserPlus" size={14} className="mr-2" />Назначить продавцом ZM Store</>
            }
          </Button>
        </CardContent>
      </Card>

      {/* Список продавцов */}
      <Card>
        <CardHeader>
          <CardTitle>Продавцы ZM Store ({sellers.length})</CardTitle>
          <CardDescription>Управление доступом к панели магазина</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Icon name="Loader2" size={24} className="animate-spin text-muted-foreground" />
            </div>
          ) : sellers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Icon name="Users" size={32} className="mx-auto mb-2 opacity-40" />
              <p>Нет назначенных продавцов</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sellers.map(s => (
                <div key={s.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Icon name="User" size={16} className="text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{s.full_name}</span>
                      <Badge variant={s.is_active ? 'default' : 'secondary'} className="text-xs">
                        {s.is_active ? 'Активен' : 'Деактивирован'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">{s.role}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      ID: {s.user_id}{s.telegram_id ? ` · TG: ${s.telegram_id}` : ''}
                      {s.email ? ` · ${s.email}` : ''}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button variant="outline" size="sm" onClick={() => toggleSeller(s)} title={s.is_active ? 'Деактивировать' : 'Активировать'}>
                      <Icon name={s.is_active ? 'UserX' : 'UserCheck'} size={14} />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => deleteSeller(s.id)} className="text-red-500 hover:text-red-600">
                      <Icon name="Trash2" size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Подсказка */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-1.5 text-sm text-muted-foreground">
            <p>• Продавец получает доступ к <strong>/zm-store</strong> — добавление/редактирование/удаление товаров</p>
            <p>• CEO видит вкладку «Продавцы» в /zm-store и может управлять ими там же</p>
            <p>• Деактивированный продавец теряет доступ, но запись сохраняется</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
