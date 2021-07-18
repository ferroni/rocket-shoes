import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const product = cart.find(product => product.id === productId);
      if (product) {
        updateProductAmount({productId, amount: product.amount + 1});
      } else {
        await api.get('products/' + productId)
          .then(
              response => {
                const newCart = [
                  ...cart, 
                  {
                    ...response.data,
                    amount: 1
                  }
                ];
                setCart(newCart);

                localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
              }
          )
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      if (cart.find(product => product.id === productId)) {
        const newCart = cart.filter(product => product.id !== productId);
        setCart([
          ...newCart
        ]);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      } else {
        throw new Error('Erro na remoção do produto');
      }      
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount === 0) return;
      
      await api.get('stock/' + productId)
        .then(
          async response => {
            if (response.data.amount >= amount) {
              const product = cart.find(product => product.id === productId);
              if (product) {
                product.amount = amount;
                setCart([
                  ...cart
                ]);
                localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
              }
            } else {
              toast.error('Quantidade solicitada fora de estoque');
            }
          }
      )
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
