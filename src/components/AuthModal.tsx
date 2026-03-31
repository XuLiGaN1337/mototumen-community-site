import React from "react";
import Icon from "@/components/ui/icon";
import { getYandexAuthUrl } from "@/contexts/AuthContext";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ open, onClose }) => {
  if (!open) return null;

  const handleTelegram = () => {
    onClose();
    window.open("https://t.me/auth_mototyumen_bot?start=auth", "_blank");
  };

  const handleYandex = () => {
    onClose();
    window.location.href = getYandexAuthUrl();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative bg-[#0d1117] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          <Icon name="X" size={18} />
        </button>

        <div className="text-center mb-6">
          <div className="text-3xl mb-2">🏍</div>
          <h2 className="text-white font-bold text-xl">Войти в MotoTyumen</h2>
          <p className="text-gray-400 text-sm mt-1">Выбери способ авторизации</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleTelegram}
            className="w-full flex items-center gap-3 bg-[#0088cc] hover:bg-[#0077bb] text-white font-medium py-3 px-4 rounded-xl transition-all"
          >
            <Icon name="Send" size={20} />
            <span>Войти через Telegram</span>
          </button>

          <button
            onClick={handleYandex}
            className="w-full flex items-center gap-3 bg-[#FC3F1D] hover:bg-[#e03518] text-white font-medium py-3 px-4 rounded-xl transition-all"
          >
            <span className="font-bold text-lg leading-none">Я</span>
            <span>Войти через Яндекс ID</span>
          </button>
        </div>

        <p className="text-gray-600 text-xs text-center mt-5">
          Авторизация доступна участникам сообщества @MotoTyumen
        </p>
      </div>
    </div>
  );
};

export default AuthModal;
