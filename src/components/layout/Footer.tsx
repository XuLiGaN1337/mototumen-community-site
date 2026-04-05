import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";

interface FooterLink {
  href: string;
  label: string;
}

const serviceLinks: FooterLink[] = [
  { href: "/shop", label: "Магазин" },
  { href: "/service", label: "Сервис" },
  { href: "/schools", label: "Мотошколы" },
  { href: "/ads", label: "Объявления" },
];

const socialLinks = [
  {
    label: "VK",
    url: "https://vk.com/mototyumen_offical",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-6 w-6 fill-current"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12.785 16.241s.288-.032.436-.194c.136-.148.132-.427.132-.427s-.02-1.304.587-1.496c.598-.19 1.366 1.26 2.182 1.816.616.422 1.084.33 1.084.33l2.178-.03s1.138-.071.599-1.966c-.044-.148-.312-.661-1.6-1.87-1.347-1.264-1.168-1.059.456-3.246.988-1.315 1.382-2.118 1.258-2.462-.118-.327-.84-.24-.84-.24l-2.453.015s-.181-.025-.316.056c-.132.079-.217.264-.217.264s-.382 1.022-.892 1.89c-1.076 1.83-1.506 1.927-1.682 1.814-.41-.264-.307-1.062-.307-1.629 0-1.771.268-2.508-.523-2.699-.263-.064-.456-.106-1.128-.113-.862-.009-1.591.003-2.004.205-.275.134-.487.432-.357.449.159.021.521.098.714.36.248.34.239 1.104.239 1.104s.142 2.084-.333 2.344c-.326.176-.773-.183-1.733-1.829-.491-.85-.862-1.79-.862-1.79s-.072-.177-.202-.272c-.157-.115-.377-.151-.377-.151l-2.33.015s-.35.01-.479.163c-.114.136-.009.417-.009.417s1.826 4.27 3.893 6.422c1.896 1.973 4.047 1.843 4.047 1.843h.975z" />
      </svg>
    ),
  },
  {
    label: "Telegram",
    url: "https://t.me/MotoTyumen",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-6 w-6 fill-current"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
  },
  {
    label: "Max",
    url: "https://max.ru/join/UqSs-h73ylfyovbW-V_aGBPLcn0EFdCEGStjg4_-8u8",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-6 w-6 fill-current"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.5 14h-1.75l-2.75-3.5-2.75 3.5H7.5l3.625-4.5L7.5 8h1.75l2.75 3.25L14.75 8H16.5l-3.625 4.5L16.5 16z" />
      </svg>
    ),
  },
];

const contactInfo = [
  "г. Тюмень, ул. Республики, 142",
  "+7 (3452) 123-456",
  "info@mototyumen.ru",
];

const Footer: React.FC = () => {
  const handleJoinTelegram = () => {
    window.open("https://t.me/MotoTyumen", "_blank");
  };

  return (
    <footer className="bg-black py-6 sm:py-8 md:py-12 px-4">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
          {/* Brand Section */}
          <div>
            <h3
              className="text-lg sm:text-xl font-bold mb-3 sm:mb-4"
              style={{ fontFamily: "Oswald, sans-serif" }}
            >
              МОТОТюмень
            </h3>
            <p
              className="text-zinc-400 text-sm sm:text-base mb-3 sm:mb-4"
              style={{ fontFamily: "Open Sans, sans-serif" }}
            >
              Крупнейшее мотосообщество Тюмени. Объединяем байкеров с 2024 года.
            </p>
            <div className="flex space-x-3 sm:space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={social.label}
                  className="text-accent hover:text-accent/80 transition-colors"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Services Section */}
          <div>
            <h4
              className="text-lg font-semibold mb-4"
              style={{ fontFamily: "Oswald, sans-serif" }}
            >
              Услуги
            </h4>
            <ul
              className="space-y-2 text-zinc-400"
              style={{ fontFamily: "Open Sans, sans-serif" }}
            >
              {serviceLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="hover:text-accent transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacts Section */}
          <div>
            <h4
              className="text-lg font-semibold mb-4"
              style={{ fontFamily: "Oswald, sans-serif" }}
            >
              Контакты
            </h4>
            <ul
              className="space-y-2 text-zinc-400"
              style={{ fontFamily: "Open Sans, sans-serif" }}
            >
              {contactInfo.map((info, index) => (
                <li key={index}>{info}</li>
              ))}
            </ul>
          </div>

          {/* Join Section */}
          <div>
            <h4
              className="text-lg font-semibold mb-4"
              style={{ fontFamily: "Oswald, sans-serif" }}
            >
              Присоединяйтесь
            </h4>
            <p
              className="text-zinc-400 mb-4"
              style={{ fontFamily: "Open Sans, sans-serif" }}
            >
              Станьте частью нашего сообщества
            </p>
            <Button
              className="bg-accent hover:bg-accent/90 text-white w-full"
              onClick={handleJoinTelegram}
            >
              <Icon name="MessageCircle" className="h-4 w-4 mr-2" />
              Telegram канал
            </Button>
          </div>
        </div>

        {/* Legal Links & Copyright */}
        <div className="border-t border-zinc-800 mt-6 sm:mt-8 pt-5 sm:pt-6 space-y-3">
          <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-2 sm:gap-3 text-xs sm:text-sm text-zinc-400">
            <Link
              to="/docs"
              className="hover:text-accent transition-colors font-medium text-zinc-300"
            >
              Документация
            </Link>
            <span className="hidden sm:inline text-zinc-700">•</span>
            <Link to="/privacy" className="hover:text-accent transition-colors">
              Политика конфиденциальности
            </Link>
            <span className="hidden sm:inline text-zinc-700">•</span>
            <Link to="/terms" className="hover:text-accent transition-colors">
              Пользовательское соглашение
            </Link>
            <span className="hidden sm:inline text-zinc-700">•</span>
            <Link
              to="/disclaimer"
              className="hover:text-accent transition-colors"
            >
              Отказ от ответственности
            </Link>
          </div>
          <p
            className="text-center text-xs sm:text-sm text-zinc-400"
            style={{ fontFamily: "Open Sans, sans-serif" }}
          >
            © 2026 МОТОТюмень. Все права защищены.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
export { Footer };
