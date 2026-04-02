import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';

interface ResetRequest {
  id: number;
  user_id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
  status: string;
}

interface AdminPasswordSettingsProps {
  adminApi: string;
  users: unknown[];
  onPasswordReset?: () => void;
}

export const AdminPasswordSettings: React.FC<AdminPasswordSettingsProps> = ({
  adminApi,
  users,
  onPasswordReset
}) => {
  const { user, token } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState<number | null>(null);
  const [resetRequests, setResetRequests] = useState<ResetRequest[]>([]);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const isCEO = user?.role === 'ceo';

  const fetchResetRequests = useCallback(async () => {
    if (!isCEO || !token) return;
    try {
      const res = await fetch(`${adminApi}?action=password-reset-requests`, {
        headers: { 'X-Auth-Token': token }
      });
      const data = await res.json();
      if (res.ok) setResetRequests(data.requests || []);
    } catch { /* silent */ }
  }, [isCEO, token, adminApi]);

  // Long poll для CEO — висим и ждём новых запросов
  useEffect(() => {
    if (!isCEO) return;
    let cancelled = false;
    fetchResetRequests();

    const poll = async () => {
      while (!cancelled) {
        try {
          const res = await fetch(`${adminApi}?action=wait-reset-requests`, {
            headers: { 'X-Auth-Token': token || '' },
          });
          if (cancelled) return;
          if (res.ok) {
            const data = await res.json();
            if (data.requests) setResetRequests(data.requests);
          }
        } catch {
          if (cancelled) return;
          await new Promise(r => setTimeout(r, 3000));
        }
      }
    };
    poll();
    return () => { cancelled = true; };
  }, [isCEO, token, adminApi, fetchResetRequests]);

  const handleChangePassword = async () => {
    if (newPassword.length < 6) { setError('Новый пароль должен быть не менее 6 символов'); return; }
    if (newPassword !== confirmPassword) { setError('Пароли не совпадают'); return; }

    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await fetch(`${adminApi}?action=change-my-admin-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token || '' },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess('Пароль успешно изменён');
        setOldPassword(''); setNewPassword(''); setConfirmPassword('');
      } else {
        setError(data.error || 'Ошибка смены пароля');
      }
    } catch { setError('Не удалось изменить пароль'); }
    finally { setLoading(false); }
  };

  const handleResetUserPassword = async (userId: number, userName: string) => {
    if (!confirm(`Сбросить пароль пользователя ${userName}?`)) return;
    setResetLoading(userId);
    try {
      const res = await fetch(`${adminApi}?action=reset-admin-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token || '' },
        body: JSON.stringify({ userId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`Пароль ${userName} сброшен`);
        onPasswordReset?.();
      } else {
        alert(data.error || 'Ошибка');
      }
    } catch { alert('Ошибка'); }
    finally { setResetLoading(null); }
  };

  const handleApproveReset = async (requestId: number, userName: string) => {
    setProcessingId(requestId);
    try {
      const res = await fetch(`${adminApi}?action=approve-password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token || '' },
        body: JSON.stringify({ requestId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResetRequests(prev => prev.filter(r => r.id !== requestId));
        onPasswordReset?.();
      } else {
        alert(data.error || 'Ошибка');
      }
    } catch { alert('Ошибка'); }
    finally { setProcessingId(null); }
  };

  const handleRejectReset = async (requestId: number) => {
    setProcessingId(requestId);
    try {
      const res = await fetch(`${adminApi}?action=reject-password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token || '' },
        body: JSON.stringify({ requestId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResetRequests(prev => prev.filter(r => r.id !== requestId));
      } else {
        alert(data.error || 'Ошибка');
      }
    } catch { alert('Ошибка'); }
    finally { setProcessingId(null); }
  };

  const adminUsers = (users as { id: number; name: string; role: string }[]).filter(u =>
    ['admin', 'ceo', 'moderator'].includes(u.role)
  );

  return (
    <div className="space-y-6">

      {/* CEO: Запросы на сброс — онлайн */}
      {isCEO && (
        <Card className={resetRequests.length > 0 ? 'border-orange-500/50 bg-orange-500/5' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="Bell" className="w-5 h-5" />
              Запросы на сброс пароля
              {resetRequests.length > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  {resetRequests.length}
                </Badge>
              )}
              <span className="ml-auto text-xs text-muted-foreground font-normal flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse" />
                онлайн
              </span>
            </CardTitle>
            <CardDescription>
              {resetRequests.length > 0
                ? 'Администраторы ожидают одобрения сброса пароля'
                : 'Нет новых запросов'}
            </CardDescription>
          </CardHeader>
          {resetRequests.length > 0 && (
            <CardContent className="space-y-3">
              {resetRequests.map(req => (
                <div key={req.id} className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                      <Icon name="User" className="w-4 h-4 text-orange-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{req.name}</p>
                      <p className="text-xs text-muted-foreground">{req.role} · {new Date(req.created_at).toLocaleString('ru-RU')}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApproveReset(req.id, req.name)}
                      disabled={processingId === req.id}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {processingId === req.id ? <Icon name="Loader2" className="w-4 h-4 animate-spin" /> : <Icon name="Check" className="w-4 h-4" />}
                      <span className="ml-1 hidden sm:inline">Одобрить</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRejectReset(req.id)}
                      disabled={processingId === req.id}
                      className="border-red-500/50 text-red-500 hover:bg-red-500/10"
                    >
                      <Icon name="X" className="w-4 h-4" />
                      <span className="ml-1 hidden sm:inline">Отклонить</span>
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      )}

      {/* Смена своего пароля */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="Lock" className="w-5 h-5" />
            Мой пароль
          </CardTitle>
          <CardDescription>Смените личный пароль для входа в админ-панель</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Текущий пароль</label>
            <Input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} placeholder="Введите текущий пароль" disabled={loading} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Новый пароль</label>
            <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Минимум 6 символов" disabled={loading} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Подтвердите новый пароль</label>
            <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Повторите пароль" disabled={loading} onKeyDown={e => e.key === 'Enter' && handleChangePassword()} />
          </div>
          {error && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded flex gap-2"><Icon name="AlertCircle" className="w-4 h-4 mt-0.5 flex-shrink-0" /><span>{error}</span></div>}
          {success && <div className="bg-green-500/10 text-green-600 text-sm p-3 rounded flex gap-2"><Icon name="CheckCircle" className="w-4 h-4 mt-0.5 flex-shrink-0" /><span>{success}</span></div>}
          <Button onClick={handleChangePassword} disabled={loading || !oldPassword || !newPassword || !confirmPassword} className="w-full">
            {loading ? 'Изменение...' : 'Изменить пароль'}
          </Button>
        </CardContent>
      </Card>

      {/* CEO: принудительный сброс для конкретного пользователя */}
      {isCEO && adminUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="Users" className="w-5 h-5" />
              Сброс паролей администраторов
            </CardTitle>
            <CardDescription>Принудительно сбросить пароль любому администратору</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {adminUsers.map(u => (
              <div key={u.id} className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
                <div>
                  <p className="font-medium text-sm">{u.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{u.role}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleResetUserPassword(u.id, u.name)}
                  disabled={resetLoading === u.id}
                  className="border-red-500/30 text-red-500 hover:bg-red-500/10"
                >
                  {resetLoading === u.id ? <Icon name="Loader2" className="w-4 h-4 animate-spin" /> : <Icon name="RotateCcw" className="w-4 h-4" />}
                  <span className="ml-1">Сбросить</span>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};