import React from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose,
  message = "Только авторизованные пользователи могут выполнять это действие"
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
      <div className="bg-dark-800 border border-dark-600 rounded-lg p-8 max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <Icon name="X" size={24} />
        </button>
        
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-500/20 rounded-full mb-4">
            <Icon name="Lock" size={32} className="text-yellow-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Требуется авторизация</h2>
          <p className="text-gray-400">
            {message}
          </p>
        </div>
        
        <a
          href="https://t.me/auth_mototyumen_bot?start=auth"
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <Button
            className="w-full bg-[#0088cc] hover:bg-[#0077bb] text-white font-medium py-3"
          >
            <Icon name="Send" className="h-5 w-5 mr-2" />
            Войти через Telegram
          </Button>
        </a>

        <p className="text-center text-xs text-gray-500 mt-4">
          Бот отправит ссылку для входа на сайт
        </p>
      </div>
    </div>
  );
};

export default AuthModal;
