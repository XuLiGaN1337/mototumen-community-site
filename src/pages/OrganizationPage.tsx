import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Organization {
  id: number;
  user_id: number;
  name: string;
  type: string;
  description: string;
  logo: string;
  cover_image: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  working_hours: string;
  rating: number;
  verified: boolean;
  created_at: string;
}

interface ShopItem {
  id: number;
  name: string;
  description: string;
  category: string;
  image: string;
  rating: number;
  location: string;
  phone: string;
  website: string;
  organization_id: number;
}

export default function OrganizationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadOrganization();
  }, [id]);

  const ADMIN_API = 'https://functions.poehali.dev/f34bd996-f5f2-4c81-8b7b-fb5621187a7f';
  const CONTENT_API = 'https://functions.poehali.dev/34a08e29-2d68-492d-958c-6de39b313388';

  const loadOrganization = async () => {
    try {
      setLoading(true);

      // Организация из admin API
      const orgResponse = await fetch(`${ADMIN_API}?action=organization&id=${id}`);
      if (orgResponse.ok) {
        const orgData = await orgResponse.json();
        setOrganization(orgData.organization || orgData);
      }

      // Товары/услуги из content API
      const itemsResponse = await fetch(`${CONTENT_API}?type=shops&org_id=${id}`);
      if (itemsResponse.ok) {
        const itemsData = await itemsResponse.json();
        setItems(Array.isArray(itemsData) ? itemsData : []);
      }
    } catch (error) {
      console.error('Failed to load organization:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = Array.from(new Set(items.map(item => item.category))).filter(Boolean);
  const filteredItems = activeTab === 'all' 
    ? items 
    : items.filter(item => item.category === activeTab);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1d29] flex items-center justify-center">
        <div className="text-white">Загрузка...</div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-[#1a1d29] flex items-center justify-center">
        <div className="text-white">Организация не найдена</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1d29]">
      {/* Cover Image */}
      <div className="relative h-64 bg-gradient-to-r from-[#ff6b35] to-[#f7931e]">
        {organization.cover_image && (
          <img 
            src={organization.cover_image} 
            alt={organization.name}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/40" />
        
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 p-2 bg-black/50 rounded-lg hover:bg-black/70 transition-colors"
        >
          <Icon name="ArrowLeft" className="h-6 w-6 text-white" />
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Header */}
        <div className="relative -mt-20 mb-8">
          <div className="bg-[#252836] rounded-lg p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Logo */}
              <div className="flex-shrink-0">
                <div className="w-32 h-32 bg-white rounded-lg overflow-hidden ring-4 ring-[#1a1d29]">
                  {organization.logo ? (
                    <img 
                      src={organization.logo} 
                      alt={organization.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#ff6b35]">
                      <Icon name="Store" className="h-16 w-16 text-white" />
                    </div>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
                      {organization.name}
                      {organization.verified && (
                        <Icon name="BadgeCheck" className="h-7 w-7 text-blue-500" />
                      )}
                    </h1>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Icon name="Star" className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-white font-semibold">{organization.rating}</span>
                      <span>·</span>
                      <span className="capitalize">{organization.type}</span>
                    </div>
                  </div>
                  
                  <Button className="bg-[#ff6b35] hover:bg-[#ff6b35]/90 text-white">
                    <Icon name="Heart" className="h-4 w-4 mr-2" />
                    Подписаться
                  </Button>
                </div>

                <p className="text-gray-300 mb-4">{organization.description}</p>

                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {organization.address && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Icon name="MapPin" className="h-4 w-4 text-[#ff6b35]" />
                      <span>{organization.address}</span>
                    </div>
                  )}
                  {organization.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Icon name="Phone" className="h-4 w-4 text-[#ff6b35]" />
                      <a href={`tel:${organization.phone}`} className="hover:text-white">
                        {organization.phone}
                      </a>
                    </div>
                  )}
                  {organization.working_hours && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Icon name="Clock" className="h-4 w-4 text-[#ff6b35]" />
                      <span>{organization.working_hours}</span>
                    </div>
                  )}
                  {organization.website && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Icon name="Globe" className="h-4 w-4 text-[#ff6b35]" />
                      <a 
                        href={organization.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:text-white"
                      >
                        {organization.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-[#252836] border-b border-[#3d4253] w-full justify-start rounded-none overflow-x-auto">
            <TabsTrigger value="all" className="data-[state=active]:bg-[#1a1d29]">
              Все товары
            </TabsTrigger>
            {categories.map(category => (
              <TabsTrigger 
                key={category} 
                value={category}
                className="data-[state=active]:bg-[#1a1d29] capitalize"
              >
                {category}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <Icon name="Package" className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Пока нет товаров в этой категории</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map(item => (
                  <div 
                    key={item.id}
                    className="bg-[#252836] rounded-lg overflow-hidden hover:ring-2 hover:ring-[#ff6b35] transition-all cursor-pointer"
                  >
                    <div className="aspect-video bg-[#1e2332] relative">
                      {item.image ? (
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Icon name="Package" className="h-12 w-12 text-gray-600" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-white mb-2">{item.name}</h3>
                      <p className="text-sm text-gray-400 mb-3 line-clamp-2">{item.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Icon name="Star" className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-sm text-white">{item.rating}</span>
                        </div>
                        {item.category && (
                          <span className="text-xs text-gray-500 bg-[#1e2332] px-2 py-1 rounded capitalize">
                            {item.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}