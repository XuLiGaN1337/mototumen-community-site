import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/contexts/AuthContext";

interface OrganizationFormData {
  organization_name: string;
  organization_type: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  working_hours?: string;
  additional_info?: string;
}

const OrganizationRegister: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<OrganizationFormData>({
    organization_name: "",
    organization_type: "",
    description: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    working_hours: "",
    additional_info: ""
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isAuthenticated || !user) {
      setError("Для подачи заявки необходимо войти в систему");
      return;
    }

    if (!formData.organization_name || !formData.organization_type || !formData.description || !formData.address || !formData.phone) {
      setError("Заполните все обязательные поля");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Токен авторизации не найден. Попробуйте войти заново.');
        return;
      }
      
      const response = await fetch('https://functions.poehali.dev/f34bd996-f5f2-4c81-8b7b-fb5621187a7f?action=organization-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при отправке заявки');
      }

      navigate('/organization-success');
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка при отправке заявки');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
        <div className="text-center">
          <Icon name="Lock" size={64} className="text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-4">Требуется авторизация</h1>
          <p className="text-gray-400 mb-6">
            Для подачи заявки на регистрацию организации необходимо войти в систему
          </p>
          <Button onClick={() => navigate('/')}>
            Вернуться на главную
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-900 via-dark-800 to-dark-900 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant="ghost"
              onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')}
              className="text-gray-400 hover:text-white"
            >
              <Icon name="ArrowLeft" className="mr-2 md:mr-2" size={20} />
              <span className="hidden md:inline">Назад</span>
            </Button>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 font-['Oswald']">
            Регистрация организации
          </h1>
          <p className="text-gray-400">
            Заполните форму ниже. Ваша заявка будет рассмотрена администрацией.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-dark-800 border border-dark-600 rounded-lg p-6 space-y-6">
            <h2 className="text-xl font-semibold text-white mb-4">Основная информация</h2>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Название организации <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="organization_name"
                value={formData.organization_name}
                onChange={handleChange}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#004488]"
                placeholder="Введите название"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Тип организации <span className="text-red-500">*</span>
              </label>
              <select
                name="organization_type"
                value={formData.organization_type}
                onChange={handleChange}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#004488]"
                required
              >
                <option value="">Выберите тип</option>
                <option value="Магазин мототехники">Магазин мототехники</option>
                <option value="Сервис">Сервис / Мастерская</option>
                <option value="Мотошкола">Мотошкола</option>
                <option value="Мотоклуб">Мотоклуб</option>
                <option value="Прокат">Прокат</option>
                <option value="Туристический центр">Туристический центр</option>
                <option value="Другое">Другое</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Описание <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#004488]"
                placeholder="Опишите вашу организацию, услуги, преимущества..."
                required
              />
            </div>
          </div>

          <div className="bg-dark-800 border border-dark-600 rounded-lg p-6 space-y-6">
            <h2 className="text-xl font-semibold text-white mb-4">Контактная информация</h2>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Адрес <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#004488]"
                placeholder="г. Тюмень, ул. Примерная, д. 1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Телефон <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#004488]"
                placeholder="+7 (xxx) xxx-xx-xx"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#004488]"
                placeholder="info@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Веб-сайт
              </label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#004488]"
                placeholder="https://example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Часы работы
              </label>
              <input
                type="text"
                name="working_hours"
                value={formData.working_hours}
                onChange={handleChange}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#004488]"
                placeholder="Пн-Пт: 9:00-18:00, Сб-Вс: выходной"
              />
            </div>
          </div>

          <div className="bg-dark-800 border border-dark-600 rounded-lg p-6 space-y-6">
            <h2 className="text-xl font-semibold text-white mb-4">Дополнительно</h2>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Дополнительная информация
              </label>
              <textarea
                name="additional_info"
                value={formData.additional_info}
                onChange={handleChange}
                rows={3}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#004488]"
                placeholder="Любая дополнительная информация, которую вы хотите сообщить..."
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 flex items-start space-x-3">
              <Icon name="AlertCircle" className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-red-400">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/become-organization')}
              className="text-gray-400 hover:text-white"
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#004488] hover:bg-[#0055aa] text-white font-semibold px-8"
            >
              {isSubmitting ? (
                <>
                  <Icon name="Loader2" className="mr-2 animate-spin" size={20} />
                  Отправка...
                </>
              ) : (
                <>
                  <Icon name="Send" className="mr-2" size={20} />
                  Отправить заявку
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrganizationRegister;