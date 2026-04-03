import React from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface CartItem {
  id: string;
  name: string;
  brand: string;
  model: string;
  price: number;
  image: string;
  quantity: number;
  discount: number;
}

interface CartSidebarProps {
  cart: CartItem[];
  cartTotal: number;
  deliveryMethod: 'pickup' | 'delivery';
  setDeliveryMethod: (method: 'pickup' | 'delivery') => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
}

const CartSidebar: React.FC<CartSidebarProps> = ({
  cart,
  cartTotal,
  deliveryMethod,
  setDeliveryMethod,
  onUpdateQuantity,
  onRemove,
  onCheckout,
}) => {
  return (
    <aside className="lg:w-96">
      <div className="sticky top-24 bg-dark-900/50 backdrop-blur-sm border border-[#004488]/20 rounded-2xl p-6">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
          <Icon name="ShoppingCart" size={24} className="mr-2 text-[#4499ff]" />
          Корзина
        </h2>

        {cart.length === 0 ? (
          <div className="text-center py-8">
            <Icon name="ShoppingCart" size={64} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400">Корзина пуста</p>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
              {cart.map((item) => (
                <div key={item.id} className="flex gap-3 p-3 bg-dark-800/50 rounded-lg">
                  <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-white truncate">{item.name}</h4>
                    <p className="text-xs text-gray-400">{item.brand}</p>
                    {item.discount > 0 ? (
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-sm font-bold text-red-400">
                          {Math.round(item.price * (1 - item.discount / 100)).toLocaleString('ru-RU')} ₽
                        </span>
                        <span className="text-xs text-gray-500 line-through">{item.price.toLocaleString('ru-RU')} ₽</span>
                      </div>
                    ) : (
                      <p className="text-sm font-bold text-[#4499ff] mt-1">{item.price.toLocaleString('ru-RU')} ₽</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <button
                      onClick={() => onRemove(item.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Icon name="X" size={16} />
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        className="w-6 h-6 flex items-center justify-center bg-dark-700 hover:bg-dark-600 rounded transition-colors"
                      >
                        <Icon name="Minus" size={12} />
                      </button>
                      <span className="text-white w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        className="w-6 h-6 flex items-center justify-center bg-dark-700 hover:bg-dark-600 rounded transition-colors"
                      >
                        <Icon name="Plus" size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-[#004488]/20 pt-4 mb-6">
              <div className="flex justify-between text-gray-400 mb-2">
                <span>Товары ({cart.length})</span>
                <span>{cartTotal.toLocaleString()} ₽</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-white">
                <span>Итого</span>
                <span>{cartTotal.toLocaleString()} ₽</span>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-2">Способ получения:</p>
              <div className="flex gap-2">
                <Button
                  variant={deliveryMethod === 'pickup' ? 'default' : 'outline'}
                  size="sm"
                  className={deliveryMethod === 'pickup' ? 'bg-[#004488] hover:bg-[#003366]' : 'border-[#004488]/50'}
                  onClick={() => setDeliveryMethod('pickup')}
                >
                  <Icon name="Home" size={16} className="mr-1" />
                  Самовывоз
                </Button>
                <Button
                  variant={deliveryMethod === 'delivery' ? 'default' : 'outline'}
                  size="sm"
                  className={deliveryMethod === 'delivery' ? 'bg-[#004488] hover:bg-[#003366]' : 'border-[#004488]/50'}
                  onClick={() => setDeliveryMethod('delivery')}
                >
                  <Icon name="Truck" size={16} className="mr-1" />
                  Доставка
                </Button>
              </div>
            </div>
            
            <Button
              className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 shadow-lg shadow-green-900/50"
              onClick={onCheckout}
            >
              <Icon name="CreditCard" size={18} className="mr-2" />
              Оформить заказ
            </Button>
          </>
        )}
      </div>
    </aside>
  );
};

export default CartSidebar;