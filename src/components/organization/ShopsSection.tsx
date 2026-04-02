import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Shop, Organization, SHOP_CATEGORIES, getCardLabelPlural } from './orgTypes';
import { useFilterCategories } from '@/hooks/useFilterCategories';

interface ShopsSectionProps {
  selectedOrg: Organization;
  shops: Shop[];
  showShopForm: boolean;
  editingShop: Shop | null;
  setEditingShop: (s: Shop | null) => void;
  shopImagePreview: string | null;
  setShopImagePreview: (v: string | null) => void;
  onStartNew: () => void;
  onStartEdit: (shop: Shop) => void;
  onDelete: (id: number) => void;
  onSave: (e: React.FormEvent) => void;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCloseForm: () => void;
}

const ShopsSection: React.FC<ShopsSectionProps> = ({
  selectedOrg, shops, showShopForm, editingShop, setEditingShop,
  shopImagePreview, setShopImagePreview,
  onStartNew, onStartEdit, onDelete, onSave, onImageChange, onCloseForm,
}) => {
  const labelPlural = getCardLabelPlural(selectedOrg.organization_type);
  const shopCategories = useFilterCategories("shops", SHOP_CATEGORIES);

  return (
    <>
      <Card>
        <CardHeader className="p-4 md:p-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-lg md:text-xl">Карточки {labelPlural}</CardTitle>
            <Button onClick={onStartNew} size="sm" className="text-xs md:text-sm">
              <Icon name="Plus" className="mr-1 md:mr-2" size={14} />Добавить карточку
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          {shops.length === 0 ? (
            <p className="text-center text-muted-foreground py-6 md:py-8 text-sm">
              Нет добавленных карточек {labelPlural}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {shops.map((shop) => (
                <Card key={shop.id} className="overflow-hidden group hover:shadow-lg transition-all">
                  {shop.image_url && (
                    <div className="relative h-48 overflow-hidden">
                      <img src={shop.image_url} alt={shop.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <Badge className="absolute top-2 left-2 bg-primary/90 backdrop-blur-sm">{shop.category}</Badge>
                    </div>
                  )}
                  <CardContent className="p-4 min-h-[160px] flex flex-col">
                    <div className="flex-1">
                      {!shop.image_url && <Badge className="mb-2">{shop.category}</Badge>}
                      <h3 className="font-semibold text-lg mb-1 truncate">{shop.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{shop.description}</p>
                      <div className="space-y-1 text-xs">
                        <p className="flex items-start gap-1.5"><Icon name="MapPin" className="flex-shrink-0 mt-0.5" size={12} /><span className="line-clamp-1">{shop.address}</span></p>
                        <p className="flex items-center gap-1.5"><Icon name="Phone" size={12} /><span>{shop.phone}</span></p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3 pt-3 border-t">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => onStartEdit(shop)}>
                        <Icon name="Edit" size={14} className="mr-1" />Изменить
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => shop.id && onDelete(shop.id)} className="text-red-500 hover:text-red-600">
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

      {showShopForm && editingShop && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader className="p-4 md:p-6 sticky top-0 bg-background border-b z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg md:text-xl">{editingShop.id ? 'Редактировать карточку' : 'Новая карточка'}</CardTitle>
                <Button size="sm" variant="ghost" onClick={onCloseForm}><Icon name="X" size={20} /></Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <form onSubmit={onSave} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Изображение (необязательно)</label>
                  <div className="mt-2">
                    {shopImagePreview ? (
                      <div className="relative w-full h-48 rounded-lg overflow-hidden mb-2">
                        <img src={shopImagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <Button type="button" size="sm" variant="destructive" className="absolute top-2 right-2"
                          onClick={() => { setShopImagePreview(null); if (editingShop) setEditingShop({ ...editingShop, image_url: '' }); }}>
                          <Icon name="X" size={14} />
                        </Button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent">
                        <Icon name="Upload" size={24} className="mb-2" />
                        <span className="text-sm text-muted-foreground">Загрузить изображение</span>
                        <input type="file" accept="image/*" onChange={onImageChange} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Название</label>
                  <Input value={editingShop.name} onChange={(e) => setEditingShop({ ...editingShop, name: e.target.value })} required />
                </div>

                <div>
                  <label className="text-sm font-medium">Категория *</label>
                  <Select value={editingShop.category} onValueChange={(v) => setEditingShop({ ...editingShop, category: v })}>
                    <SelectTrigger><SelectValue placeholder="Выберите категорию" /></SelectTrigger>
                    <SelectContent>{shopCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Описание</label>
                  <Textarea value={editingShop.description} onChange={(e) => setEditingShop({ ...editingShop, description: e.target.value })} required className="min-h-[80px]" />
                </div>

                <div>
                  <label className="text-sm font-medium">Адрес</label>
                  <Input value={editingShop.address} onChange={(e) => setEditingShop({ ...editingShop, address: e.target.value })} required />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Телефон</label>
                    <Input type="tel" value={editingShop.phone} onChange={(e) => setEditingShop({ ...editingShop, phone: e.target.value })} required />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <Input type="email" value={editingShop.email} onChange={(e) => setEditingShop({ ...editingShop, email: e.target.value })} />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Сайт (необязательно)</label>
                  <Input value={editingShop.website || ''} onChange={(e) => setEditingShop({ ...editingShop, website: e.target.value })} placeholder="https://example.com" />
                </div>

                <div>
                  <label className="text-sm font-medium">Часы работы (необязательно)</label>
                  <Input value={editingShop.working_hours || ''} onChange={(e) => setEditingShop({ ...editingShop, working_hours: e.target.value })} placeholder="Пн-Пт: 9:00-18:00" />
                </div>

                <div className="flex gap-3">
                  <Button type="button" className="flex-1" onClick={(e) => { e.preventDefault(); onSave(e as unknown as React.FormEvent); }}>
                    <Icon name="Check" size={16} className="mr-2" />{editingShop.id ? 'Сохранить' : 'Создать'}
                  </Button>
                  <Button type="button" variant="outline" onClick={onCloseForm}>Отмена</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default ShopsSection;