import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';

const AdminCard: React.FC = () => {
  const navigate = useNavigate();

  const actions = [
    { icon: 'Plus', label: 'Добавить товар', path: '/zm-store/product/new', color: 'from-blue-600 to-blue-500' },
    { icon: 'Package', label: 'Все товары', path: '/zm-store', color: 'from-[#004488] to-blue-700' },
  ];

  return (
    <div
      onClick={() => navigate('/zm-store')}
      className="group relative bg-dark-900/50 backdrop-blur-sm border border-[#004488]/40 rounded-2xl overflow-hidden cursor-pointer hover:border-[#004488] transition-all duration-300 hover:shadow-xl hover:shadow-[#004488]/30 hover:-translate-y-1"
    >
      {/* Фон-декор */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#004488]/10 to-purple-900/10 group-hover:from-[#004488]/20 group-hover:to-purple-900/20 transition-all duration-300" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#004488]/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />

      <div className="relative p-6 flex flex-col h-full min-h-[22rem]">
        {/* Заголовок */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-gradient-to-br from-[#004488] to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-[#004488]/40">
            <Icon name="Settings" size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg leading-tight">Панель управления</h3>
            <p className="text-gray-400 text-xs">ZM Store Admin</p>
          </div>
        </div>

        {/* Быстрые действия */}
        <div className="space-y-3 flex-1">
          {actions.map((a) => (
            <button
              key={a.path}
              onClick={(e) => { e.stopPropagation(); navigate(a.path); }}
              className={`w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r ${a.color} rounded-xl text-white text-sm font-medium shadow-md hover:opacity-90 hover:scale-[1.02] transition-all duration-200`}
            >
              <Icon name={a.icon} size={16} />
              {a.label}
            </button>
          ))}
        </div>

        {/* Подпись */}
        <div className="mt-5 pt-4 border-t border-[#004488]/20 flex items-center justify-between">
          <span className="text-xs text-gray-500">Только для персонала</span>
          <div className="flex items-center gap-1 text-[#4499ff] text-xs font-medium group-hover:gap-2 transition-all">
            <span>Открыть</span>
            <Icon name="ArrowRight" size={12} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCard;
