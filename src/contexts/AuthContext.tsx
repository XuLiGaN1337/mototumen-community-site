import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { checkRateLimit, authRateLimiter } from "@/utils/rateLimiter";

const AUTH_API = 'https://functions.poehali.dev/55efb6f4-b3ab-4ac3-8b19-da9b21b5490e';
const YANDEX_CLIENT_ID = 'dd12a9071f974d83b81ae726349f2237';
export const YANDEX_REDIRECT_URI = `${window.location.origin}/yandex-callback`;
export const getYandexAuthUrl = (state?: string) => {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: YANDEX_CLIENT_ID,
    redirect_uri: YANDEX_REDIRECT_URI,
    ...(state ? { state } : {}),
  });
  return `https://oauth.yandex.ru/authorize?${params.toString()}`;
};

interface UserProfile {
  id: number;
  email: string;
  name: string;
  phone?: string;
  bio?: string;
  location?: string;
  avatar_url?: string;
  gender?: "male" | "female";
  role?: "user" | "admin" | "moderator" | "ceo" | "organizer" | "gymkhana";
  created_at?: string;
  username?: string;
}

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  loginWithTelegram: (telegramUser: TelegramUser) => Promise<void>;
  loginWithYandex: (code: string) => Promise<void>;
  linkYandex: (code: string) => Promise<void>;
  linkTelegram: (telegramUser: TelegramUser) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('authToken'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          const response = await fetch(`${AUTH_API}?verify=true`, {
            headers: {
              'X-Auth-Token': token,
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
          } else {
            localStorage.removeItem('authToken');
            setToken(null);
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          localStorage.removeItem('authToken');
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    verifyToken();
  }, [token]);

  const loginWithTelegram = async (telegramUser: TelegramUser) => {
    setIsLoading(true);
    try {
      checkRateLimit(`telegram_${telegramUser.id}`, authRateLimiter);
      
      const response = await fetch(AUTH_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'telegram_auth',
          telegram_id: telegramUser.id,
          first_name: telegramUser.first_name,
          last_name: telegramUser.last_name,
          username: telegramUser.username,
          photo_url: telegramUser.photo_url || '',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Telegram auth failed');
      }

      const data = await response.json();
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('authToken', data.token);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithYandex = async (code: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(AUTH_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'yandex_auth',
          code,
          redirect_uri: YANDEX_REDIRECT_URI,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Yandex auth failed');
      }
      const data = await response.json();
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('authToken', data.token);
    } finally {
      setIsLoading(false);
    }
  };

  const linkYandex = async (code: string, sessionToken?: string) => {
    const t = sessionToken || token;
    if (!t) throw new Error('Not authenticated');
    const response = await fetch(AUTH_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Auth-Token': t },
      body: JSON.stringify({
        action: 'link_yandex',
        code,
        redirect_uri: YANDEX_REDIRECT_URI,
      }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Link failed');
    }
  };

  const linkTelegram = async (telegramUser: TelegramUser) => {
    const t = token || localStorage.getItem('authToken');
    if (!t) throw new Error('Not authenticated');
    const response = await fetch(AUTH_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Auth-Token': t },
      body: JSON.stringify({
        action: 'link_telegram',
        telegram_id: telegramUser.id,
        username: telegramUser.username,
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name,
      }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Link failed');
    }
  };

  const logout = async () => {
    if (token) {
      try {
        await fetch(AUTH_API, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Auth-Token': token,
          },
          body: JSON.stringify({
            action: 'logout',
          }),
        });
      } catch (error) {
        console.error('Logout failed:', error);
      }
    }
    
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !token) return;

    try {
      const response = await fetch(AUTH_API, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Profile update failed');
      }

      const profileResponse = await fetch(AUTH_API, {
        headers: {
          'X-Auth-Token': token,
        },
      });

      if (profileResponse.ok) {
        const data = await profileResponse.json();
        const updatedUser = { ...user, ...data.profile };
        setUser(updatedUser);
      }
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin' || user?.role === 'ceo' || user?.role === 'moderator',
    isLoading,
    loginWithTelegram,
    loginWithYandex,
    linkYandex,
    linkTelegram,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};