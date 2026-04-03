import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import Icon from "@/components/ui/icon";

const API = "https://functions.poehali.dev/c79cc1b5-5a45-4360-8054-9dc37d34ea9a";

const ZMStoreSellerAdd = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    user_id: "",
    full_name: "",
    telegram_id: "",
    role: "seller",
  });

  const handleAdd = async () => {
    if (!form.user_id.trim() || !form.full_name.trim()) {
      toast({ title: "Заполните ID пользователя и имя", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}?action=sellers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Auth-Token": token || "" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast({ title: "Продавец добавлен" });
        navigate("/zm-store");
      } else {
        const data = await res.json();
        toast({ title: data.error || "Ошибка добавления", variant: "destructive" });
      }
    } catch {
      toast({ title: "Ошибка", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate("/zm-store")}>
            <Icon name="ArrowLeft" className="mr-2" size={16} />Назад
          </Button>
          <h1 className="text-3xl font-bold">Добавить продавца</h1>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Данные продавца</CardTitle>
              <CardDescription>
                Укажите ID пользователя из системы (числовой ID из профиля)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user_id">ID пользователя *</Label>
                <Input
                  id="user_id"
                  value={form.user_id}
                  onChange={e => setForm({ ...form, user_id: e.target.value })}
                  placeholder="Числовой ID из профиля (например: 5)"
                  type="text"
                />
                <p className="text-xs text-muted-foreground">
                  Найдите пользователя в панели администратора → Пользователи и скопируйте его ID
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_name">Полное имя *</Label>
                <Input
                  id="full_name"
                  value={form.full_name}
                  onChange={e => setForm({ ...form, full_name: e.target.value })}
                  placeholder="Иван Иванов"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telegram_id">Telegram ID (необязательно)</Label>
                <Input
                  id="telegram_id"
                  value={form.telegram_id}
                  onChange={e => setForm({ ...form, telegram_id: e.target.value })}
                  placeholder="573967828"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Роль</Label>
                <Select value={form.role} onValueChange={v => setForm({ ...form, role: v })}>
                  <SelectTrigger id="role"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seller">Продавец</SelectItem>
                    <SelectItem value="manager">Менеджер</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="p-4 bg-muted rounded-lg space-y-2 mb-4">
                <p className="text-sm font-medium">Права продавца:</p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Добавление и редактирование товаров</li>
                  <li>• Удаление товаров</li>
                  <li>• Управление наличием и ценами</li>
                  <li>• Доступ к панели ZM Store</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleAdd} disabled={loading} className="flex-1">
                  {loading
                    ? <><Icon name="Loader2" size={16} className="animate-spin mr-2" />Добавление...</>
                    : <><Icon name="UserPlus" size={16} className="mr-2" />Назначить продавцом</>
                  }
                </Button>
                <Button variant="outline" onClick={() => navigate("/zm-store")}>Отмена</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ZMStoreSellerAdd;
