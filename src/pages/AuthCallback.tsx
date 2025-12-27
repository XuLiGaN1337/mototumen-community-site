import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/contexts/AuthContext";

const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithTelegram } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needSubscription, setNeedSubscription] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const token = searchParams.get("token");
        
        if (token) {
          const response = await fetch('https://functions.poehali.dev/37848519-8d12-40c1-b0cb-f22c293fcdb5', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'verify_jwt_token', token })
          });

          if (!response.ok) {
            const errorData = await response.json();
            if (errorData.error === 'subscription_required') {
              setNeedSubscription(true);
              setError(errorData.message);
              setIsLoading(false);
              return;
            }
            throw new Error('Ошибка проверки токена');
          }

          const data = await response.json();
          
          const telegramUser = {
            id: data.user.telegram_id,
            first_name: data.user.first_name,
            last_name: data.user.last_name,
            username: data.user.username,
            photo_url: undefined
          };
          
          setUserData(telegramUser);
          await loginWithTelegram(telegramUser);
        } else {
          const telegramData = {
            id: Number(searchParams.get("id")),
            first_name: searchParams.get("first_name") || "",
            last_name: searchParams.get("last_name") || undefined,
            username: searchParams.get("username") || undefined,
            photo_url: searchParams.get("photo_url") || undefined
          };

          if (!telegramData.id || !telegramData.first_name) {
            throw new Error("Неполные данные авторизации");
          }

          setUserData(telegramData);
          await loginWithTelegram(telegramData);
        }

        setIsLoading(false);
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ошибка авторизации");
        setIsLoading(false);
      }
    };

    handleAuth();
  }, [searchParams, loginWithTelegram, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 via-purple-950 to-black flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxIDAgNiAyLjY5IDYgNnMtMi42OSA2LTYgNi02LTIuNjktNi02IDIuNjktNiA2LTZ6TTI0IDM2YzMuMzEgMCA2IDIuNjkgNiA2cy0yLjY5IDYtNiA2LTYtMi42OS02LTYgMi42OS02IDYtNnoiIGZpbGw9IiMxZTQwYWYiIG9wYWNpdHk9Ii4wNSIvPjwvZz48L3N2Zz4=')] opacity-30"></div>
        
        <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-500">
          <div className="flex flex-col items-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-2xl opacity-50 animate-pulse"></div>
              <div className="relative animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-blue-500 border-r-purple-500"></div>
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Авторизация
              </h2>
              <p className="text-gray-400 text-sm">
                Проверяем ваши данные...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    if (needSubscription) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-orange-950 via-red-950 to-black flex items-center justify-center p-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxIDAgNiAyLjY5IDYgNnMtMi42OSA2LTYgNi02LTIuNjktNi02IDIuNjktNiA2LTZ6TTI0IDM2YzMuMzEgMCA2IDIuNjkgNiA2cy0yLjY5IDYtNiA2LTYtMi42OS02LTYgMi42OS02IDYtNnoiIGZpbGw9IiNjMjQxMGMiIG9wYWNpdHk9Ii4wNSIvPjwvZz48L3N2Zz4=')] opacity-30"></div>
          
          <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-500">
            <div className="flex flex-col items-center space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-full blur-2xl opacity-50"></div>
                <div className="relative bg-gradient-to-br from-orange-500 to-red-500 rounded-full p-4">
                  <Icon name="UserPlus" className="h-10 w-10 text-white" />
                </div>
              </div>
              
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                  Требуется подписка
                </h2>
                <p className="text-gray-300 text-sm">
                  {error}
                </p>
              </div>

              <div className="w-full space-y-3">
                <button
                  onClick={() => window.open('https://t.me/MotoTyumen', '_blank')}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-blue-500/50 transition-all duration-300 flex items-center justify-center space-x-2 group"
                >
                  <Icon name="Send" className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                  <span>Подписаться на группу</span>
                </button>
                
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-white/10 hover:bg-white/20 backdrop-blur text-white font-medium py-3 px-6 rounded-xl border border-white/20 transition-all duration-300"
                >
                  Я подписался, проверить
                </button>
                
                <button
                  onClick={() => navigate("/")}
                  className="w-full text-gray-400 hover:text-white font-medium py-2 transition-colors duration-300 flex items-center justify-center space-x-2"
                >
                  <Icon name="ArrowLeft" className="h-4 w-4" />
                  <span>На главную</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-950 via-pink-950 to-black flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxIDAgNiAyLjY5IDYgNnMtMi42OSA2LTYgNi02LTIuNjktNi02IDIuNjktNiA2LTZ6TTI0IDM2YzMuMzEgMCA2IDIuNjkgNiA2cy0yLjY5IDYtNiA2LTYtMi42OS02LTYgMi42OS02IDYtNnoiIGZpbGw9IiNkYzI2MjYiIG9wYWNpdHk9Ii4wNSIvPjwvZz48L3N2Zz4=')] opacity-30"></div>
        
        <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-500">
          <div className="flex flex-col items-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-pink-500 rounded-full blur-2xl opacity-50"></div>
              <div className="relative bg-gradient-to-br from-red-500 to-pink-500 rounded-full p-4">
                <Icon name="AlertCircle" className="h-10 w-10 text-white" />
              </div>
            </div>
            
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">
                Ошибка авторизации
              </h2>
              <p className="text-gray-300 text-sm">
                {error}
              </p>
            </div>

            <div className="w-full space-y-3">
              <button
                onClick={() => navigate("/")}
                className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-red-500/50 transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <Icon name="ArrowLeft" className="h-5 w-5" />
                <span>На главную</span>
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-white/10 hover:bg-white/20 backdrop-blur text-white font-medium py-3 px-6 rounded-xl border border-white/20 transition-all duration-300"
              >
                Попробовать снова
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-teal-950 to-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxIDAgNiAyLjY5IDYgNnMtMi42OSA2LTYgNi02LTIuNjktNi02IDIuNjktNiA2LTZ6TTI0IDM2YzMuMzEgMCA2IDIuNjkgNiA2cy0yLjY5IDYtNiA2LTYtMi42OS02LTYgMi42OS02IDYtNnoiIGZpbGw9IiMwNTk2NjkiIG9wYWNpdHk9Ii4wNSIvPjwvZz48L3N2Zz4=')] opacity-30"></div>
      
      <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-500">
        {userData && (
          <div className="flex flex-col items-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur-2xl opacity-50 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full p-4">
                <Icon name="CheckCircle" className="h-10 w-10 text-white" />
              </div>
            </div>
            
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Вход выполнен!
              </h2>
              <div className="space-y-1">
                <h3 className="text-xl font-semibold text-white">
                  {userData.first_name} {userData.last_name || ""}
                </h3>
                {userData.username && (
                  <p className="text-gray-400 text-sm">@{userData.username}</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
              <div className="bg-blue-500/20 border border-blue-500/30 backdrop-blur px-3 py-1.5 rounded-full flex items-center space-x-1.5">
                <Icon name="Send" className="h-3.5 w-3.5 text-blue-400" />
                <span className="text-xs text-blue-300">Telegram</span>
              </div>
              <div className="bg-emerald-500/20 border border-emerald-500/30 backdrop-blur px-3 py-1.5 rounded-full flex items-center space-x-1.5">
                <Icon name="CheckCircle" className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-xs text-emerald-300">Верифицирован</span>
              </div>
            </div>

            <div className="w-full space-y-3">
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-3">
                  Перенаправление на главную...
                </p>
                <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full animate-progress"></div>
                </div>
              </div>
              
              <button
                onClick={() => navigate("/")}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-emerald-500/50 transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <Icon name="ArrowLeft" className="h-5 w-5" />
                <span>Перейти сейчас</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        .animate-progress {
          animation: progress 2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default AuthCallback;