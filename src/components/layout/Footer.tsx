import React from "react";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";

interface FooterLink {
  href: string;
  label: string;
}

const serviceLinks: FooterLink[] = [
  { href: "#shop", label: "Магазин" },
  { href: "#service", label: "Сервис" },
  { href: "#schools", label: "Мотошколы" },
  { href: "#ads", label: "Объявления" },
];

const socialIcons = [
  { name: "MessageCircle", label: "Telegram" },
  { name: "Instagram", label: "Instagram" },
  { name: "Youtube", label: "YouTube" },
] as const;

const contactInfo = [
  "г. Тюмень, ул. Республики, 142",
  "+7 (3452) 123-456",
  "info@mototyumen.ru",
];

const Footer: React.FC = () => {
  const handleSocialClick = (socialName: string) => {
    // TODO: Implement social media navigation
    console.log(`${socialName} clicked`);
  };

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
              {socialIcons.map((social) => (
                <Icon
                  key={social.name}
                  name={social.name}
                  className="h-6 w-6 text-accent cursor-pointer hover:text-accent/80 transition-colors"
                  onClick={() => handleSocialClick(social.label)}
                />
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
                  <a
                    href={link.href}
                    className="hover:text-accent transition-colors"
                  >
                    {link.label}
                  </a>
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
            <a href="/privacy" className="hover:text-accent transition-colors">
              Политика конфиденциальности
            </a>
            <span className="hidden sm:inline text-zinc-700">•</span>
            <a href="/terms" className="hover:text-accent transition-colors">
              Пользовательское соглашение
            </a>
            <span className="hidden sm:inline text-zinc-700">•</span>
            <a href="/disclaimer" className="hover:text-accent transition-colors">
              Отказ от ответственности
            </a>
          </div>
          <p className="text-center text-xs sm:text-sm text-zinc-400" style={{ fontFamily: "Open Sans, sans-serif" }}>
            © 2024 МОТОТюмень. Все права защищены.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
export { Footer };