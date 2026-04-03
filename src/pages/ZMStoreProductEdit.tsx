import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useMediaUpload } from "@/hooks/useMediaUpload";
import Icon from "@/components/ui/icon";

const API = "https://functions.poehali.dev/c79cc1b5-5a45-4360-8054-9dc37d34ea9a";

const CATEGORIES = [
  "Масла и смазки", "Тормозная система", "Привод", "Система впуска",
  "Подвеска", "Электрика", "Экипировка", "Запчасти", "Аксессуары", "Другое",
];

interface ProductForm {
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  inStock: boolean;
  brand: string;
  model: string;
}

const ZMStoreProductEdit = () => {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const { token } = useAuth();
  const { toast } = useToast();
  const { uploadFile, uploading } = useMediaUpload();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>({
    name: "", description: "", price: 0, image: "",
    category: CATEGORIES[0], inStock: true, brand: "", model: "",
  });

  const isEdit = productId && productId !== "new";

  useEffect(() => {
    if (isEdit) loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}?id=${productId}`, { headers: { "X-Auth-Token": token } });
      if (res.ok) {
        const data = await res.json();
        const p = data.product;
        if (p) {
          setForm({
            name: p.name || "", description: p.description || "",
            price: p.price || 0, image: p.image || "",
            category: p.category || CATEGORIES[0],
            inStock: p.inStock ?? true, brand: p.brand || "", model: p.model || "",
          });
          if (p.image) setImagePreview(p.image);
        }
      } else {
        toast({ title: "Товар не найден", variant: "destructive" });
        navigate("/zm-store");
      }
    } catch {
      toast({ title: "Ошибка загрузки", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    const result = await uploadFile(file, { folder: "zm-store" });
    if (result) {
      setForm(prev => ({ ...prev, image: result.url }));
      toast({ title: "Фото загружено" });
    } else {
      toast({ title: "Ошибка загрузки фото", variant: "destructive" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || form.price <= 0) {
      toast({ title: "Заполните название и цену", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const method = isEdit ? "PUT" : "POST";
      const url = isEdit ? `${API}?id=${productId}` : API;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", "X-Auth-Token": token || "" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast({ title: isEdit ? "Товар обновлён" : "Товар добавлен" });
        navigate("/zm-store");
      } else {
        const err = await res.json();
        toast({ title: err.error || "Ошибка сохранения", variant: "destructive" });
      }
    } catch {
      toast({ title: "Ошибка", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate("/zm-store")}>
            <Icon name="ArrowLeft" className="mr-2" size={16} />Назад
          </Button>
          <h1 className="text-3xl font-bold">{isEdit ? "Редактировать товар" : "Добавить товар"}</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Основная информация */}
            <Card>
              <CardHeader>
                <CardTitle>Основная информация</CardTitle>
                <CardDescription>Название, бренд, модель и цена</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Название *</Label>
                  <Input id="name" value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Масло моторное 10W-40" required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brand">Бренд</Label>
                    <Input id="brand" value={form.brand}
                      onChange={e => setForm({ ...form, brand: e.target.value })}
                      placeholder="Motul" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Артикул / Модель</Label>
                    <Input id="model" value={form.model}
                      onChange={e => setForm({ ...form, model: e.target.value })}
                      placeholder="7100 4T" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Описание</Label>
                  <Textarea id="description" value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="Подробное описание товара..." rows={4} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Цена (₽) *</Label>
                    <Input id="price" type="number" value={form.price}
                      onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                      placeholder="2500" min="0" step="1" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Категория</Label>
                    <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                      <SelectTrigger id="category"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Switch id="inStock" checked={form.inStock}
                    onCheckedChange={v => setForm({ ...form, inStock: v })} />
                  <Label htmlFor="inStock" className="cursor-pointer">
                    {form.inStock ? "В наличии" : "Нет в наличии"}
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Фото и превью */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Фотография</CardTitle>
                  <CardDescription>Загрузите фото или вставьте URL</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Превью */}
                  <div className="w-full aspect-square rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                    {imagePreview || form.image ? (
                      <img src={imagePreview || form.image} alt="preview"
                        className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <Icon name="ImagePlus" size={40} className="mx-auto mb-2" />
                        <p className="text-sm">Нет фото</p>
                      </div>
                    )}
                  </div>

                  {/* Загрузка файла */}
                  <label className={`flex items-center justify-center gap-2 w-full h-10 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/5 transition-colors ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
                    {uploading
                      ? <><Icon name="Loader2" size={16} className="animate-spin" /> Загрузка...</>
                      : <><Icon name="Upload" size={16} /> Загрузить фото</>
                    }
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageFile} disabled={uploading} />
                  </label>

                  {/* URL вручную */}
                  <div className="space-y-2">
                    <Label>или вставьте URL</Label>
                    <Input value={form.image}
                      onChange={e => { setForm({ ...form, image: e.target.value }); setImagePreview(null); }}
                      placeholder="https://..." />
                  </div>

                  {(form.image || imagePreview) && (
                    <Button type="button" variant="outline" size="sm" className="w-full text-red-500"
                      onClick={() => { setForm({ ...form, image: "" }); setImagePreview(null); }}>
                      <Icon name="X" size={14} className="mr-1" />Удалить фото
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Кнопки */}
              <div className="flex gap-3">
                <Button type="submit" className="flex-1" disabled={loading || uploading}>
                  {loading
                    ? <><Icon name="Loader2" size={16} className="animate-spin mr-2" />Сохранение...</>
                    : <><Icon name="Save" size={16} className="mr-2" />{isEdit ? "Сохранить" : "Добавить товар"}</>
                  }
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate("/zm-store")}>
                  Отмена
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ZMStoreProductEdit;
