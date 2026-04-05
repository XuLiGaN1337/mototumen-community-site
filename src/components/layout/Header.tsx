import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";
import { UserProfile, useAuth } from "@/contexts/AuthContext";
import { getRoleEmoji } from "@/components/admin/RoleBadge";
import AuthModal from "@/components/AuthModal";
import { useNotification } from "@/contexts/NotificationContext";

type HeaderProps = object;

const ADMIN_API = 'https://functions.poehali.dev/f34bd996-f5f2-4c81-8b7b-fb5621187a7f';

const Header: React.FC<HeaderProps> = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [hasOrganization, setHasOrganization] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, logout, token } = useAuth();
  const { notifications, dismissAll } = useNotification();
  const unreadCount = notifications.length;
  
  useEffect(() => {
    const checkOrganization = async () => {
      if (!token || !user) return;
      try {
        const response = await fetch(`${ADMIN_API}?action=my-organizations`, {
          headers: { 'X-Auth-Token': token }
        });
        if (response.ok) {
          const data = await response.json();
          setHasOrganization(data.organizations && data.organizations.length > 0);
        }
      } catch (error) {
        console.error('Failed to check organization:', error);
      }
    };
    checkOrganization();
  }, [token, user]);

  const getDefaultAvatar = (gender?: string) => {
    return gender === 'female' 
      ? '/img/323010ec-ee00-4bf5-b69e-88189dbc69e9.jpg'
      : '/img/5732fd0a-94d2-4175-8e07-8d3c8aed2373.jpg';
  };

  return (
    <header className="bg-dark-900 border-b border-dark-700 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <div 
            className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity min-w-0"
            onClick={() => setShowDebug(!showDebug)}
            title="Кликните для отладки"
          >
            <img
              src="https://cdn.poehali.dev/files/972cbcb6-2462-43d5-8df9-3cc8a591f756.png"
              alt="МотоТюмень"
              className="w-9 h-9 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0"
            />
            <h1 className="text-base sm:text-xl md:text-2xl font-bold text-white font-['Oswald'] truncate">
              МОТО<span className="text-[#004488]">ТЮМЕНЬ</span>
            </h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4 lg:space-x-8">
            <Link to="/" className="text-gray-300 hover:text-[#004488] transition-colors">Главная</Link>
            <Link to="/shop" className="text-gray-300 hover:text-[#004488] transition-colors">Магазин</Link>
            <Link to="/store" className="text-gray-300 hover:text-[#004488] transition-colors">ZM STORE</Link>
            <Link to="/service" className="text-gray-300 hover:text-[#004488] transition-colors">Сервис</Link>
            <Link to="/schools" className="text-gray-300 hover:text-[#004488] transition-colors">Мотошколы</Link>
            <Link to="/events" className="text-gray-300 hover:text-[#004488] transition-colors">События</Link>

            {/* Dropdown Menu for "Полезное" */}
            <div className="relative group">
              <button className="text-gray-300 hover:text-[#004488] transition-colors flex items-center">
                Полезное
                <Icon name="ChevronDown" className="h-4 w-4 ml-1" />
              </button>
              <div className="absolute top-full left-0 mt-2 bg-dark-800 border border-dark-600 rounded-md shadow-lg z-50 min-w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <Link to="/gymkhana" className="block px-4 py-2 text-gray-300 hover:bg-[#004488] hover:text-white transition-colors border-b border-dark-600">Мотоджимхана</Link>
                <Link to="/ads" className="block px-4 py-2 text-gray-300 hover:bg-[#004488] hover:text-white transition-colors border-b border-dark-600">Объявления</Link>
                <Link to="/pillion" className="block px-4 py-2 text-gray-300 hover:bg-[#004488] hover:text-white transition-colors border-b border-dark-600">🏍️ Ищу пилота / Двойку</Link>
                <Link to="/lost-found" className="block px-4 py-2 text-gray-300 hover:bg-[#004488] hover:text-white transition-colors border-b border-dark-600">Потеряшки/Находки</Link>
                <Link to="/upcoming-events" className="block px-4 py-2 text-gray-300 hover:bg-[#004488] hover:text-white transition-colors border-b border-dark-600">Ближайшие события</Link>
                <Link to="/emergency" className="block px-4 py-2 text-gray-300 hover:bg-[#004488] hover:text-white transition-colors border-b border-dark-600">Экстренная помощь</Link>
                <Link to="/help" className="block px-4 py-2 text-gray-300 hover:bg-[#004488] hover:text-white transition-colors border-b border-dark-600">Помощь на дороге</Link>
                <Link to="/map" className="block px-4 py-2 text-gray-300 hover:bg-[#004488] hover:text-white transition-colors border-b border-dark-600">Карта маршрутов</Link>
                <Link to="/become-organization" className="block px-4 py-2 bg-gradient-to-r from-yellow-600 to-yellow-500 text-white font-semibold hover:from-yellow-500 hover:to-yellow-400 transition-all">✨ Стать организацией</Link>
              </div>
            </div>
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* User Profile or Login */}
            {isAuthenticated && user ? (
              <div className="relative">
                {/* User Avatar */}
                <div 
                  className="flex items-center space-x-2 hover:opacity-80 transition-opacity cursor-pointer"
                  onClick={() => { setShowProfileMenu(!showProfileMenu); if (!showProfileMenu) dismissAll(); }}
                >
                  <div className="relative flex-shrink-0">
                    <img 
                      src={user.avatar_url || getDefaultAvatar(user.gender)} 
                      alt={user.name}
                      className="w-8 h-8 rounded-full border-2 border-[#004488] object-cover"
                    />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-white truncate max-w-24 flex items-center">
                      {user.name}{getRoleEmoji(user.role || 'user')}
                    </p>
                    {user.email && (
                      <p className="text-xs text-gray-400 truncate max-w-24">
                        {user.email.split('@')[0]}
                      </p>
                    )}
                  </div>
                  <Icon name="ChevronDown" className="h-4 w-4 text-gray-400" />
                </div>
                
                {/* Dropdown Menu */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-dark-800 border border-dark-600 rounded-md shadow-lg z-50">
                    <button
                      onClick={() => {
                        navigate('/profile');
                        setShowProfileMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-gray-300 hover:bg-[#004488] hover:text-white transition-colors flex items-center border-b border-dark-600"
                    >
                      <Icon name="User" className="h-4 w-4 mr-2" />
                      Профиль
                    </button>
                    <button
                      onClick={() => {
                        navigate('/settings');
                        setShowProfileMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-gray-300 hover:bg-[#004488] hover:text-white transition-colors flex items-center border-b border-dark-600"
                    >
                      <Icon name="Settings" className="h-4 w-4 mr-2" />
                      Настройки
                    </button>
                    
                    {isAdmin && (
                      <button
                        onClick={() => {
                          navigate('/admin');
                          setShowProfileMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-gray-300 hover:bg-[#004488] hover:text-white transition-colors flex items-center border-b border-dark-600"
                      >
                        <Icon name="Shield" className="h-4 w-4 mr-2" />
                        Админ панель
                      </button>
                    )}
                    
                    {hasOrganization && (
                      <button
                        onClick={() => {
                          navigate('/organization');
                          setShowProfileMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-gray-300 hover:bg-[#004488] hover:text-white transition-colors flex items-center border-b border-dark-600"
                      >
                        <Icon name="Building2" className="h-4 w-4 mr-2" />
                        Организация
                      </button>
                    )}
                    
                    <button
                      onClick={() => {
                        logout();
                        setShowProfileMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors flex items-center"
                    >
                      <Icon name="LogOut" className="h-4 w-4 mr-2" />
                      Выйти
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Button
                onClick={() => setShowAuthModal(true)}
                className="bg-[#0088cc] hover:bg-[#0077bb] text-white font-medium transition-all"
                size="sm"
              >
                <Icon name="LogIn" className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Войти</span>
              </Button>
            )}
            <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-gray-300 hover:text-white"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Icon name="Menu" className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <nav className="md:hidden border-t border-dark-700">
            <div className="py-2">
              {[
                { href: "/", label: "Главная", icon: "Home" },
                { href: "/shop", label: "Магазин", icon: "ShoppingBag" },
                { href: "/store", label: "ZM STORE", icon: "Store" },
                { href: "/service", label: "Сервис", icon: "Wrench" },
                { href: "/schools", label: "Мотошколы", icon: "GraduationCap" },
                { href: "/events", label: "События", icon: "Calendar" },
              ].map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="flex items-center gap-3 py-3 px-4 text-gray-300 hover:text-white hover:bg-dark-800 active:bg-dark-700 transition-colors text-base"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon name={item.icon as "Home"} className="h-5 w-5 text-[#004488] flex-shrink-0" />
                  {item.label}
                </Link>
              ))}

              {/* Полезное — раздел */}
              <div className="border-t border-dark-700 mt-1 pt-1">
                <p className="px-4 py-2 text-xs text-gray-500 uppercase tracking-wider">Полезное</p>
                {[
                  { href: "/gymkhana", label: "Мотоджимхана", icon: "Flag" },
                  { href: "/ads", label: "Объявления", icon: "FileText" },
                  { href: "/pillion", label: "Ищу пилота / Двойку", icon: "Users" },
                  { href: "/emergency", label: "Экстренная помощь", icon: "AlertTriangle" },
                  { href: "/help", label: "Помощь на дороге", icon: "LifeBuoy" },
                ].map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="flex items-center gap-3 py-3 px-4 text-gray-300 hover:text-white hover:bg-dark-800 active:bg-dark-700 transition-colors text-base"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon name={item.icon as "FileText"} className="h-5 w-5 text-[#004488] flex-shrink-0" />
                    {item.label}
                  </Link>
                ))}
                <Link
                  to="/become-organization"
                  className="flex items-center gap-3 py-3 px-4 text-yellow-400 hover:bg-dark-800 transition-colors text-base"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon name="Star" className="h-5 w-5 flex-shrink-0" />
                  ✨ Стать организацией
                </Link>
              </div>

              {/* Auth в мобильном меню */}
              <div className="border-t border-dark-700 mt-1 pt-1 px-4 pb-3">
                {!isAuthenticated ? (
                  <button
                    onClick={() => { setShowAuthModal(true); setIsMobileMenuOpen(false); }}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#0088cc] hover:bg-[#0077bb] text-white rounded-lg font-medium transition-colors mt-2"
                  >
                    <Icon name="LogIn" className="h-5 w-5" />
                    Войти
                  </button>
                ) : (
                  <div className="flex items-center gap-3 py-3">
                    <img
                      src={user?.avatar_url || getDefaultAvatar(user?.gender)}
                      alt={user?.name}
                      className="w-10 h-10 rounded-full border-2 border-[#004488] object-cover flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-medium truncate">{user?.name}</p>
                      <div className="flex gap-3">
                        <Link to="/profile" className="text-sm text-[#004488] hover:underline" onClick={() => setIsMobileMenuOpen(false)}>Профиль</Link>
                        <Link to="/settings" className="text-sm text-gray-400 hover:underline" onClick={() => setIsMobileMenuOpen(false)}>Настройки</Link>
                      </div>
                    </div>
                    <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="p-2 text-red-400 hover:bg-red-900/20 rounded-lg">
                      <Icon name="LogOut" className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </nav>
        )}
      </div>

    </header>
  );
};

export default Header;
export { Header };