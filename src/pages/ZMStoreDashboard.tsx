import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Icon from "@/components/ui/icon";

const API = "https://functions.poehali.dev/c79cc1b5-5a45-4360-8054-9dc37d34ea9a";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  inStock: boolean;
  brand: string;
  model: string;
  discount: number;
}

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

const ZMStoreDashboard = () => {
  const navigate = useNavigate();
  const { token, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCEO, setIsCEO] = useState(false);
  const checked = useRef(false);

  useEffect(() => {
    if (authLoading) return;
    if (checked.current) return;
    checked.current = true;
    checkAccess();
  }, [authLoading, token]);

  const h = () => ({ "X-Auth-Token": token || "" });

  const checkAccess = async () => {
    if (!token) { navigate("/"); return; }
    try {
      const res = await fetch(`${API}?action=check-access`, { headers: h() });
      if (!res.ok) { navigate("/"); return; }
      const data = await res.json();
      if (!data.hasAccess) { navigate("/"); return; }
      setIsCEO(data.isCeo);
      await loadProducts();
      if (data.isCeo) await loadSellers();
    } catch {
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    const res = await fetch(API, { headers: h() });
    if (res.ok) { const d = await res.json(); setProducts(d.products || []); }
  };

  const loadSellers = async () => {
    const res = await fetch(`${API}?action=sellers`, { headers: h() });
    if (res.ok) { const d = await res.json(); setSellers(d.sellers || []); }
  };

  const deleteProduct = async (id: number) => {
    if (!confirm("Удалить товар?")) return;
    const res = await fetch(`${API}?id=${id}`, { method: "DELETE", headers: h() });
    if (res.ok) {
      toast({ title: "Товар удалён" });
      setProducts(prev => prev.filter(p => p.id !== id));
    } else {
      toast({ title: "Ошибка удаления", variant: "destructive" });
    }
  };

  const toggleSeller = async (seller: Seller) => {
    const res = await fetch(`${API}?action=sellers`, {
      method: "PUT",
      headers: { ...h(), "Content-Type": "application/json" },
      body: JSON.stringify({ id: seller.id, is_active: !seller.is_active }),
    });
    if (res.ok) {
      toast({ title: seller.is_active ? "Продавец деактивирован" : "Продавец активирован" });
      loadSellers();
    } else {
      toast({ title: "Ошибка", variant: "destructive" });
    }
  };

  const deleteSeller = async (id: number) => {
    if (!confirm("Удалить продавца?")) return;
    const res = await fetch(`${API}?action=sellers&id=${id}`, { method: "DELETE", headers: h() });
    if (res.ok) {
      toast({ title: "Продавец удалён" });
      setSellers(prev => prev.filter(s => s.id !== id));
    } else {
      toast({ title: "Ошибка", variant: "destructive" });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Icon name="Loader2" className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate("/")}>
            <Icon name="ArrowLeft" className="mr-2" size={16} />Назад
          </Button>
          <div>
            <h1 className="text-3xl font-bold">ZM Store</h1>
            <p className="text-muted-foreground text-sm">Панель управления магазином</p>
          </div>
        </div>

        <Tabs defaultValue="products" className="w-full">
          <TabsList className={`grid w-full ${isCEO ? "grid-cols-2" : "grid-cols-1"}`}>
            <TabsTrigger value="products">
              <Icon name="Package" className="mr-2" size={16} />Товары ({products.length})
            </TabsTrigger>
            {isCEO && (
              <TabsTrigger value="sellers">
                <Icon name="Users" className="mr-2" size={16} />Продавцы ({sellers.length})
              </TabsTrigger>
            )}
          </TabsList>

          {/* ТОВАРЫ */}
          <TabsContent value="products" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Товары</CardTitle>
                    <CardDescription>Добавляйте, редактируйте и удаляйте товары магазина</CardDescription>
                  </div>
                  <Button onClick={() => navigate("/zm-store/product/new")}>
                    <Icon name="Plus" className="mr-2" size={16} />Добавить товар
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {products.length === 0 ? (
                  <div className="text-center py-12">
                    <Icon name="Package" className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">Нет товаров. Добавьте первый!</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {products.map((p) => (
                      <div key={p.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/5 transition-colors">
                        <div className="relative flex-shrink-0">
                          {p.image ? (
                            <img src={p.image} alt={p.name} className="w-16 h-16 object-cover rounded-md" />
                          ) : (
                            <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                              <Icon name="Package" size={24} className="text-muted-foreground" />
                            </div>
                          )}
                          {p.discount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                              -{p.discount}%
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold truncate">{p.name}</h3>
                            <Badge variant={p.inStock ? "default" : "secondary"} className="text-xs">
                              {p.inStock ? "В наличии" : "Нет в наличии"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{p.brand} {p.model}</p>
                          <div className="flex items-center gap-3 mt-1">
                            {p.discount > 0 ? (
                              <>
                                <span className="font-bold text-red-500">
                                  {Math.round(Number(p.price) * (1 - p.discount / 100)).toLocaleString("ru-RU")} ₽
                                </span>
                                <span className="text-xs text-muted-foreground line-through">
                                  {Number(p.price).toLocaleString("ru-RU")} ₽
                                </span>
                              </>
                            ) : (
                              <span className="font-bold text-accent">{Number(p.price).toLocaleString("ru-RU")} ₽</span>
                            )}
                            {p.category && <span className="text-xs bg-secondary px-2 py-0.5 rounded">{p.category}</span>}
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button variant="outline" size="sm" onClick={() => navigate(`/zm-store/product/${p.id}`)}>
                            <Icon name="Edit" size={14} />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => deleteProduct(p.id)} className="text-red-500 hover:text-red-600">
                            <Icon name="Trash2" size={14} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ПРОДАВЦЫ (только CEO) */}
          {isCEO && (
            <TabsContent value="sellers" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Продавцы</CardTitle>
                      <CardDescription>Управляйте доступом продавцов к магазину</CardDescription>
                    </div>
                    <Button onClick={() => navigate("/zm-store/seller/new")}>
                      <Icon name="Plus" className="mr-2" size={16} />Добавить продавца
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {sellers.length === 0 ? (
                    <div className="text-center py-12">
                      <Icon name="Users" className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">Нет продавцов</p>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {sellers.map((s) => (
                        <div key={s.id} className="flex items-center gap-4 p-4 border rounded-lg">
                          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                            <Icon name="User" size={18} className="text-accent" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{s.full_name}</span>
                              <Badge variant={s.is_active ? "default" : "secondary"} className="text-xs">
                                {s.is_active ? "Активен" : "Деактивирован"}
                              </Badge>
                              <Badge variant="outline" className="text-xs">{s.role}</Badge>
                            </div>
                            {s.telegram_id && (
                              <p className="text-sm text-muted-foreground">TG: {s.telegram_id}</p>
                            )}
                            {s.email && <p className="text-xs text-muted-foreground">{s.email}</p>}
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <Button variant="outline" size="sm" onClick={() => toggleSeller(s)}>
                              {s.is_active ? <Icon name="UserX" size={14} /> : <Icon name="UserCheck" size={14} />}
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
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default ZMStoreDashboard;