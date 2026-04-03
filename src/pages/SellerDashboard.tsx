import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import Navigation from '@/components/Navigation';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  in_stock: boolean;
  brand: string;
  model: string;
  stock_quantity: number;
}

interface Shop {
  id: number;
  name: string;
}

const SellerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    category: '',
    brand: '',
    model: '',
    in_stock: true,
    stock_quantity: 0,
  });

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    loadSellerData();
  }, [user]);

  const loadSellerData = async () => {
    try {
      const response = await fetch(`https://functions.poehali.dev/666032b0-b3d7-497e-989d-cf5ac4db059a?action=seller-info&user_id=${user?.id}`);
      const data = await response.json();
      
      if (!data.shop) {
        toast({
          title: 'Доступ запрещен',
          description: 'У вас нет прав продавца',
          variant: 'destructive'
        });
        navigate('/');
        return;
      }
      
      setShop(data.shop);
      setProducts(data.products || []);
    } catch (error) {
      toast({
        title: 'Ошибка загрузки',
        description: 'Не удалось загрузить данные',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProduct = async () => {
    if (!formData.name || !formData.price) {
      toast({
        title: 'Ошибка',
        description: 'Заполните название и цену',
        variant: 'destructive'
      });
      return;
    }

    try {
      const action = editingProduct ? 'update-product' : 'add-product';
      const method = editingProduct ? 'PUT' : 'POST';
      const url = editingProduct
        ? `https://functions.poehali.dev/666032b0-b3d7-497e-989d-cf5ac4db059a?action=${action}&user_id=${user?.id}&product_id=${editingProduct.id}`
        : `https://functions.poehali.dev/666032b0-b3d7-497e-989d-cf5ac4db059a?action=${action}&user_id=${user?.id}`;
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          shop_id: shop?.id
        })
      });

      if (response.ok) {
        toast({
          title: 'Успешно',
          description: editingProduct ? 'Товар обновлен' : 'Товар добавлен'
        });
        loadSellerData();
        resetForm();
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить товар',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm('Удалить товар?')) return;

    try {
      const response = await fetch(
        `https://functions.poehali.dev/666032b0-b3d7-497e-989d-cf5ac4db059a?action=delete-product&user_id=${user?.id}&product_id=${productId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        toast({ title: 'Товар удален' });
        loadSellerData();
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить товар',
        variant: 'destructive'
      });
    }
  };

  const startEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      image_url: product.image_url || '',
      category: product.category || '',
      brand: product.brand || '',
      model: product.model || '',
      in_stock: product.in_stock,
      stock_quantity: product.stock_quantity || 0,
    });
    setIsAddingNew(false);
  };

  const resetForm = () => {
    setEditingProduct(null);
    setIsAddingNew(false);
    setFormData({
      name: '',
      description: '',
      price: '',
      image_url: '',
      category: '',
      brand: '',
      model: '',
      in_stock: true,
      stock_quantity: 0,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Загрузка...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Кабинет продавца: {shop?.name}</h1>
          <Button onClick={() => setIsAddingNew(true)}>
            <Icon name="Plus" className="mr-2" />
            Добавить товар
          </Button>
        </div>

        {(isAddingNew || editingProduct) && (
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">
              {editingProduct ? 'Редактировать товар' : 'Новый товар'}
            </h2>
            <div className="grid gap-4">
              <Input
                placeholder="Название"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <Textarea
                placeholder="Описание"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Цена"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
              <Input
                placeholder="URL изображения"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              />
              <Input
                placeholder="Категория"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
              <Input
                placeholder="Бренд"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              />
              <Input
                placeholder="Модель"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              />
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.in_stock}
                    onChange={(e) => setFormData({ ...formData, in_stock: e.target.checked })}
                  />
                  В наличии
                </label>
                <div className="flex items-center gap-2 flex-1">
                  <label className="text-sm text-muted-foreground whitespace-nowrap">Кол-во (шт.):</label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: Math.max(0, parseInt(e.target.value) || 0) })}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveProduct}>Сохранить</Button>
                <Button variant="outline" onClick={resetForm}>Отмена</Button>
              </div>
            </div>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Card key={product.id} className="p-4">
              {product.image_url && (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded mb-4"
                />
              )}
              <h3 className="font-bold text-lg mb-2">{product.name}</h3>
              <p className="text-sm text-muted-foreground mb-2">{product.description}</p>
              <p className="text-xl font-bold mb-2">{product.price} ₽</p>
              <div className="flex gap-2 text-sm mb-2 flex-wrap">
                {product.brand && <span className="text-muted-foreground">{product.brand}</span>}
                {product.model && <span className="text-muted-foreground">{product.model}</span>}
              </div>
              <div className="flex items-center gap-2 mb-4 text-sm">
                <span className={product.in_stock ? "text-green-600 font-medium" : "text-red-500"}>
                  {product.in_stock ? "В наличии" : "Нет в наличии"}
                </span>
                {product.stock_quantity > 0 && (
                  <span className="text-muted-foreground">— {product.stock_quantity} шт.</span>
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => startEdit(product)}>
                  <Icon name="Pencil" className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDeleteProduct(product.id)}
                >
                  <Icon name="Trash2" className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {products.length === 0 && !isAddingNew && (
          <div className="text-center py-12 text-muted-foreground">
            Нет товаров. Добавьте первый товар.
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerDashboard;