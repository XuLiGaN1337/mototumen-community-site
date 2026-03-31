import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/contexts/AuthContext";

const YandexCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithYandex, linkYandex } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handle = async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state");

      if (!code) {
        setError("Код авторизации не получен");
        return;
      }

      try {
        // Берём токен напрямую из localStorage — не ждём isAuthenticated
        const sessionToken = localStorage.getItem('authToken');
        if (state === "link" && sessionToken) {
          await linkYandex(code, sessionToken);
          navigate("/profile?linked=yandex");
        } else {
          await loginWithYandex(code);
          setTimeout(() => navigate("/"), 1500);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ошибка авторизации");
      }
    };

    handle();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-950 via-pink-950 to-black flex items-center justify-center p-4">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 max-w-md w-full text-center space-y-4">
          <div className="bg-red-500/20 rounded-full p-4 w-16 h-16 mx-auto flex items-center justify-center">
            <Icon name="AlertCircle" className="h-8 w-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Ошибка авторизации</h2>
          <p className="text-gray-400 text-sm">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="w-full bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl transition-all"
          >
            На главную
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-purple-950 to-black flex items-center justify-center p-4">
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 max-w-md w-full text-center space-y-6">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-red-500 border-r-yellow-500 mx-auto" />
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-red-400 to-yellow-400 bg-clip-text text-transparent">
            Авторизация через Яндекс
          </h2>
          <p className="text-gray-400 text-sm mt-2">Проверяем данные...</p>
        </div>
      </div>
    </div>
  );
};

export default YandexCallback;