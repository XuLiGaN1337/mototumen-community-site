import React, { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { useAuth, getYandexAuthUrl, YANDEX_REDIRECT_URI } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const AUTH_API = 'https://functions.poehali.dev/55efb6f4-b3ab-4ac3-8b19-da9b21b5490e';

interface LinkedData {
  telegram: { linked: boolean; username?: string };
  yandex: { linked: boolean; login?: string; display_name?: string };
  profile: { birthdate?: string; yandex_phone?: string; gender?: string };
}

interface LinkedAccountsProps {
  token: string;
}

const LinkedAccounts: React.FC<LinkedAccountsProps> = ({ token }) => {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<LinkedData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetch(`${AUTH_API}?action=linked_accounts`, {
      headers: { 'X-Auth-Token': token },
    })
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [token, isAuthenticated]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('linked') === 'yandex') {
      toast({ title: 'Яндекс привязан', description: 'Аккаунт успешно привязан к профилю' });
      window.history.replaceState({}, '', '/profile');
    }
  }, []);

  const handleLinkYandex = () => {
    window.location.href = getYandexAuthUrl('link');
  };

  if (loading) {
    return (
      <div className="bg-[#252836] rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-white/10 rounded w-1/3 mb-3" />
        <div className="h-12 bg-white/5 rounded mb-2" />
        <div className="h-12 bg-white/5 rounded" />
      </div>
    );
  }

  return (
    <div className="bg-[#252836] rounded-lg p-4 space-y-3">
      <h3 className="text-white font-semibold text-sm flex items-center gap-2">
        <Icon name="Link" size={16} className="text-gray-400" />
        Привязанные аккаунты
      </h3>

      {/* Telegram */}
      <div className="bg-[#1e2332] rounded-lg p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#0088cc]/20 flex items-center justify-center">
            <Icon name="Send" size={15} className="text-[#0088cc]" />
          </div>
          <div>
            <p className="text-white text-sm font-medium">Telegram</p>
            {data?.telegram.linked ? (
              <p className="text-gray-400 text-xs">@{data.telegram.username || 'привязан'}</p>
            ) : (
              <p className="text-gray-500 text-xs">Не привязан</p>
            )}
          </div>
        </div>
        {data?.telegram.linked ? (
          <span className="text-green-400 text-xs flex items-center gap-1">
            <Icon name="CheckCircle" size={14} />
            Активен
          </span>
        ) : (
          <button
            onClick={() => window.open('https://t.me/auth_mototyumen_bot?start=auth', '_blank')}
            className="text-xs bg-[#0088cc]/20 hover:bg-[#0088cc]/30 text-[#0088cc] px-3 py-1.5 rounded-lg transition-all"
          >
            Привязать
          </button>
        )}
      </div>

      {/* Yandex */}
      <div className="bg-[#1e2332] rounded-lg p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#FC3F1D]/20 flex items-center justify-center">
            <span className="text-[#FC3F1D] font-bold text-sm">Я</span>
          </div>
          <div>
            <p className="text-white text-sm font-medium">Яндекс ID</p>
            {data?.yandex.linked ? (
              <p className="text-gray-400 text-xs">{data.yandex.login || data.yandex.display_name || 'привязан'}</p>
            ) : (
              <p className="text-gray-500 text-xs">Не привязан</p>
            )}
          </div>
        </div>
        {data?.yandex.linked ? (
          <span className="text-green-400 text-xs flex items-center gap-1">
            <Icon name="CheckCircle" size={14} />
            Активен
          </span>
        ) : (
          <button
            onClick={handleLinkYandex}
            className="text-xs bg-[#FC3F1D]/20 hover:bg-[#FC3F1D]/30 text-[#FC3F1D] px-3 py-1.5 rounded-lg transition-all"
          >
            Привязать
          </button>
        )}
      </div>

      {/* Данные от Яндекса */}
      {data?.yandex.linked && (data.profile.birthdate || data.profile.yandex_phone) && (
        <div className="border-t border-white/5 pt-3 space-y-2">
          <p className="text-gray-500 text-xs uppercase tracking-wide">Данные из Яндекс ID</p>
          {data.profile.birthdate && (
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Icon name="Calendar" size={14} className="text-gray-500" />
              <span>Дата рождения: {new Date(data.profile.birthdate).toLocaleDateString('ru-RU')}</span>
            </div>
          )}
          {data.profile.yandex_phone && (
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Icon name="Phone" size={14} className="text-gray-500" />
              <span>{data.profile.yandex_phone}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LinkedAccounts;
