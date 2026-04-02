import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useMediaUpload } from "@/hooks/useMediaUpload";
import { Shop, Organization, ORG_API, getCardLabel } from "./orgTypes";
import OrgInfoCard from "./OrgInfoCard";
import ShopsSection from "./ShopsSection";

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

  useEffect(() => { loadOrganizations(); }, [token, user]);

  const loadOrganizations = async () => {
    if (!token || !user) return;
    try {
      setLoading(true);
      const response = await fetch(`${ORG_API}?action=my-organizations`, { headers: { 'X-Auth-Token': token } });
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
      const response = await fetch(`${ORG_API}?action=organization-shops&orgId=${org.id}`, { headers: { 'X-Auth-Token': token } });
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
      reader.onloadend = () => { setShopImagePreview(reader.result as string); };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShop || !token) return;
    if (!editingShop.category) {
      toast({ title: 'Ошибка', description: 'Выберите категорию', variant: 'destructive' });
      return;
    }
    try {
      let imageUrl = editingShop.image_url;
      if (shopImageFile) {
        const uploadResult = await uploadFile(shopImageFile, { folder: 'shops' });
        if (uploadResult) imageUrl = uploadResult.url;
      }
      const method = editingShop.id ? 'PUT' : 'POST';
      const response = await fetch(`${ORG_API}?action=shop`, {
        method,
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token },
        body: JSON.stringify({ ...editingShop, image_url: imageUrl }),
      });
      if (response.ok) {
        await loadOrganizationShops(selectedOrg!);
        setEditingShop(null);
        setShowShopForm(false);
        setShopImageFile(null);
        setShopImagePreview(null);
        toast({ title: 'Успешно', description: editingShop.id ? 'Карточка обновлена' : 'Карточка создана' });
      } else {
        const errorText = await response.text();
        toast({ title: 'Ошибка', description: `Не удалось сохранить: ${errorText}`, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось сохранить карточку', variant: 'destructive' });
    }
  };

  const handleDeleteShop = async (shopId: number) => {
    if (!token || !confirm(`Удалить карточку ${getCardLabel(selectedOrg?.organization_type)}?`)) return;
    try {
      const response = await fetch(`${ORG_API}?action=shop`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token },
        body: JSON.stringify({ shop_id: shopId }),
      });
      if (response.ok) {
        await loadOrganizationShops(selectedOrg!);
        toast({ title: 'Успешно', description: 'Карточка удалена' });
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось удалить карточку', variant: 'destructive' });
    }
  };

  const handleSaveOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrg || !token) return;
    try {
      const response = await fetch(`${ORG_API}?action=update-organization`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token },
        body: JSON.stringify(editingOrg),
      });
      if (response.ok) {
        await loadOrganizations();
        setEditingOrg(null);
        setShowOrgForm(false);
        toast({ title: 'Успешно', description: 'Организация отправлена на проверку' });
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось обновить организацию', variant: 'destructive' });
    }
  };

  const handleDeleteOrganization = async (orgId: number) => {
    if (!token || !confirm('Удалить организацию? Все карточки магазинов также будут удалены.')) return;
    try {
      const response = await fetch(`${ORG_API}?action=delete-organization`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token },
        body: JSON.stringify({ organization_id: orgId }),
      });
      if (response.ok) {
        await loadOrganizations();
        setSelectedOrg(null);
        toast({ title: 'Успешно', description: 'Организация удалена' });
        navigate('/');
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось удалить организацию', variant: 'destructive' });
    }
  };

  const startNewShop = () => {
    if (!selectedOrg) return;
    setEditingShop({ organization_id: selectedOrg.id, name: '', description: '', category: '', address: '', phone: '', email: '', is_open: true });
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
    return <Card><CardContent className="p-8 text-center"><p className="text-muted-foreground">Загрузка...</p></CardContent></Card>;
  }

  if (organizations.length === 0) {
    return <Card><CardContent className="p-8 text-center"><p className="text-muted-foreground">У вас нет одобренной организации</p></CardContent></Card>;
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
                <Button key={org.id} variant={selectedOrg?.id === org.id ? 'default' : 'outline'} className="h-auto p-4 flex flex-col items-start" onClick={() => loadOrganizationShops(org)}>
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

      {selectedOrg && (
        <OrgInfoCard
          selectedOrg={selectedOrg}
          showOrgForm={showOrgForm}
          editingOrg={editingOrg}
          setEditingOrg={setEditingOrg}
          setShowOrgForm={setShowOrgForm}
          onStartEdit={startEditOrg}
          onDelete={handleDeleteOrganization}
          onSave={handleSaveOrganization}
        />
      )}

      {selectedOrg && !showOrgForm && (
        <ShopsSection
          selectedOrg={selectedOrg}
          shops={shops}
          showShopForm={showShopForm}
          editingShop={editingShop}
          setEditingShop={setEditingShop}
          shopImagePreview={shopImagePreview}
          setShopImagePreview={setShopImagePreview}
          onStartNew={startNewShop}
          onStartEdit={startEditShop}
          onDelete={handleDeleteShop}
          onSave={handleSaveShop}
          onImageChange={handleImageChange}
          onCloseForm={() => { setShowShopForm(false); setEditingShop(null); setShopImageFile(null); setShopImagePreview(null); }}
        />
      )}
    </div>
  );
};
