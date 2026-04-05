import React, { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";

const AUTH_API = 'https://functions.poehali.dev/55efb6f4-b3ab-4ac3-8b19-da9b21b5490e';

interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  category: string;
  earned_at: string | null;
}

interface Badge {
  id: number;
  name: string;
  description: string;
  image_url: string;
  category: string;
  earned_at: string;
}

interface AchievementsSectionProps {
  userId: number;
  token?: string | null;
  isCeo?: boolean;
}

const CATEGORY_LABEL: Record<string, string> = {
  social: 'Социальные',
  garage: 'Гараж',
  activity: 'Активность',
  time: 'Ветеранство',
};

const BADGE_COLORS: Record<string, string> = {
  event: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  community: 'text-green-400 bg-green-500/10 border-green-500/30',
  expert: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  role: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  verified: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
};

const ALL_BADGES = [
  { id: 1, name: 'Организатор', description: 'За организацию мероприятий', category: 'event' },
  { id: 2, name: 'Помощник', description: 'За помощь сообществу', category: 'community' },
  { id: 3, name: 'Эксперт', description: 'За вклад в развитие', category: 'expert' },
  { id: 4, name: 'Модератор', description: 'Модератор платформы', category: 'role' },
  { id: 5, name: 'Проверенный', description: 'Проверенный участник', category: 'verified' },
];

export const AchievementsSection: React.FC<AchievementsSectionProps> = ({ userId, token, isCeo }) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [grantingBadge, setGrantingBadge] = useState<number | null>(null);
  const [showBadgePanel, setShowBadgePanel] = useState(false);

  useEffect(() => {
    if (userId) loadData();
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (token) headers['X-Auth-Token'] = token;

      // Синхронизируем достижения (только для своего профиля)
      if (token) {
        fetch(`${AUTH_API}?action=sync_achievements`, { headers }).catch(() => {});
      }

      const res = await fetch(`${AUTH_API}?action=achievements&user_id=${userId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setAchievements(data.achievements || []);
        setBadges(data.badges || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const grantBadge = async (badgeId: number) => {
    if (!token) return;
    setGrantingBadge(badgeId);
    try {
      const res = await fetch(`${AUTH_API}?action=achievements&user_id=${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token },
        body: JSON.stringify({ badge_id: badgeId }),
      });
      if (res.ok) await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setGrantingBadge(null);
    }
  };

  const revokeBadge = async (badgeId: number) => {
    if (!token) return;
    setGrantingBadge(badgeId);
    try {
      const res = await fetch(`${AUTH_API}?action=achievements&user_id=${userId}&badge_id=${badgeId}`, {
        method: 'DELETE',
        headers: { 'X-Auth-Token': token },
      });
      if (res.ok) await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setGrantingBadge(null);
    }
  };

  const earnedCount = achievements.filter(a => a.earned_at).length;
  const grouped = achievements.reduce<Record<string, Achievement[]>>((acc, a) => {
    (acc[a.category] = acc[a.category] || []).push(a);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="bg-[#252836] rounded-lg p-4">
        <div className="h-4 bg-[#1e2332] rounded w-1/3 mb-3 animate-pulse" />
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 bg-[#1e2332] rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#252836] rounded-lg p-4 space-y-4">
      {/* Значки */}
      {(badges.length > 0 || isCeo) && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Значки</p>
            {isCeo && (
              <button
                onClick={() => setShowBadgePanel(v => !v)}
                className="text-xs text-yellow-500 hover:text-yellow-400 flex items-center gap-1"
              >
                <Icon name="Crown" size={11} />
                {showBadgePanel ? 'Скрыть' : 'Управление'}
              </button>
            )}
          </div>

          {badges.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {badges.map(badge => (
                <div
                  key={badge.id}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${BADGE_COLORS[badge.category] || 'text-gray-400 bg-gray-500/10 border-gray-500/30'}`}
                  title={badge.description}
                >
                  <Icon name="Award" size={12} />
                  {badge.name}
                  {isCeo && (
                    <button
                      onClick={() => revokeBadge(badge.id)}
                      disabled={grantingBadge === badge.id}
                      className="ml-1 opacity-50 hover:opacity-100"
                    >
                      <Icon name="X" size={10} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {badges.length === 0 && !showBadgePanel && (
            <p className="text-xs text-gray-600">Значков пока нет</p>
          )}

          {isCeo && showBadgePanel && (
            <div className="flex flex-wrap gap-2 mt-2 p-3 bg-[#1e2332] rounded-lg">
              {ALL_BADGES.map(b => {
                const has = badges.some(ub => ub.id === b.id);
                return (
                  <button
                    key={b.id}
                    disabled={grantingBadge === b.id}
                    onClick={() => has ? revokeBadge(b.id) : grantBadge(b.id)}
                    className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                      has
                        ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                        : 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20'
                    }`}
                  >
                    {has ? '— ' : '+ '}{b.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Достижения */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Достижения</p>
          <span className="text-xs text-gray-500">{earnedCount} / {achievements.length}</span>
        </div>

        <div className="space-y-3">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-1.5">
                {CATEGORY_LABEL[category] || category}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {items.map(ach => {
                  const earned = !!ach.earned_at;
                  return (
                    <div
                      key={ach.id}
                      title={ach.description}
                      className={`flex flex-col items-center justify-center gap-1 rounded-lg p-2.5 text-center transition-colors ${
                        earned
                          ? 'bg-blue-500/10 border border-blue-500/30'
                          : 'bg-[#1e2332] border border-transparent opacity-40'
                      }`}
                    >
                      <Icon
                        name={ach.icon as 'Award'}
                        size={20}
                        className={earned ? 'text-blue-400' : 'text-gray-600'}
                      />
                      <p className={`text-[10px] font-medium leading-tight ${earned ? 'text-white' : 'text-gray-500'}`}>
                        {ach.name}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AchievementsSection;
