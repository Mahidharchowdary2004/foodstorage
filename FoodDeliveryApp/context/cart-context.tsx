import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { DeviceEventEmitter, NativeEventEmitter, Platform } from 'react-native';

// Define types
interface Addon {
  id: string;
  name: string;
  price: number;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  restaurantId?: string;
  addons?: Addon[];
}

interface CartState {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'RESET_CART' };

// Initial state
const initialState: CartState = {
  items: [],
  totalItems: 0,
  totalPrice: 0,
};

// Reducer
function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(item => item.id === action.payload.id);
      
      // Check if it's the same item with same addons
      if (existingItem && action.payload.addons) {
        const existingAddons = existingItem.addons || [];
        const newAddons = action.payload.addons;
        
        // Simple comparison - in a real app, you might want a more robust comparison
        const sameAddons = existingAddons.length === newAddons.length && 
          existingAddons.every((addon, index) => 
            addon.id === newAddons[index].id && addon.price === newAddons[index].price
          );
        
        if (sameAddons) {
          // Update quantity if item with same addons already exists
          const updatedItems = state.items.map(item =>
            item.id === action.payload.id
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          );
          
          // Calculate addon price
          const addonPrice = newAddons.reduce((sum, addon) => sum + addon.price, 0);
          const itemTotalPrice = (action.payload.price + addonPrice) * action.payload.quantity;
          
          return {
            ...state,
            items: updatedItems,
            totalItems: state.totalItems + action.payload.quantity,
            totalPrice: state.totalPrice + itemTotalPrice,
          };
        }
      }
      
      // Add new item (either completely new or different addons)
      const addonPrice = action.payload.addons ? 
        action.payload.addons.reduce((sum, addon) => sum + addon.price, 0) : 0;
      const itemTotalPrice = (action.payload.price + addonPrice) * action.payload.quantity;
      
      return {
        ...state,
        items: [...state.items, action.payload],
        totalItems: state.totalItems + action.payload.quantity,
        totalPrice: state.totalPrice + itemTotalPrice,
      };
    }
    
    case 'REMOVE_ITEM': {
      const itemToRemove = state.items.find(item => item.id === action.payload);
      
      if (!itemToRemove) return state;
      
      // Calculate addon price for the item being removed
      const addonPrice = itemToRemove.addons ? 
        itemToRemove.addons.reduce((sum, addon) => sum + addon.price, 0) : 0;
      const itemTotalPrice = (itemToRemove.price + addonPrice) * itemToRemove.quantity;
      
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload),
        totalItems: state.totalItems - itemToRemove.quantity,
        totalPrice: state.totalPrice - itemTotalPrice,
      };
    }
    
    case 'UPDATE_QUANTITY': {
      const itemToUpdate = state.items.find(item => item.id === action.payload.id);
      
      if (!itemToUpdate) return state;
      
      const quantityDifference = action.payload.quantity - itemToUpdate.quantity;
      
      // Calculate addon price
      const addonPrice = itemToUpdate.addons ? 
        itemToUpdate.addons.reduce((sum, addon) => sum + addon.price, 0) : 0;
      const priceDifference = (itemToUpdate.price + addonPrice) * quantityDifference;
      
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
        totalItems: state.totalItems + quantityDifference,
        totalPrice: state.totalPrice + priceDifference,
      };
    }
    
    case 'CLEAR_CART':
      return initialState;
      
    case 'RESET_CART':
      return initialState;
      
    default:
      return state;
  }
}

// Create context
const CartContext = createContext<{
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  resetCart: () => void;
}>({
  state: initialState,
  dispatch: () => null,
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  resetCart: () => {},
});

// Provider component
export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  
  // Reset cart when user logs out
  useEffect(() => {
    let isMounted = true;
    
    const handleLogout = () => {
      if (isMounted) {
        dispatch({ type: 'RESET_CART' });
      }
    };
    
    // Use DeviceEventEmitter for React Native
    const emitter = Platform.OS === 'android' ? DeviceEventEmitter : new NativeEventEmitter();
    const subscription = emitter.addListener('user-logout', handleLogout);
    
    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);
  
  const addItem = (item: CartItem) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
  };
  
  const removeItem = (id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  };
  
  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
    } else {
      dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
    }
  };
  
  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };
  
  const resetCart = () => {
    dispatch({ type: 'RESET_CART' });
  };
  
  return (
    <CartContext.Provider value={{ state, dispatch, addItem, removeItem, updateQuantity, clearCart, resetCart }}>
      {children}
    </CartContext.Provider>
  );
}

// Custom hook to use cart context
export function useCart() {
  const context = useContext(CartContext);
  
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  
  return context;
}