import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

interface Seller {
  user_id: number;
  username: string;
  shop_name: string;
  assigned_at: string;
}

interface Shop {
  id: number;
  name: string;
}

interface User {
  id: number;
  username: string;
}

const SELLER_API = 'https://functions.poehali.dev/666032b0-b3d7-497e-989d-cf5ac4db059a';

export const AdminSellers = ({ token, userId }: { token: string; userId: number }) => {
  const { toast } = useToast();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedShop, setSelectedShop] = useState<number>(0);
  const [selectedUser, setSelectedUser] = useState<number>(0);
  const [searchUser, setSearchUser] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Загружаем магазины
      const shopsRes = await fetch('https://functions.poehali.dev/5b8dbbf1-556a-43c8-b39c-e8096eebd5d4?action=get-shops');
      const shopsData = await shopsRes.json();
      setShops(shopsData.shops || []);

      // Загружаем пользователей
      const usersRes = await fetch('https://functions.poehali.dev/f34bd996-f5f2-4c81-8b7b-fb5621187a7f?action=users', {
        headers: { 'X-Auth-Token': token }
      });
      const usersData = await usersRes.json();
      setUsers(usersData.users || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleAssignSeller = async () => {
    if (!selectedShop || !selectedUser) {
      toast({
        title: 'Ошибка',
        description: 'Выберите магазин и пользователя',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${SELLER_API}?action=assign-seller&user_id=${userId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            seller_user_id: selectedUser,
            shop_id: selectedShop
          })
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Успешно',
          description: 'Продавец назначен'
        });
        setSelectedShop(0);
        setSelectedUser(0);
        setSearchUser('');
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось назначить продавца',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось назначить продавца',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchUser.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">Назначить продавца</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Магазин</label>
            <select
              className="w-full p-2 border rounded"
              value={selectedShop}
              onChange={(e) => setSelectedShop(Number(e.target.value))}
            >
              <option value={0}>Выберите магазин</option>
              {shops.map(shop => (
                <option key={shop.id} value={shop.id}>
                  {shop.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Поиск пользователя</label>
            <Input
              placeholder="Введите имя пользователя"
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
            />
          </div>

          {searchUser && (
            <div className="max-h-48 overflow-y-auto border rounded">
              {filteredUsers.map(user => (
                <div
                  key={user.id}
                  className={`p-3 cursor-pointer hover:bg-gray-100 ${
                    selectedUser === user.id ? 'bg-blue-100' : ''
                  }`}
                  onClick={() => setSelectedUser(user.id)}
                >
                  {user.username}
                </div>
              ))}
            </div>
          )}

          <Button
            onClick={handleAssignSeller}
            disabled={loading || !selectedShop || !selectedUser}
            className="w-full"
          >
            <Icon name="UserPlus" className="mr-2 w-4 h-4" />
            Назначить продавца
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4">Информация</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>• Только CEO может назначать продавцов</p>
          <p>• Продавец получит доступ к управлению товарами своего магазина</p>
          <p>• Доступ к кабинету продавца: /seller</p>
          <p>• Магазин ZM Store для мотозапчастей и аксессуаров</p>
        </div>
      </Card>
    </div>
  );
};