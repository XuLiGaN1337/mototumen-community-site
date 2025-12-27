import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useMediaUpload } from "@/hooks/useMediaUpload";

interface Shop {
  id?: number;
  organization_id: number;
  name: string;
  description: string;
  category: string;
  address: string;
  phone: string;
  phones?: string[];
  email: string;
  website?: string;
  working_hours?: string;
  is_open?: boolean;
  latitude?: number;
  longitude?: number;
  image_url?: string;
}

interface Organization {
  id: number;
  organization_name: string;
  organization_type: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  working_hours?: string;
  status: string;
}

const ORG_API = 'https://functions.poehali.dev/a4bf4de7-33a4-406c-95cc-0529c16d6677';

const SHOP_CATEGORIES = [
  'Магазин мототехники',
  'Сервис',
  'Мотошкола',
  'Мотоклуб',
  'Прокат',
  'Туристический центр',
  'Другое'
];

export const OrganizationPanel: React.FC = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { toast } = useToast();
  const { uploadFile } = useMediaUpload();
  
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [showShopForm, setShowShopForm] = useState(false);
  const [showOrgForm, setShowOrgForm] = useState(false);
  const [shopImageFile, setShopImageFile] = useState<File | null>(null);
  const [shopImagePreview, setShopImagePreview] = useState<string | null>(null);

  useEffect(() => {
    loadOrganizations();
  }, [token, user]);

  const loadOrganizations = async () => {
    if (!token || !user) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${ORG_API}?action=my-organizations`, {
        headers: { 'X-Auth-Token': token }
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data.organizations || []);
        if (data.organizations && data.organizations.length > 0) {
          await loadOrganizationShops(data.organizations[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrganizationShops = async (org: Organization) => {
    if (!token) return;
    
    try {
      setSelectedOrg(org);
      
      const response = await fetch(`${ORG_API}?action=organization-shops&orgId=${org.id}`, {
        headers: { 'X-Auth-Token': token }
      });
      
      if (response.ok) {
        const data = await response.json();
        setShops(data.shops || []);
      }
    } catch (error) {
      console.error('Failed to load shops:', error);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setShopImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setShopImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShop || !token) return;

    try {
      let imageUrl = editingShop.image_url;

      if (shopImageFile) {
        const uploadResult = await uploadFile(shopImageFile, { folder: 'shops' });
        if (uploadResult) {
          imageUrl = uploadResult.url;
        }
      }

      const method = editingShop.id ? 'PUT' : 'POST';
      const response = await fetch(`${ORG_API}?action=shop`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token
        },
        body: JSON.stringify({ ...editingShop, image_url: imageUrl })
      });

      if (response.ok) {
        await loadOrganizationShops(selectedOrg!);
        setEditingShop(null);
        setShowShopForm(false);
        setShopImageFile(null);
        setShopImagePreview(null);
        toast({
          title: 'Успешно',
          description: editingShop.id ? 'Карточка обновлена' : 'Карточка создана'
        });
      }
    } catch (error) {
      console.error('Failed to save shop:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить карточку',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteShop = async (shopId: number) => {
    if (!token || !confirm('Удалить карточку магазина?')) return;

    try {
      const response = await fetch(`${ORG_API}?action=shop`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token
        },
        body: JSON.stringify({ shop_id: shopId })
      });

      if (response.ok) {
        await loadOrganizationShops(selectedOrg!);
        toast({
          title: 'Успешно',
          description: 'Карточка удалена'
        });
      }
    } catch (error) {
      console.error('Failed to delete shop:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить карточку',
        variant: 'destructive'
      });
    }
  };

  const handleSaveOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrg || !token) return;

    try {
      const response = await fetch(`${ORG_API}?action=update-organization`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token
        },
        body: JSON.stringify(editingOrg)
      });

      if (response.ok) {
        await loadOrganizations();
        setEditingOrg(null);
        setShowOrgForm(false);
        toast({
          title: 'Успешно',
          description: 'Организация отправлена на проверку'
        });
      }
    } catch (error) {
      console.error('Failed to update organization:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить организацию',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteOrganization = async (orgId: number) => {
    if (!token || !confirm('Удалить организацию? Все карточки магазинов также будут удалены.')) return;

    try {
      const response = await fetch(`${ORG_API}?action=delete-organization`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token
        },
        body: JSON.stringify({ organization_id: orgId })
      });

      if (response.ok) {
        await loadOrganizations();
        setSelectedOrg(null);
        toast({
          title: 'Успешно',
          description: 'Организация удалена'
        });
        navigate('/');
      }
    } catch (error) {
      console.error('Failed to delete organization:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить организацию',
        variant: 'destructive'
      });
    }
  };

  const startNewShop = () => {
    if (!selectedOrg) return;
    setEditingShop({
      organization_id: selectedOrg.id,
      name: '',
      description: '',
      category: '',
      address: '',
      phone: '',
      email: '',
      is_open: true
    });
    setShopImageFile(null);
    setShopImagePreview(null);
    setShowShopForm(true);
  };

  const startEditShop = (shop: Shop) => {
    setEditingShop({ ...shop });
    setShopImagePreview(shop.image_url || null);
    setShowShopForm(true);
  };

  const startEditOrg = () => {
    if (!selectedOrg) return;
    setEditingOrg({ ...selectedOrg });
    setShowOrgForm(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Загрузка...</p>
        </CardContent>
      </Card>
    );
  }

  if (organizations.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">У вас нет одобренной организации</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 p-2 md:p-6">
      {organizations.length > 1 && (
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-lg md:text-xl">Мои организации</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {organizations.map((org) => (
                <Button
                  key={org.id}
                  variant={selectedOrg?.id === org.id ? 'default' : 'outline'}
                  className="h-auto p-4 flex flex-col items-start"
                  onClick={() => loadOrganizationShops(org)}
                >
                  <div className="flex items-center gap-2 w-full">
                    <Icon name="Building2" size={16} />
                    <span className="font-semibold truncate">{org.organization_name}</span>
                  </div>
                  <span className="text-xs mt-1 opacity-70">{org.organization_type}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedOrg && !showOrgForm && (
        <Card className="min-h-[180px]">
          <CardHeader className="p-4 md:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="Building2" size={20} />
                  <CardTitle className="text-lg md:text-xl">{selectedOrg.organization_name}</CardTitle>
                  <Badge variant={selectedOrg.status === 'approved' ? 'default' : 'secondary'}>
                    {selectedOrg.status === 'approved' ? 'Одобрена' : selectedOrg.status === 'pending' ? 'На проверке' : 'Отклонена'}
                  </Badge>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground">{selectedOrg.organization_type}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={startEditOrg}>
                  <Icon name="Edit" size={14} className="mr-1" />
                  Редактировать
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleDeleteOrganization(selectedOrg.id)}
                  className="text-red-500 hover:text-red-600"
                >
                  <Icon name="Trash2" size={14} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4 p-4 md:p-6">
            <p className="text-sm">{selectedOrg.description}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Icon name="MapPin" size={14} className="text-muted-foreground" />
                <span>{selectedOrg.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="Phone" size={14} className="text-muted-foreground" />
                <span>{selectedOrg.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="Mail" size={14} className="text-muted-foreground" />
                <span>{selectedOrg.email}</span>
              </div>
              {selectedOrg.working_hours && (
                <div className="flex items-center gap-2">
                  <Icon name="Clock" size={14} className="text-muted-foreground" />
                  <span>{selectedOrg.working_hours}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {showOrgForm && editingOrg && (
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-lg md:text-xl">Редактировать организацию</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">После сохранения организация будет отправлена на повторную проверку</p>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <form onSubmit={handleSaveOrganization} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Название организации</label>
                <Input
                  value={editingOrg.organization_name}
                  onChange={(e) => setEditingOrg({ ...editingOrg, organization_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Тип организации</label>
                <Input
                  value={editingOrg.organization_type}
                  onChange={(e) => setEditingOrg({ ...editingOrg, organization_type: e.target.value })}
                  placeholder="ООО, ИП, АО"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Описание</label>
                <Textarea
                  value={editingOrg.description}
                  onChange={(e) => setEditingOrg({ ...editingOrg, description: e.target.value })}
                  required
                  className="min-h-[80px]"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Адрес</label>
                <Input
                  value={editingOrg.address}
                  onChange={(e) => setEditingOrg({ ...editingOrg, address: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Телефон</label>
                  <Input
                    type="tel"
                    value={editingOrg.phone}
                    onChange={(e) => setEditingOrg({ ...editingOrg, phone: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={editingOrg.email}
                    onChange={(e) => setEditingOrg({ ...editingOrg, email: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Часы работы (необязательно)</label>
                <Input
                  value={editingOrg.working_hours || ''}
                  onChange={(e) => setEditingOrg({ ...editingOrg, working_hours: e.target.value })}
                  placeholder="Пн-Пт: 9:00-18:00"
                />
              </div>
              <div className="flex gap-3">
                <Button type="submit" className="flex-1">
                  <Icon name="Check" size={16} className="mr-2" />
                  Сохранить
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowOrgForm(false);
                    setEditingOrg(null);
                  }}
                >
                  Отмена
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {selectedOrg && !showOrgForm && (
        <Card>
          <CardHeader className="p-4 md:p-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <CardTitle className="text-lg md:text-xl">Карточки магазинов</CardTitle>
              <Button onClick={startNewShop} size="sm" className="text-xs md:text-sm">
                <Icon name="Plus" className="mr-1 md:mr-2" size={14} />
                Добавить карточку
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            {shops.length === 0 ? (
              <p className="text-center text-muted-foreground py-6 md:py-8 text-sm">
                Нет добавленных карточек магазинов
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {shops.map((shop) => (
                  <Card key={shop.id} className="overflow-hidden group hover:shadow-lg transition-all">
                    {shop.image_url && (
                      <div className="relative h-48 overflow-hidden">
                        <img 
                          src={shop.image_url} 
                          alt={shop.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <Badge className="absolute top-2 left-2 bg-primary/90 backdrop-blur-sm">
                          {shop.category}
                        </Badge>
                      </div>
                    )}
                    <CardContent className="p-4 min-h-[160px] flex flex-col">
                      <div className="flex-1">
                        {!shop.image_url && (
                          <Badge className="mb-2">{shop.category}</Badge>
                        )}
                        <h3 className="font-semibold text-lg mb-1 truncate">{shop.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{shop.description}</p>
                        <div className="space-y-1 text-xs">
                          <p className="flex items-start gap-1.5">
                            <Icon name="MapPin" className="flex-shrink-0 mt-0.5" size={12} />
                            <span className="line-clamp-1">{shop.address}</span>
                          </p>
                          <p className="flex items-center gap-1.5">
                            <Icon name="Phone" size={12} />
                            <span>{shop.phone}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3 pt-3 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => startEditShop(shop)}
                        >
                          <Icon name="Edit" size={14} className="mr-1" />
                          Изменить
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => shop.id && handleDeleteShop(shop.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Icon name="Trash2" size={14} />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {showShopForm && editingShop && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader className="p-4 md:p-6 sticky top-0 bg-background border-b z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg md:text-xl">
                  {editingShop.id ? 'Редактировать карточку' : 'Новая карточка'}
                </CardTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowShopForm(false);
                    setEditingShop(null);
                    setShopImageFile(null);
                    setShopImagePreview(null);
                  }}
                >
                  <Icon name="X" size={20} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
            <form onSubmit={handleSaveShop} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Изображение (необязательно)</label>
                <div className="mt-2">
                  {shopImagePreview ? (
                    <div className="relative w-full h-48 rounded-lg overflow-hidden mb-2">
                      <img src={shopImagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setShopImageFile(null);
                          setShopImagePreview(null);
                          if (editingShop) {
                            setEditingShop({ ...editingShop, image_url: '' });
                          }
                        }}
                      >
                        <Icon name="X" size={14} />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent">
                      <Icon name="Upload" size={24} className="mb-2" />
                      <span className="text-sm text-muted-foreground">Загрузить изображение</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Название</label>
                <Input
                  value={editingShop.name}
                  onChange={(e) => setEditingShop({ ...editingShop, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Категория</label>
                <Select
                  value={editingShop.category}
                  onValueChange={(value) => setEditingShop({ ...editingShop, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                  <SelectContent>
                    {SHOP_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Описание</label>
                <Textarea
                  value={editingShop.description}
                  onChange={(e) => setEditingShop({ ...editingShop, description: e.target.value })}
                  required
                  className="min-h-[80px]"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Адрес</label>
                <Input
                  value={editingShop.address}
                  onChange={(e) => setEditingShop({ ...editingShop, address: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Телефон</label>
                  <Input
                    type="tel"
                    value={editingShop.phone}
                    onChange={(e) => setEditingShop({ ...editingShop, phone: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={editingShop.email}
                    onChange={(e) => setEditingShop({ ...editingShop, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Сайт (необязательно)</label>
                <Input
                  value={editingShop.website || ''}
                  onChange={(e) => setEditingShop({ ...editingShop, website: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Часы работы (необязательно)</label>
                <Input
                  value={editingShop.working_hours || ''}
                  onChange={(e) => setEditingShop({ ...editingShop, working_hours: e.target.value })}
                  placeholder="Пн-Пт: 9:00-18:00"
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="flex-1">
                  <Icon name="Check" size={16} className="mr-2" />
                  {editingShop.id ? 'Сохранить' : 'Создать'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowShopForm(false);
                    setEditingShop(null);
                    setShopImageFile(null);
                    setShopImagePreview(null);
                  }}
                >
                  Отмена
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        </div>
      )}
    </div>
  );
};