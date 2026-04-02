import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RoleBadge, getRoleEmoji } from "./RoleBadge";
import Icon from "@/components/ui/icon";

interface AdminUsersProps {
  users: any[];
  currentUserRole?: string;
  onRoleChange: (userId: number, newRole: string) => void;
  onDeleteUser: (userId: number) => void;
}

const ADMIN_API = 'https://functions.poehali.dev/f34bd996-f5f2-4c81-8b7b-fb5621187a7f';

export const AdminUsers: React.FC<AdminUsersProps> = ({ users, currentUserRole, onRoleChange, onDeleteUser }) => {
  const { token } = useAuth();
  const canChangeRoles = currentUserRole === 'admin' || currentUserRole === 'ceo';
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [organizations, setOrganizations] = useState<any[]>([]);
  
  useEffect(() => {
    const loadOrganizations = async () => {
      if (!token) return;
      try {
        const response = await fetch(`${ADMIN_API}?action=organization-requests`, {
          headers: { 'X-Auth-Token': token }
        });
        if (response.ok) {
          const data = await response.json();
          const approved = (data.requests || []).filter((r: any) => r.status === 'approved');
          setOrganizations(approved);
        }
      } catch (error) {
        console.error('Failed to load organizations:', error);
      }
    };
    loadOrganizations();
  }, [token]);
  
  const filteredUsers = roleFilter === 'all' 
    ? users.filter(u => !organizations.find(org => org.user_id === u.id))
    : roleFilter === 'organization'
    ? organizations
    : users.filter(u => u.role === roleFilter && !organizations.find(org => org.user_id === u.id));
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Пользователи системы</CardTitle>
              <p className="text-sm text-muted-foreground">
                Всего зарегистрировано: {users.length} пользователей
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={roleFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setRoleFilter('all')}
              >
                Все
              </Button>
              <Button
                size="sm"
                variant={roleFilter === 'ceo' ? 'default' : 'outline'}
                onClick={() => setRoleFilter('ceo')}
              >
                👑 CEO
              </Button>
              <Button
                size="sm"
                variant={roleFilter === 'admin' ? 'default' : 'outline'}
                onClick={() => setRoleFilter('admin')}
              >
                ⚡ Админ
              </Button>
              <Button
                size="sm"
                variant={roleFilter === 'moderator' ? 'default' : 'outline'}
                onClick={() => setRoleFilter('moderator')}
              >
                🛡️ Модератор
              </Button>
              <Button
                size="sm"
                variant={roleFilter === 'user' ? 'default' : 'outline'}
                onClick={() => setRoleFilter('user')}
              >
                Юзеры
              </Button>
              <Button
                size="sm"
                variant={roleFilter === 'organization' ? 'default' : 'outline'}
                onClick={() => setRoleFilter('organization')}
              >
                🏢 Организации
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Пользователь</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-center">Роль</TableHead>
                <TableHead>Дата регистрации</TableHead>
                <TableHead className="text-center">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((u) => {
                const isOrg = roleFilter === 'organization';
                return (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      {u.avatar_url && (
                        <img src={u.avatar_url} alt={u.name} className="w-8 h-8 rounded-full" />
                      )}
                      <div>
                        <p className="font-medium flex items-center">
                          {isOrg ? u.organization_name : u.name}{!isOrg && getRoleEmoji(u.role)}
                        </p>
                        {isOrg && u.organization_type && (
                          <p className="text-xs text-muted-foreground">{u.organization_type === 'shop' ? '🏪 Магазин' : u.organization_type === 'service' ? '🔧 Сервис' : '🎓 Школа'}</p>
                        )}
                        {!isOrg && u.username && (
                          <p className="text-xs text-muted-foreground">@{u.username}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{isOrg ? u.user_email : u.email}</TableCell>
                  <TableCell className="text-center">
                    {isOrg ? (
                      <span className="text-sm text-muted-foreground">Организация</span>
                    ) : u.role === 'user' && canChangeRoles ? (
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2"
                          onClick={() => onRoleChange(u.id, 'admin')}
                          title="Назначить админом"
                        >
                          ⚡
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2"
                          onClick={() => onRoleChange(u.id, 'moderator')}
                          title="Назначить модератором"
                        >
                          🛡️
                        </Button>
                      </div>
                    ) : (
                      <RoleBadge
                        currentRole={u.role}
                        canChange={canChangeRoles}
                        onRoleChange={(newRole) => onRoleChange(u.id, newRole)}
                        isCeo={u.role === 'ceo'}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(u.created_at).toLocaleDateString('ru-RU')}
                  </TableCell>
                  <TableCell className="text-center">
                    {!isOrg && u.role !== 'ceo' && canChangeRoles && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 hover:text-red-500"
                        onClick={() => onDeleteUser(u.id)}
                        title="Удалить пользователя"
                      >
                        <Icon name="Trash2" className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );})}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};