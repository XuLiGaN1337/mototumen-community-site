import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import StoreHeader from '@/components/store/StoreHeader';
import StoreFilters from '@/components/store/StoreFilters';
import ProductCard from '@/components/store/ProductCard';
import CartSidebar from '@/components/store/CartSidebar';
import CheckoutModal, { CheckoutData } from '@/components/store/CheckoutModal';
import AdminCard from '@/components/store/AdminCard';

interface Product {
  id: string;
  name: string;
  brand: string;
  model: string;
  price: number;
  image: string;
  category: string;
  inStock: boolean;
  description: string;
  discount: number;
}

interface CartItem extends Product {
  quantity: number;
}

const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Масло моторное 10W-40',
    brand: 'Motul',
    model: '7100 4T',
    price: 2500,
    image: 'https://cdn.poehali.dev/files/placeholder-oil.jpg',
    category: 'Масла и смазки',
    inStock: true,
    description: 'Синтетическое масло для 4-тактных двигателей'
  },
  {
    id: '2',
    name: 'Тормозные колодки передние',
    brand: 'Brembo',
    model: 'Carbon Ceramic',
    price: 4200,
    image: 'https://cdn.poehali.dev/files/placeholder-brake.jpg',
    category: 'Тормозная система',
    inStock: true,
    description: 'Керамические тормозные колодки для спортивных мотоциклов'
  },
  {
    id: '3',
    name: 'Цепь приводная 520',
    brand: 'DID',
    model: 'VX3-520-118',
    price: 3800,
    image: 'https://cdn.poehali.dev/files/placeholder-chain.jpg',
    category: 'Привод',
    inStock: true,
    description: 'Усиленная приводная цепь 520, 118 звеньев'
  },
  {
    id: '4',
    name: 'Воздушный фильтр',
    brand: 'K&N',
    model: 'KA-1004',
    price: 1800,
    image: 'https://cdn.poehali.dev/files/placeholder-filter.jpg',
    category: 'Система впуска',
    inStock: false,
    description: 'Моющийся воздушный фильтр увеличенной производительности'
  },
  {
    id: '5',
    name: 'Шлем интеграл',
    brand: 'AGV',
    model: 'K6',
    price: 28500,
    image: 'https://cdn.poehali.dev/files/placeholder-helmet.jpg',
    category: 'Экипировка',
    inStock: true,
    description: 'Интегральный шлем с улучшенной аэродинамикой'
  },
  {
    id: '6',
    name: 'Перчатки кожаные',
    brand: 'Alpinestars',
    model: 'GP Pro R3',
    price: 15200,
    image: 'https://cdn.poehali.dev/files/placeholder-gloves.jpg',
    category: 'Экипировка',
    inStock: true,
    description: 'Спортивные перчатки из кожи кенгуру'
  },
];

const CATEGORIES = [
  'Все категории',
  'Масла и смазки',
  'Тормозная система',
  'Привод',
  'Система впуска',
  'Подвеска',
  'Электрика',
  'Экипировка',
];

const BRANDS = ['Все бренды', 'Motul', 'Brembo', 'DID', 'K&N', 'Michelin', 'AGV', 'Alpinestars'];

const StorePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Все категории');
  const [selectedBrand, setSelectedBrand] = useState('Все бренды');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [hasStoreAccess, setHasStoreAccess] = useState(false);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const response = await fetch('https://functions.poehali.dev/c79cc1b5-5a45-4360-8054-9dc37d34ea9a?action=public-products');
        const data = await response.json();
        setProducts((data.products || []).map((p: Product) => ({
          id: String(p.id),
          name: p.name,
          brand: p.brand || '',
          model: p.model || '',
          price: Number(p.price),
          image: p.image || '',
          category: p.category || '',
          inStock: p.inStock,
          description: p.description || '',
          discount: p.discount || 0,
        })));
      } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
        setProducts(MOCK_PRODUCTS);
      }
      setLoading(false);
    };
    loadProducts();
  }, []);

  useEffect(() => {
    const checkStoreAccess = async () => {
      if (!user) {
        return;
      }
      
      try {
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
        if (!token) { setHasStoreAccess(false); return; }
        const response = await fetch('https://functions.poehali.dev/c79cc1b5-5a45-4360-8054-9dc37d34ea9a?action=check-access', {
          headers: { 'X-Auth-Token': token }
        });
        if (response.ok) {
          const data = await response.json();
          setHasStoreAccess(data.hasAccess);
        } else {
          setHasStoreAccess(false);
        }
      } catch {
        setHasStoreAccess(false);
      }
    };
    checkStoreAccess();
  }, [user]);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Все категории' || product.category === selectedCategory;
    const matchesBrand = selectedBrand === 'Все бренды' || product.brand === selectedBrand;
    return matchesSearch && matchesCategory && matchesBrand;
  });

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(cart.map(item => 
      item.id === productId ? { ...item, quantity } : item
    ));
  };

  const toggleFavorite = (productId: string) => {
    if (favorites.includes(productId)) {
      setFavorites(favorites.filter(id => id !== productId));
    } else {
      setFavorites([...favorites, productId]);
    }
  };

  const handleCheckout = (data: CheckoutData) => {
    console.log('Order data:', data);
    alert(`Заказ оформлен!\n\nИмя: ${data.name}\nТелефон: ${data.phone}\nАдрес: ${data.address}\nКомментарий: ${data.comment}\n\nИтого: ${cartTotal.toLocaleString()} ₽`);
    setCart([]);
    setShowCheckout(false);
    setShowCart(false);
  };

  const cartTotal = cart.reduce((sum, item) => {
    const finalPrice = item.discount > 0
      ? Math.round(item.price * (1 - item.discount / 100))
      : item.price;
    return sum + finalPrice * item.quantity;
  }, 0);
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 flex items-center justify-center">
          <div className="text-white text-xl">Загрузка...</div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
        <StoreHeader
          hasStoreAccess={hasStoreAccess}
          favorites={favorites}
          cartItemsCount={cartItemsCount}
          showCart={showCart}
          setShowCart={setShowCart}
        />

        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {showCart && (
              <CartSidebar
                cart={cart}
                cartTotal={cartTotal}
                deliveryMethod={deliveryMethod}
                setDeliveryMethod={setDeliveryMethod}
                onUpdateQuantity={updateQuantity}
                onRemove={removeFromCart}
                onCheckout={() => setShowCheckout(true)}
              />
            )}

            <main className="flex-1">
              <StoreFilters
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                selectedBrand={selectedBrand}
                setSelectedBrand={setSelectedBrand}
                categories={CATEGORIES}
                brands={BRANDS}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {hasStoreAccess && (
                  <AdminCard />
                )}
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isFavorite={favorites.includes(product.id)}
                    onToggleFavorite={toggleFavorite}
                    onAddToCart={addToCart}
                  />
                ))}
              </div>

              {filteredProducts.length === 0 && (
                <div className="text-center py-16">
                  <p className="text-gray-400 text-xl">Товары не найдены</p>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
      <Footer />

      {showCheckout && (
        <CheckoutModal
          cartTotal={cartTotal}
          deliveryMethod={deliveryMethod}
          onClose={() => setShowCheckout(false)}
          onSubmit={handleCheckout}
        />
      )}
    </>
  );
};

export default StorePage;