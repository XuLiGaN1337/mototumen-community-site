import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

interface Section {
  id: string;
  icon: string;
  title: string;
  content: React.ReactNode;
}

const sections: Section[] = [
  {
    id: "roles",
    icon: "Shield",
    title: "Роли и права",
    content: (
      <div className="space-y-6">
        <p className="text-zinc-400">Каждый пользователь имеет основную роль и может дополнительно получить статус организации или продавца ZM Store.</p>

        <div className="space-y-4">
          {[
            {
              emoji: "👤",
              role: "Пользователь",
              badge: "bg-zinc-700 text-zinc-300",
              desc: "Базовая роль для всех зарегистрированных участников.",
              can: [
                "Просматривать профили, магазины, мотошколы, сервисы",
                "Публиковать объявления на мото-авито",
                "Добавлять технику в гараж",
                "Добавлять места в избранное и друзей",
                "Иметь персональный ID профиля и ссылку /u/:id",
                "Загружать фото в галерею профиля",
              ],
            },
            {
              emoji: "🛡️",
              role: "Модератор",
              badge: "bg-blue-900/50 text-blue-300",
              desc: "Помогает поддерживать порядок в сообществе.",
              can: ["Всё, что может пользователь", "Модерация контента и объявлений", "Работа с жалобами участников"],
            },
            {
              emoji: "⚡",
              role: "Администратор",
              badge: "bg-red-900/50 text-red-300",
              desc: "Управляет платформой и её содержимым.",
              can: [
                "Всё, что может модератор",
                "Управление пользователями и ролями",
                "Редактирование контента и фильтров категорий",
                "Доступ к панели администратора",
                "Управление товарами и продавцами ZM Store",
              ],
            },
            {
              emoji: "👑",
              role: "CEO",
              badge: "bg-yellow-900/50 text-yellow-300",
              desc: "Главный администратор платформы. Полный доступ без ограничений.",
              can: [
                "Полный доступ ко всем функциям",
                "Одобрение и отклонение заявок на организацию",
                "Управление ролями всех пользователей",
                "Назначение продавцов ZM Store",
                "Удаление любого контента",
              ],
            },
            {
              emoji: "🏢",
              role: "Организация (доп. статус)",
              badge: "bg-blue-900/50 text-blue-400",
              desc: "Дополнительный статус — работает вместе с любой другой ролью. Появляется после одобрения заявки CEO.",
              can: [
                "Управление своей организацией (редактирование данных)",
                "Добавление карточек товаров, услуг или курсов",
                "Отображение в каталоге магазинов, сервисов или мотошкол",
                "Бейдж 🏢 и название организации в профиле",
              ],
            },
            {
              emoji: "🛒",
              role: "Продавец ZM Store (доп. доступ)",
              badge: "bg-orange-900/50 text-orange-300",
              desc: "Специальный доступ к панели управления ZM Store. Назначается CEO через /zm-store.",
              can: [
                "Добавление и редактирование товаров ZM Store",
                "Загрузка фото товаров",
                "Управление наличием и ценами",
                "Доступ к панели /zm-store",
              ],
            },
          ].map((item) => (
            <div key={item.role} className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{item.emoji}</span>
                <span className={`text-sm font-semibold px-2.5 py-0.5 rounded-full ${item.badge}`}>{item.role}</span>
              </div>
              <p className="text-zinc-400 text-sm mb-3">{item.desc}</p>
              <ul className="space-y-1.5">
                {item.can.map((c) => (
                  <li key={c} className="flex items-start gap-2 text-sm text-zinc-300">
                    <Icon name="Check" size={14} className="text-accent mt-0.5 flex-shrink-0" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "how-to",
    icon: "BookOpen",
    title: "Как это работает",
    content: (
      <div className="space-y-6">
        {[
          {
            icon: "UserPlus",
            title: "Регистрация и вход",
            steps: [
              "Нажмите «Войти» в правом верхнем углу",
              "Выберите способ: через Telegram, VK, Яндекс или email/пароль",
              "После входа вы получаете роль «Пользователь»",
              "Заполните профиль: фото, позывной, гараж, персональный ID",
            ],
          },
          {
            icon: "AtSign",
            title: "Персональный ID и ссылка на профиль",
            steps: [
              "После входа перейдите в «Профиль» — там блок «Мой ID»",
              "Сейчас ваш ID — числовой (#5). Один раз бесплатно можно сменить на красивый",
              "Вводите только латиницу, цифры и _ (минимум 3 символа)",
              "Нажмите «Проверить» — убедитесь что ID свободен, затем «Сохранить»",
              "После сохранения изменить нельзя. Ваша ссылка: /u/ваш_id",
              "Тыкая на имя любого участника — открывается мини-профиль с его данными",
            ],
          },
          {
            icon: "Building2",
            title: "Как зарегистрировать организацию",
            steps: [
              "Войдите в аккаунт и перейдите в «Личный кабинет»",
              "Откройте вкладку «Организация»",
              "Нажмите «Подать заявку» и заполните форму",
              "Дождитесь одобрения от CEO (обычно до 24 часов)",
              "После одобрения вы получаете статус 🏢 и можете управлять организацией",
            ],
          },
          {
            icon: "Store",
            title: "Как добавить карточку в каталог",
            steps: [
              "Зайдите в «Личный кабинет» → «Организация»",
              "В разделе «Карточки» нажмите «Добавить карточку»",
              "Заполните название, описание, фото, цену, контакты",
              "Карточка сразу появляется в соответствующем разделе (Магазин / Сервис / Мотошкола)",
            ],
          },
          {
            icon: "Megaphone",
            title: "Мото-авито: объявления",
            steps: [
              "Перейдите в «Полезное» → «Объявления»",
              "Нажмите кнопку «Подать объявление» — она всегда видна внизу экрана",
              "Выберите категорию, заполните данные и укажите Telegram-контакт",
              "Объявление появляется в разделе «Опубликованные» сразу",
              "Во вкладке «Мои объявления» можно видеть и удалять свои",
              "Контакт автора виден только авторизованным пользователям",
            ],
          },
          {
            icon: "Image",
            title: "Фото профиля и гараж",
            steps: [
              "В профиле раздел «Фото профиля» — можно загрузить до 3 фото",
              "Любое фото из галереи можно сделать аватаром одним нажатием",
              "В «Гараже» добавляйте технику: марка, модель, год, фото (до 5 шт), пробег, мощность",
              "Техника из гаража видна другим участникам в вашем профиле",
            ],
          },
          {
            icon: "Users",
            title: "Друзья и сообщество",
            steps: [
              "Нажмите на имя участника — откроется его мини-профиль",
              "Нажмите «Добавить в друзья» — он получит уведомление",
              "После принятия заявки вы видите друг друга в списке друзей",
              "Ссылку на свой профиль можно скопировать: /u/ваш_id",
            ],
          },
        ].map((block) => (
          <div key={block.title} className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Icon name={block.icon as "UserPlus"} size={18} className="text-accent" />
              <h3 className="font-semibold text-white">{block.title}</h3>
            </div>
            <ol className="space-y-2">
              {block.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-zinc-300">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-bold mt-0.5">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "catalog",
    icon: "Map",
    title: "Каталог организаций",
    content: (
      <div className="space-y-4">
        <p className="text-zinc-400">Платформа объединяет три типа организаций мотосообщества. Категории фильтров настраиваются администраторами через панель управления.</p>
        {[
          { emoji: "🛒", name: "Магазин", desc: "Продажа мотоциклов, экипировки, запчастей и аксессуаров. Организации с категорией «Магазин» отображаются во вкладке «Магазин»." },
          { emoji: "🔧", name: "Сервис", desc: "Техническое обслуживание, ремонт, тюнинг мотоциклов. Категория «Сервис»." },
          { emoji: "🏫", name: "Мотошкола", desc: "Обучение вождению, курсы, тренировки. Категория «Мотошкола»." },
        ].map((cat) => (
          <div key={cat.name} className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-5 flex gap-4">
            <span className="text-3xl flex-shrink-0">{cat.emoji}</span>
            <div>
              <h3 className="font-semibold text-white mb-1">{cat.name}</h3>
              <p className="text-sm text-zinc-400">{cat.desc}</p>
            </div>
          </div>
        ))}
        <div className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-5">
          <p className="text-sm text-zinc-400">
            <span className="text-white font-medium">Попасть в каталог</span> — подайте заявку на регистрацию организации через личный кабинет. После одобрения CEO ваша организация появится в соответствующем разделе.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "zmstore",
    icon: "ShoppingBag",
    title: "ZM Store",
    content: (
      <div className="space-y-4">
        <p className="text-zinc-400">ZM Store — официальный магазин платформы с управлением через панель продавца.</p>

        {[
          {
            icon: "Store",
            title: "Что такое ZM Store",
            text: "Отдельный магазин платформы с отдельным управлением. Товары магазина доступны публично. Управлять товарами могут только назначенные продавцы и CEO.",
          },
          {
            icon: "Package",
            title: "Управление товарами",
            text: "Продавцы заходят по адресу /zm-store. Там можно: добавить новый товар (название, бренд, артикул, цена, категория, фото), редактировать существующие, удалять, менять статус наличия. Фото загружается напрямую с устройства.",
          },
          {
            icon: "UserPlus",
            title: "Как стать продавцом ZM Store",
            text: "Только CEO может назначить продавца. Для этого CEO заходит в /zm-store → вкладка «Продавцы» → «Добавить продавца» и вводит числовой ID пользователя из системы. Продавца можно деактивировать или удалить в любой момент.",
          },
          {
            icon: "Tag",
            title: "Категории товаров",
            text: "Масла и смазки, Тормозная система, Привод, Система впуска, Подвеска, Электрика, Экипировка, Запчасти, Аксессуары, Другое.",
          },
        ].map((item) => (
          <div key={item.title} className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-5 flex gap-4">
            <Icon name={item.icon as "Store"} size={20} className="text-accent flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-white mb-1">{item.title}</h3>
              <p className="text-sm text-zinc-400">{item.text}</p>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "filters",
    icon: "SlidersHorizontal",
    title: "Фильтры и категории",
    content: (
      <div className="space-y-4">
        <p className="text-zinc-400">Администраторы могут управлять списками категорий для каждого раздела сайта в режиме реального времени.</p>
        {[
          { icon: "Megaphone", title: "Объявления", text: "Категории для мото-авито: Продажа, Покупка, Попутчики, Услуги, Обучение, Эвакуатор, Общее. Можно добавлять и удалять." },
          { icon: "Store", title: "Магазины", text: "Категории для карточек в каталоге магазинов. Редактируются в разделе «Фильтры» панели администратора." },
          { icon: "Wrench", title: "Сервисы и мотошколы", text: "Отдельные списки категорий для сервисных центров и школ вождения." },
        ].map((item) => (
          <div key={item.title} className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-5 flex gap-4">
            <Icon name={item.icon as "Store"} size={20} className="text-accent flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-white mb-1">{item.title}</h3>
              <p className="text-sm text-zinc-400">{item.text}</p>
            </div>
          </div>
        ))}
        <div className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-5">
          <p className="text-sm text-zinc-400">
            <span className="text-white font-medium">Где настраивать</span> — Панель администратора → вкладка 🏷️ Фильтры. Изменения применяются мгновенно на всём сайте.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "safety",
    icon: "AlertTriangle",
    title: "Безопасность и правила",
    content: (
      <div className="space-y-4">
        {[
          { icon: "ShieldCheck", title: "Персональные данные", text: "Мы не передаём ваши данные третьим лицам. Телефон, email и контакты видны только вам и администраторам платформы." },
          { icon: "Eye", title: "Контакты в объявлениях", text: "Контакты авторов объявлений доступны только авторизованным пользователям — это защищает от спама и ботов." },
          { icon: "AtSign", title: "Персональный ID", text: "Никнейм устанавливается один раз бесплатно и не может быть изменён. Выбирайте внимательно — только латиница, цифры и символ _." },
          { icon: "Flag", title: "Запрещённый контент", text: "Запрещено публиковать объявления с незаконными товарами, спамом, оскорблениями. Нарушители блокируются без предупреждения." },
          { icon: "MessageCircle", title: "Споры и жалобы", text: "По всем вопросам и жалобам обращайтесь к администрации через Telegram-канал @MotoTyumen." },
        ].map((item) => (
          <div key={item.title} className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-5 flex gap-4">
            <Icon name={item.icon as "ShieldCheck"} size={20} className="text-accent flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-white mb-1">{item.title}</h3>
              <p className="text-sm text-zinc-400">{item.text}</p>
            </div>
          </div>
        ))}
      </div>
    ),
  },
];

const Docs: React.FC = () => {
  const navigate = useNavigate();
  const [active, setActive] = useState("roles");

  const current = sections.find(s => s.id === active)!;

  return (
    <div className="min-h-screen bg-zinc-900 text-foreground">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 text-zinc-400 hover:text-white">
          <Icon name="ArrowLeft" className="h-4 w-4 mr-2" />
          Назад
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 font-['Oswald']">Документация</h1>
          <p className="text-zinc-400">Всё о платформе МОТОТюмень: роли, функции и правила</p>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <aside className="md:w-60 flex-shrink-0">
            <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
              {sections.map(s => (
                <button
                  key={s.id}
                  onClick={() => setActive(s.id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors text-left ${
                    active === s.id
                      ? "bg-accent text-white"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                  }`}
                >
                  <Icon name={s.icon as "Shield"} size={16} className="flex-shrink-0" />
                  {s.title}
                </button>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <main className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                <Icon name={current.icon as "Shield"} size={16} className="text-accent" />
              </div>
              <h2 className="text-xl font-bold text-white">{current.title}</h2>
            </div>
            {current.content}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Docs;
