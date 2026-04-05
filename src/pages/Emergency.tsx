import Footer from "@/components/layout/Footer";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

const Emergency = () => {
  const emergencyServices = [
    { name: "Скорая помощь", number: "103" },
    { name: "Полиция", number: "102" },
    { name: "МЧС", number: "101" },
    { name: "Единый номер экстренных служб", number: "112" },
    { name: "Телефон доверия", number: "8-800-2000-122" },
  ];

  const evacuators = [
    { name: 'Мото-Помощь (круглосуточно)', number: '+7 (912) 345-67-89' },
    { name: 'Эвакуатор "Два колеса"', number: '+7 (922) 123-45-67' },
    { name: 'Техпомощь на дороге', number: '+7 (3452) 11-22-33' },
  ];

  const legal = [
    { name: 'Мотоадвокат (ДТП, споры со страховыми)', number: '+7 (912) 987-65-43' },
    { name: 'Центр защиты прав водителей', number: '+7 (3452) 55-66-77' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow container mx-auto px-4 py-8 mt-16">
        <h1 className="text-3xl font-bold mb-8">Экстренные контакты</h1>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-card rounded-xl p-6 border-2 shadow-lg hover:shadow-xl transition-shadow relative overflow-hidden" style={{
            borderImage: 'linear-gradient(135deg, #3b82f6, #ef4444) 1'
          }}>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-red-500/5 pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <Icon name="Ambulance" className="w-6 h-6 bg-gradient-to-r from-blue-500 to-red-500 bg-clip-text text-transparent" style={{
                  filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))'
                }} />
                <h2 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-red-500 bg-clip-text text-transparent">
                  Экстренные службы
                </h2>
              </div>
              <div className="space-y-3">
                {emergencyServices.map((service, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="text-foreground">{service.name}</span>
                    <a 
                      href={`tel:${service.number}`}
                      className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-500 to-red-500 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
                    >
                      {service.number}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 border-2 border-orange/30 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <Icon name="Wrench" className="w-6 h-6 text-orange" />
              <h2 className="text-xl font-bold text-orange">Эвакуаторы и помощь</h2>
            </div>
            <div className="space-y-3 mb-4">
              {evacuators.map((service, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span className="text-foreground text-sm">{service.name}</span>
                  <a 
                    href={`tel:${service.number.replace(/[^0-9+]/g, '')}`}
                    className="text-lg font-semibold text-orange hover:text-orange/80 transition-colors whitespace-nowrap ml-2"
                  >
                    {service.number}
                  </a>
                </div>
              ))}
            </div>
            <div className="text-center text-muted-foreground text-sm mb-3">ИЛИ</div>
            <Button className="w-full bg-orange hover:bg-orange/90" size="lg">
              <Icon name="Phone" className="w-5 h-5 mr-2" />
              Оставить заявку
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 border-2 border-muted shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <Icon name="Scale" className="w-6 h-6 text-muted-foreground" />
            <h2 className="text-xl font-bold text-foreground">Юридическая помощь</h2>
          </div>
          <div className="space-y-3">
            {legal.map((service, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="text-foreground">{service.name}</span>
                <a 
                  href={`tel:${service.number.replace(/[^0-9+]/g, '')}`}
                  className="text-lg font-semibold text-orange hover:text-orange/80 transition-colors whitespace-nowrap ml-2"
                >
                  {service.number}
                </a>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Emergency;