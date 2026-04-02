import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Organization } from './orgTypes';

interface OrgInfoCardProps {
  selectedOrg: Organization;
  showOrgForm: boolean;
  editingOrg: Organization | null;
  setEditingOrg: (org: Organization | null) => void;
  setShowOrgForm: (v: boolean) => void;
  onStartEdit: () => void;
  onDelete: (id: number) => void;
  onSave: (e: React.FormEvent) => void;
}

const OrgInfoCard: React.FC<OrgInfoCardProps> = ({
  selectedOrg, showOrgForm, editingOrg,
  setEditingOrg, setShowOrgForm,
  onStartEdit, onDelete, onSave,
}) => {
  if (showOrgForm && editingOrg) {
    return (
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-lg md:text-xl">Редактировать организацию</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">После сохранения организация будет отправлена на повторную проверку</p>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <form onSubmit={onSave} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Название организации</label>
              <Input value={editingOrg.organization_name} onChange={(e) => setEditingOrg({ ...editingOrg, organization_name: e.target.value })} required />
            </div>
            <div>
              <label className="text-sm font-medium">Тип организации</label>
              <Input value={editingOrg.organization_type} onChange={(e) => setEditingOrg({ ...editingOrg, organization_type: e.target.value })} placeholder="ООО, ИП, АО" required />
            </div>
            <div>
              <label className="text-sm font-medium">Описание</label>
              <Textarea value={editingOrg.description} onChange={(e) => setEditingOrg({ ...editingOrg, description: e.target.value })} required className="min-h-[80px]" />
            </div>
            <div>
              <label className="text-sm font-medium">Адрес</label>
              <Input value={editingOrg.address} onChange={(e) => setEditingOrg({ ...editingOrg, address: e.target.value })} required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Телефон</label>
                <Input type="tel" value={editingOrg.phone} onChange={(e) => setEditingOrg({ ...editingOrg, phone: e.target.value })} required />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input type="email" value={editingOrg.email} onChange={(e) => setEditingOrg({ ...editingOrg, email: e.target.value })} required />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Часы работы (необязательно)</label>
              <Input value={editingOrg.working_hours || ''} onChange={(e) => setEditingOrg({ ...editingOrg, working_hours: e.target.value })} placeholder="Пн-Пт: 9:00-18:00" />
            </div>
            <div className="flex gap-3">
              <Button type="submit" className="flex-1">
                <Icon name="Check" size={16} className="mr-2" />Сохранить
              </Button>
              <Button type="button" variant="outline" onClick={() => { setShowOrgForm(false); setEditingOrg(null); }}>
                Отмена
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
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
            <Button size="sm" variant="outline" onClick={onStartEdit}>
              <Icon name="Edit" size={14} className="mr-1" />Редактировать
            </Button>
            <Button size="sm" variant="outline" onClick={() => onDelete(selectedOrg.id)} className="text-red-500 hover:text-red-600">
              <Icon name="Trash2" size={14} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 md:space-y-4 p-4 md:p-6">
        <p className="text-sm">{selectedOrg.description}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 text-sm">
          <div className="flex items-center gap-2"><Icon name="MapPin" size={14} className="text-muted-foreground" /><span>{selectedOrg.address}</span></div>
          <div className="flex items-center gap-2"><Icon name="Phone" size={14} className="text-muted-foreground" /><span>{selectedOrg.phone}</span></div>
          <div className="flex items-center gap-2"><Icon name="Mail" size={14} className="text-muted-foreground" /><span>{selectedOrg.email}</span></div>
          {selectedOrg.working_hours && (
            <div className="flex items-center gap-2"><Icon name="Clock" size={14} className="text-muted-foreground" /><span>{selectedOrg.working_hours}</span></div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OrgInfoCard;
