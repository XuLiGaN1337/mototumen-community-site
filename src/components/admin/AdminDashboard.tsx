import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Icon from "@/components/ui/icon";

interface Stats {
  total_users: number;
  new_users_30d: number;
  new_users_7d: number;
  active_sessions: number;
  total_admins: number;
  total_friendships: number;
  pending_friend_requests: number;
  total_vehicles: number;
  total_announcements: number;
  total_shops: number;
  total_schools: number;
  total_services: number;
  total_organizations: number;
  pending_org_requests: number;
  pending_password_resets: number;
}

interface AdminDashboardProps {
  stats: Stats | null;
  recentActivity: unknown[];
}

interface StatCardProps {
  title: string;
  value: number | string;
  sub?: string;
  icon: string;
  accent?: boolean;
  alert?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, sub, icon, accent, alert }) => (
  <Card className={alert ? 'border-orange-500/50 bg-orange-500/5' : ''}>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${accent ? 'bg-primary/10' : alert ? 'bg-orange-500/10' : 'bg-muted'}`}>
        <Icon name={icon as 'Users'} className={`h-4 w-4 ${accent ? 'text-primary' : alert ? 'text-orange-500' : 'text-muted-foreground'}`} />
      </div>
    </CardHeader>
    <CardContent>
      <div className={`text-2xl font-bold ${alert && Number(value) > 0 ? 'text-orange-500' : ''}`}>{value}</div>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </CardContent>
  </Card>
);

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ stats, recentActivity }) => {
  if (!stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2"><div className="h-4 bg-muted rounded w-2/3" /></CardHeader>
            <CardContent><div className="h-8 bg-muted rounded w-1/2 mb-1" /><div className="h-3 bg-muted rounded w-1/3" /></CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Срочные уведомления */}
      {(stats.pending_org_requests > 0 || stats.pending_password_resets > 0) && (
        <div className="flex flex-wrap gap-2">
          {stats.pending_org_requests > 0 && (
            <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-lg px-3 py-2 text-sm text-orange-400">
              <Icon name="Building2" className="h-4 w-4" />
              <span>{stats.pending_org_requests} заявок на организацию</span>
            </div>
          )}
          {stats.pending_password_resets > 0 && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-sm text-red-400">
              <Icon name="Key" className="h-4 w-4" />
              <span>{stats.pending_password_resets} запросов сброса пароля</span>
            </div>
          )}
        </div>
      )}

      {/* Основные карточки */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Пользователи"
          value={stats.total_users}
          sub={`+${stats.new_users_7d} за неделю`}
          icon="Users"
          accent
        />
        <StatCard
          title="Активных сессий"
          value={stats.active_sessions}
          sub="Сейчас онлайн"
          icon="Activity"
          accent
        />
        <StatCard
          title="Дружбы"
          value={stats.total_friendships}
          sub={`${stats.pending_friend_requests} ожидают`}
          icon="Heart"
        />
        <StatCard
          title="Техника в гаражах"
          value={stats.total_vehicles}
          sub="Мотоциклы и другое"
          icon="Bike"
        />
      </div>

      {/* Контент */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <StatCard title="Объявления" value={stats.total_announcements} sub="В базе данных" icon="FileText" />
        <StatCard title="Магазины" value={stats.total_shops} sub="Активных точек" icon="Store" />
        <StatCard title="Мотошколы" value={stats.total_schools} sub="Учебных заведений" icon="GraduationCap" />
        <StatCard title="Сервисы" value={stats.total_services} sub="Мастерских" icon="Wrench" />
      </div>

      {/* Организации + ожидание */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <StatCard title="Организации" value={stats.total_organizations} sub="Одобрено" icon="Building2" />
        <StatCard
          title="Заявок орг."
          value={stats.pending_org_requests}
          sub="Ожидают решения"
          icon="Clock"
          alert={stats.pending_org_requests > 0}
        />
        <StatCard title="Администраторов" value={stats.total_admins} sub="CEO, Admin, Moder" icon="Shield" />
        <StatCard
          title="Новых за месяц"
          value={stats.new_users_30d}
          sub="Регистраций"
          icon="UserPlus"
          accent
        />
      </div>

    </div>
  );
};