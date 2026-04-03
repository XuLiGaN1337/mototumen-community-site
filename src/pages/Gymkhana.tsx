import React, { useRef, useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Icon from "@/components/ui/icon";

const HISTORY_POINTS = [
  {
    year: "2018",
    title: "Рождение идеи",
    text: "Первые энтузиасты привезли в Тюмень идею джимханы из Екатеринбурга. Небольшая группа из пяти человек встретилась на парковке ТЦ и попробовала первые фигуры на размеченной конусами площадке.",
    side: "left",
    icon: "Lightbulb",
  },
  {
    year: "2019",
    title: "Первые тренировки",
    text: "Регулярные встречи по воскресеньям. Площадка у стадиона «Геолог» стала постоянной базой. Количество участников выросло до 20 человек. Появились первые правила и классификация фигур.",
    side: "right",
    icon: "Flag",
  },
  {
    year: "2020",
    title: "Пауза и осмысление",
    text: "Пандемия остановила очные встречи, но не остановила сообщество. Онлайн-разборы техники, видеоуроки и планирование будущих сезонов сплотили участников ещё сильнее.",
    side: "left",
    icon: "Pause",
  },
  {
    year: "2021",
    title: "Возвращение и рост",
    text: "Сезон открылся рекордным числом участников — 45 человек. Первый официальный этап джимханы с судьями и хронометражем. MotoGymkhana Tyumen стала официальным названием клуба.",
    side: "right",
    icon: "TrendingUp",
  },
  {
    year: "2022",
    title: "Выход на уровень",
    text: "Команда Тюмени приняла участие в Чемпионате УрФО. Первые призовые места. Открытие сезона превратилось в городское событие с более чем 200 зрителями.",
    side: "left",
    icon: "Trophy",
  },
  {
    year: "2023",
    title: "Школа и обучение",
    text: "Запуск программы обучения для новичков. Более 60 человек прошли вводный курс. Партнёрство с мотошколами города. Постоянная площадка с разметкой и инвентарём.",
    side: "right",
    icon: "GraduationCap",
  },
  {
    year: "2024",
    title: "Сегодня",
    text: "Сообщество насчитывает более 150 активных участников. Еженедельные тренировки, ежемесячные соревнования, выезды на федеральные этапы. Джимхана — неотъемлемая часть мотожизни Тюмени.",
    side: "left",
    icon: "Star",
  },
];

const CALENDAR = [
  {
    date: "12 апр",
    day: "суббота",
    title: "Открытая тренировка",
    time: "11:00 – 15:00",
    location: "ул. Мельникайте, 110 (парковка)",
    type: "free",
    spots: "∞",
  },
  {
    date: "19 апр",
    day: "суббота",
    title: "Мастер-класс: Разворот 180°",
    time: "12:00 – 16:00",
    location: "ул. Мельникайте, 110 (парковка)",
    type: "paid",
    price: "500 ₽",
    spots: "12",
  },
  {
    date: "26 апр",
    day: "суббота",
    title: "Этап #1. Городские соревнования",
    time: "10:00 – 18:00",
    location: "Стадион «Геолог»",
    type: "paid",
    price: "800 ₽",
    spots: "30",
  },
  {
    date: "3 мая",
    day: "суббота",
    title: "Открытая тренировка",
    time: "11:00 – 15:00",
    location: "ул. Мельникайте, 110 (парковка)",
    type: "free",
    spots: "∞",
  },
  {
    date: "10 мая",
    day: "суббота",
    title: "Разбор техники для новичков",
    time: "10:00 – 13:00",
    location: "ул. Мельникайте, 110 (парковка)",
    type: "free",
    spots: "15",
  },
  {
    date: "17 мая",
    day: "суббота",
    title: "Мастер-класс: Восьмёрка и змейка",
    time: "12:00 – 16:00",
    location: "ул. Мельникайте, 110 (парковка)",
    type: "paid",
    price: "500 ₽",
    spots: "12",
  },
  {
    date: "24 мая",
    day: "суббота",
    title: "Этап #2. Городские соревнования",
    time: "10:00 – 18:00",
    location: "Стадион «Геолог»",
    type: "paid",
    price: "800 ₽",
    spots: "30",
  },
];

const Gymkhana: React.FC = () => {
  const aboutRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<"all" | "free" | "paid">("all");

  const filtered = CALENDAR.filter(
    (e) => filter === "all" || e.type === filter
  );

  return (
    <PageLayout>
      {/* ─── HERO ─── */}
      <section className="relative bg-dark-900 text-white overflow-hidden" style={{ minHeight: "92vh" }}>
        {/* фоновый градиент */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#001830] via-dark-900 to-black" />
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #004488 0%, transparent 50%), radial-gradient(circle at 80% 20%, #004488 0%, transparent 40%)" }} />

        <div className="relative z-10 container mx-auto px-4 flex flex-col items-center justify-center text-center" style={{ minHeight: "92vh" }}>
          <Badge className="mb-6 bg-[#004488]/20 border border-[#004488] text-[#4488cc] text-sm px-4 py-1">
            Тюмень • с 2018 года
          </Badge>
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black font-['Oswald'] tracking-tight mb-4 leading-none">
            МОТО<br />
            <span className="text-[#004488]">ДЖИМХАНА</span>
          </h1>
          <p className="text-gray-400 text-lg sm:text-xl max-w-xl mx-auto mb-10">
            Искусство точного управления мотоциклом. Скорость — не главное. Точность — всё.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => calendarRef.current?.scrollIntoView({ behavior: "smooth" })}
              className="px-8 py-3 bg-[#004488] hover:bg-[#0055aa] text-white font-semibold rounded-lg transition-colors"
            >
              Записаться на тренировку
            </button>
            <button
              onClick={() => aboutRef.current?.scrollIntoView({ behavior: "smooth" })}
              className="px-8 py-3 border border-zinc-600 text-zinc-300 hover:text-white hover:border-zinc-400 font-semibold rounded-lg transition-colors"
            >
              Узнать больше
            </button>
          </div>

          {/* Скрол-подсказка */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center text-zinc-600 animate-bounce">
            <span className="text-xs mb-1">История</span>
            <Icon name="ChevronDown" size={20} />
          </div>
        </div>
      </section>

      {/* ─── ИСТОРИЯ / КАРТА МАРШРУТА ─── */}
      <section className="bg-dark-900 py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black font-['Oswald'] text-white mb-3">
              ПУТЬ <span className="text-[#004488]">ДЖИМХАНЫ</span>
            </h2>
            <p className="text-zinc-400">От первой конусной площадки до городского чемпионата</p>
          </div>

          {/* Вертикальная линия-маршрут */}
          <div className="relative">
            {/* центральная линия */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#004488] via-[#004488]/50 to-transparent -translate-x-1/2 hidden sm:block" />

            <div className="space-y-0">
              {HISTORY_POINTS.map((point, i) => (
                <div key={i} className={`relative flex items-center gap-6 sm:gap-0 ${point.side === "left" ? "sm:flex-row" : "sm:flex-row-reverse"}`}>
                  {/* контент */}
                  <div className={`flex-1 sm:py-8 ${point.side === "left" ? "sm:pr-12 sm:text-right" : "sm:pl-12 sm:text-left"}`}>
                    <div className={`inline-block mb-2`}>
                      <span className="text-[#004488] font-black text-2xl font-['Oswald']">{point.year}</span>
                    </div>
                    <h3 className="text-white font-bold text-lg mb-2">{point.title}</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed">{point.text}</p>
                  </div>

                  {/* иконка на линии */}
                  <div className="hidden sm:flex relative z-10 w-12 h-12 flex-shrink-0 items-center justify-center rounded-full bg-[#004488] border-4 border-dark-900 shadow-lg shadow-[#004488]/30">
                    <Icon name={point.icon as "Star"} size={18} className="text-white" />
                  </div>

                  {/* пустая правая/левая половина */}
                  <div className="hidden sm:block flex-1" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── О КЛУБЕ ─── */}
      <section ref={aboutRef} className="bg-zinc-900 py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black font-['Oswald'] text-white mb-3">
              KTO TAKOE <span className="text-[#004488]">MOTOGYMKHANA TYUMEN</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              {
                icon: "Users",
                title: "Сообщество",
                text: "Более 150 активных участников. Открыты для всех — от новичков до опытных гонщиков. Главное — желание развиваться.",
              },
              {
                icon: "Target",
                title: "Дисциплина",
                text: "Джимхана — это точность, а не скорость. Прохождение конусных фигур на время без штрафных секунд за сбитые конусы.",
              },
              {
                icon: "Award",
                title: "Соревнования",
                text: "Городской чемпионат с 7 этапами в сезоне. Участие в Чемпионате УрФО. Собственная система классификации и рейтинга.",
              },
            ].map((item, i) => (
              <Card key={i} className="bg-dark-800 border-zinc-700">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-[#004488]/20 border border-[#004488]/40 flex items-center justify-center mx-auto mb-4">
                    <Icon name={item.icon as "Users"} size={22} className="text-[#4488cc]" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-zinc-400 text-sm">{item.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Организаторы */}
          <div className="bg-dark-800 border border-zinc-700 rounded-xl p-8">
            <h3 className="text-white font-black text-xl font-['Oswald'] mb-6 text-center">
              ОРГАНИЗАТОРЫ
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                {
                  name: "Андрей Кулик",
                  role: "Основатель клуба",
                  desc: "Привёз джимхану в Тюмень в 2018 году. Участник чемпионатов России.",
                  tg: "@kulik_moto",
                },
                {
                  name: "Команда MotoGymkhana",
                  role: "Судьи и инструкторы",
                  desc: "8 сертифицированных инструкторов и судей с опытом федеральных соревнований.",
                  tg: "@motogym_tumen",
                },
              ].map((org, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#004488]/20 border border-[#004488]/40 flex items-center justify-center flex-shrink-0">
                    <Icon name="User" size={20} className="text-[#4488cc]" />
                  </div>
                  <div>
                    <p className="text-white font-bold">{org.name}</p>
                    <p className="text-[#4488cc] text-sm mb-1">{org.role}</p>
                    <p className="text-zinc-400 text-sm mb-2">{org.desc}</p>
                    <a
                      href={`https://t.me/${org.tg.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-zinc-500 hover:text-[#4488cc] transition-colors"
                    >
                      {org.tg}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── КАЛЕНДАРЬ ─── */}
      <section ref={calendarRef} className="bg-dark-900 py-16 px-4 pb-24">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-black font-['Oswald'] text-white mb-3">
              КАЛЕНДАРЬ <span className="text-[#004488]">ТРЕНИРОВОК</span>
            </h2>
            <p className="text-zinc-400 text-sm">Апрель — Май 2026</p>
          </div>

          {/* Фильтр */}
          <div className="flex gap-2 justify-center mb-8">
            {(["all", "free", "paid"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f
                    ? "bg-[#004488] text-white"
                    : "bg-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                {f === "all" ? "Все" : f === "free" ? "Бесплатные" : "Платные"}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filtered.map((event, i) => (
              <div
                key={i}
                className="bg-zinc-800 border border-zinc-700 hover:border-[#004488]/50 rounded-xl p-4 sm:p-5 flex gap-4 transition-colors"
              >
                {/* Дата */}
                <div className="flex-shrink-0 text-center w-14">
                  <div className="text-[#004488] font-black text-xl font-['Oswald'] leading-none">
                    {event.date.split(" ")[0]}
                  </div>
                  <div className="text-zinc-500 text-xs uppercase">
                    {event.date.split(" ")[1]}
                  </div>
                  <div className="text-zinc-600 text-xs mt-1">{event.day}</div>
                </div>

                {/* Разделитель */}
                <div className="w-px bg-zinc-700 flex-shrink-0" />

                {/* Инфо */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-white font-bold text-sm sm:text-base">{event.title}</h3>
                    {event.type === "free" ? (
                      <Badge className="bg-green-900/40 text-green-400 border border-green-800 text-xs flex-shrink-0">
                        Бесплатно
                      </Badge>
                    ) : (
                      <Badge className="bg-[#004488]/30 text-[#4488cc] border border-[#004488]/50 text-xs flex-shrink-0">
                        {event.price}
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Icon name="Clock" size={12} />
                      {event.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <Icon name="MapPin" size={12} />
                      {event.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Icon name="Users" size={12} />
                      {event.spots === "∞" ? "без ограничений" : `осталось мест: ${event.spots}`}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-10 text-center">
            <p className="text-zinc-500 text-sm mb-4">Вопросы по расписанию и регистрации</p>
            <a
              href="https://t.me/motogym_tumen"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#004488] hover:bg-[#0055aa] text-white font-semibold rounded-lg transition-colors"
            >
              <Icon name="Send" size={16} />
              Написать в Telegram
            </a>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Gymkhana;
