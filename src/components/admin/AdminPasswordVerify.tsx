import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface AdminPasswordVerifyProps {
  onVerified: () => void;
  onPasswordReset?: () => void;
  adminApi: string;
  token: string;
  userName?: string;
}

type Screen = 'verify' | 'requested' | 'setup';

export const AdminPasswordVerify: React.FC<AdminPasswordVerifyProps> = ({
  onVerified,
  onPasswordReset,
  adminApi,
  token,
  userName
}) => {
  const [screen, setScreen] = useState<Screen>('verify');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleVerify = async () => {
    if (!password) return;
    setLoading(true); setError('');
    try {
      const res = await fetch(`${adminApi}?action=verify-my-admin-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        onVerified();
      } else {
        setError('Неверный пароль');
        setPassword('');
      }
    } catch { setError('Ошибка проверки пароля'); }
    finally { setLoading(false); }
  };

  const handleRequestReset = async () => {
    setResetLoading(true); setError('');
    try {
      const res = await fetch(`${adminApi}?action=request-password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setScreen('requested');
      } else {
        setError(data.error || 'Ошибка запроса');
      }
    } catch { setError('Не удалось отправить запрос'); }
    finally { setResetLoading(false); }
  };

  // Поллинг статуса запроса — пока ждём одобрения CEO
  const checkResetStatus = useCallback(async () => {
    if (screen !== 'requested') return;
    try {
      const res = await fetch(`${adminApi}?action=my-admin-password-status`, {
        headers: { 'X-Auth-Token': token }
      });
      const data = await res.json();
      // Если пароль сброшен (hash = null) — показываем форму установки нового
      if (res.ok && data.hasPassword === false) {
        setScreen('setup');
      }
    } catch { /* silent */ }
  }, [screen, adminApi, token]);

  useEffect(() => {
    if (screen !== 'requested') return;
    const interval = setInterval(checkResetStatus, 5000);
    return () => clearInterval(interval);
  }, [screen, checkResetStatus]);

  const handleSetNewPassword = async () => {
    if (newPassword.length < 6) { setError('Минимум 6 символов'); return; }
    if (newPassword !== confirmPassword) { setError('Пароли не совпадают'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${adminApi}?action=set-my-admin-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token },
        body: JSON.stringify({ password: newPassword })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onPasswordReset?.();
        onVerified();
      } else {
        setError(data.error || 'Ошибка установки пароля');
      }
    } catch { setError('Не удалось установить пароль'); }
    finally { setLoading(false); }
  };

  // === Экран ввода пароля ===
  if (screen === 'verify') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card p-8 rounded-lg shadow-xl max-w-md w-full border border-border">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/10 rounded-full mb-4">
              <Icon name="Shield" className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Вход в админку</h2>
            {userName && <p className="text-sm text-muted-foreground">Привет, {userName}! 👋</p>}
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Пароль администратора</label>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Введите пароль"
                disabled={loading}
                onKeyDown={e => e.key === 'Enter' && handleVerify()}
                autoFocus
              />
            </div>
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded flex gap-2">
                <Icon name="AlertCircle" className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <Button onClick={handleVerify} disabled={loading || !password} className="w-full">
              {loading ? 'Проверка...' : 'Войти'}
            </Button>
            <Button
              variant="ghost"
              onClick={handleRequestReset}
              disabled={resetLoading}
              className="w-full text-sm text-muted-foreground"
            >
              {resetLoading ? <Icon name="Loader2" className="w-4 h-4 mr-2 animate-spin" /> : <Icon name="HelpCircle" className="w-4 h-4 mr-2" />}
              Забыли пароль? Запросить сброс у CEO
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // === Экран ожидания одобрения ===
  if (screen === 'requested') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card p-8 rounded-lg shadow-xl max-w-md w-full border border-border text-center space-y-5">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-500/10 rounded-full">
            <Icon name="Clock" className="w-8 h-8 text-yellow-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Ожидание одобрения</h2>
            <p className="text-sm text-muted-foreground">
              Запрос отправлен CEO. Страница обновится автоматически, как только он одобрит.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
            Проверяем каждые 5 секунд...
          </div>
          <Button variant="outline" onClick={() => setScreen('verify')} className="w-full">
            <Icon name="ArrowLeft" className="w-4 h-4 mr-2" />
            Попробовать ввести пароль
          </Button>
        </div>
      </div>
    );
  }

  // === Экран установки нового пароля (после одобрения CEO) ===
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card p-8 rounded-lg shadow-xl max-w-md w-full border border-green-500/30">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/10 rounded-full mb-4">
            <Icon name="CheckCircle" className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Сброс одобрен!</h2>
          <p className="text-sm text-muted-foreground">
            CEO одобрил ваш запрос. Установите новый пароль для входа.
          </p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Новый пароль</label>
            <Input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Минимум 6 символов"
              disabled={loading}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Подтвердите пароль</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Повторите пароль"
              disabled={loading}
              onKeyDown={e => e.key === 'Enter' && handleSetNewPassword()}
            />
          </div>
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded flex gap-2">
              <Icon name="AlertCircle" className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <Button
            onClick={handleSetNewPassword}
            disabled={loading || !newPassword || !confirmPassword}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {loading ? 'Установка...' : 'Установить новый пароль'}
          </Button>
        </div>
      </div>
    </div>
  );
};
