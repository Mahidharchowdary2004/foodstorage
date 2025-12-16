import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions
} from 'react-native';
import { formatPriceInRupees } from '@/utils/currency';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Addon {
  id: string;
  name: string;
  price: number;
  selected: boolean;
}

interface ProductDetailProps {
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    category?: string; // Add category to interface
  };
  onAddToCart: (quantity: number, addons: Addon[]) => void;
  onClose: () => void;
}

const getAddonsForProduct = (category: string = '', name: string = ''): Addon[] => {
  const normalizedCategory = category.toLowerCase();
  const normalizedName = name.toLowerCase();

  // Biryani Options
  if (normalizedCategory.includes('biryani') || normalizedCategory.includes('rice') || normalizedName.includes('biryani')) {
    return [
      { id: '1', name: 'Extra Raita', price: 20, selected: false },
      { id: '2', name: 'Double Masala', price: 30, selected: false },
      { id: '3', name: 'Thums Up (250ml)', price: 40, selected: false },
      { id: '4', name: 'Boiled Egg', price: 15, selected: false },
    ];
  }

  // Pizza Options
  if (normalizedCategory.includes('pizza') || normalizedName.includes('pizza')) {
    return [
      { id: '1', name: 'Extra Cheese', price: 40, selected: false },
      { id: '2', name: 'Cheese Burst', price: 60, selected: false },
      { id: '3', name: 'Coke (250ml)', price: 40, selected: false },
      { id: '4', name: 'Choco Lava Cake', price: 90, selected: false },
    ];
  }

  // Burger/Sandwich Options
  if (normalizedCategory.includes('burger') || normalizedCategory.includes('sandwich') || normalizedName.includes('burger')) {
    return [
      { id: '1', name: 'Extra Cheese Slice', price: 20, selected: false },
      { id: '2', name: 'Peri Peri Fries', price: 80, selected: false },
      { id: '3', name: 'Coke (250ml)', price: 40, selected: false },
      { id: '4', name: 'Chicken Nuggets (4pc)', price: 120, selected: false },
    ];
  }

  // Dessert Options
  if (normalizedCategory.includes('dessert') || normalizedCategory.includes('ice cream') || normalizedCategory.includes('cake')) {
    return [
      { id: '1', name: 'Extra Chocolate Sauce', price: 30, selected: false },
      { id: '2', name: 'Nut Toppings', price: 40, selected: false },
      { id: '3', name: 'Vanilla Scoop', price: 50, selected: false },
    ];
  }

  // Default Options
  return [
    { id: '1', name: 'Extra Cheese', price: 20, selected: false },
    { id: '2', name: 'Cold Drink', price: 30, selected: false },
    { id: '3', name: 'Fries', price: 40, selected: false },
    { id: '4', name: 'Sauce Pack', price: 15, selected: false },
  ];
};

const ProductDetail: React.FC<ProductDetailProps> = ({ product, onAddToCart, onClose }) => {
  const [quantity, setQuantity] = useState(1);
  const [addons, setAddons] = useState<Addon[]>([]);

  useEffect(() => {
    // Reset quantity and set dynamic addons when product changes
    setQuantity(1);
    setAddons(getAddonsForProduct(product.category, product.name));
  }, [product]);

  const toggleAddon = (id: string) => {
    setAddons(addons.map(addon =>
      addon.id === id ? { ...addon, selected: !addon.selected } : addon
    ));
  };

  const increaseQuantity = () => {
    setQuantity(quantity + 1);
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const calculateTotalPrice = () => {
    const basePrice = product.price * quantity;
    const addonsPrice = addons
      .filter(addon => addon.selected)
      .reduce((sum, addon) => sum + addon.price, 0);
    return basePrice + addonsPrice;
  };

  const handleAddToCart = () => {
    // Pass only selected addons
    const selectedAddons = addons.filter(addon => addon.selected);
    onAddToCart(quantity, selectedAddons);
    onClose();
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: product.image }} style={styles.image} />
        </View>

        {/* Product Info */}
        <View style={styles.content}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productDescription}>{product.description}</Text>

          {/* Quantity Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quantity</Text>
            <View style={styles.quantityContainer}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={decreaseQuantity}
              >
                <Text style={styles.quantityButtonText}>-</Text>
              </TouchableOpacity>

              <Text style={styles.quantityText}>{quantity}</Text>

              <TouchableOpacity
                style={styles.quantityButton}
                onPress={increaseQuantity}
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Add-ons */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add-ons</Text>
            {addons.map((addon) => (
              <TouchableOpacity
                key={addon.id}
                style={styles.addonItem}
                onPress={() => toggleAddon(addon.id)}
              >
                <View style={styles.addonInfo}>
                  <Text style={styles.addonName}>{addon.name}</Text>
                  <Text style={styles.addonPrice}>{formatPriceInRupees(addon.price)}</Text>
                </View>
                <View style={[styles.checkbox, addon.selected && styles.checked]}>
                  {addon.selected && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Add to Cart Button */}
      <View style={styles.footer}>
        <View style={styles.priceContainer}>
          <Text style={styles.totalText}>Total:</Text>
          <Text style={styles.totalPrice}>{formatPriceInRupees(calculateTotalPrice())}</Text>
        </View>

        <TouchableOpacity
          style={styles.addToCartButton}
          onPress={handleAddToCart}
        >
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  imageContainer: {
    width: '100%',
    height: 200,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  content: {
    padding: 20,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  productDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    lineHeight: 22,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 20,
    minWidth: 30,
    textAlign: 'center',
  },
  addonItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  addonInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
    marginRight: 15,
  },
  addonName: {
    fontSize: 16,
    color: '#333',
  },
  addonPrice: {
    fontSize: 16,
    color: '#FF6B35',
    fontWeight: 'bold',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checked: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalText: {
    fontSize: 16,
    color: '#666',
    marginRight: 8,
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  addToCartButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  addToCartText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProductDetail;