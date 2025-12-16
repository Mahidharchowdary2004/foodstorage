import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ScrollView, Alert, Dimensions, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCart } from '@/context/cart-context';
import { useAuth } from '@/context/auth-context';
import { formatPriceInRupees } from '@/utils/currency';
import BottomSheet, { BottomSheetRef } from '@/components/BottomSheet';
import ProductDetail from '@/components/ProductDetail';
import { API_BASE_URL, getPublicImageUrl } from '@/app/config';

// Define types
interface FoodItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
}

export default function MenuScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const restaurantId = params.restaurantId as string || '1';
  const restaurantName = params.restaurantName as string || 'Restaurant';

  const { addItem } = useCart();
  const { requireAuth } = useAuth();
  const bottomSheetRef = useRef<BottomSheetRef>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const { height: SCREEN_HEIGHT } = Dimensions.get('window');

  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  const fetchMenuItems = async () => {
    try {
      console.log(`[Menu] Fetching from: ${API_BASE_URL}/api/restaurants/${restaurantId}/menu`);
      const response = await fetch(`${API_BASE_URL}/api/restaurants/${restaurantId}/menu`);
      const data = await response.json();

      console.log('[Menu] Response Status:', response.status);
      console.log('[Menu] Data Received:', JSON.stringify(data).substring(0, 200) + '...');

      if (response.ok) {
        // Map _id to id for frontend compatibility
        const formattedItems = (data.items || []).map((item: any) => ({
          ...item,
          id: item._id || item.id
        }));

        console.log('[Menu] Formatted Items Count:', formattedItems.length);
        setFoodItems(formattedItems);
        setCategories(['All', ...data.categories]);
      } else {
        throw new Error(data.message || 'Failed to fetch menu items');
      }
    } catch (error) {
      console.error('[Menu] Error fetching menu items:', error);
      Alert.alert('Network Error', 'Failed to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  // Removed mock food items - now fetching from API

  useEffect(() => {
    fetchMenuItems();
  }, [restaurantId]);

  const filteredItems = selectedCategory === 'All'
    ? foodItems
    : foodItems.filter(item => item.category === selectedCategory);

  const renderCategory = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        selectedCategory === item && styles.selectedCategoryButton
      ]}
      onPress={() => setSelectedCategory(item)}
    >
      <Text
        style={[
          styles.categoryText,
          selectedCategory === item && styles.selectedCategoryText
        ]}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );

  const renderFoodItem = ({ item }: { item: FoodItem }) => (
    <View style={styles.foodItemCard}>
      <Image source={{ uri: getPublicImageUrl(item.image) }} style={styles.foodImage} />
      <View style={styles.foodInfo}>
        <Text style={styles.foodName}>{item.name}</Text>
        <Text style={styles.foodDescription}>{item.description}</Text>
        <View style={styles.bottomRow}>
          <Text style={styles.foodPrice}>{formatPriceInRupees(item.price)}</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              setSelectedProduct(item);
              // Open bottom sheet
              setTimeout(() => {
                bottomSheetRef.current?.scrollTo(-(SCREEN_HEIGHT * 0.8));
              }, 100);
            }}
          >
            <Text style={styles.addButtonText}>ADD</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.restaurantName}>{restaurantName}</Text>
        <Text style={styles.deliveryTime}>25-35 min</Text>
      </View>

      <View style={styles.categoriesContainer}>
        <FlatList
          data={categories}
          renderItem={renderCategory}
          keyExtractor={(item, index) => `category-${item || index}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      <FlatList
        data={filteredItems}
        renderItem={renderFoodItem}
        keyExtractor={(item, index) => `food-item-${item.id || index}`}
        contentContainerStyle={styles.foodList}
        showsVerticalScrollIndicator={false}
      />

      {/* Bottom Sheet for Product Detail */}
      {selectedProduct && (
        <BottomSheet
          ref={bottomSheetRef}
          onClose={() => setSelectedProduct(null)}
        >
          <ProductDetail
            product={selectedProduct}
            onAddToCart={(quantity: number, addons: any[]) => {
              // Require authentication before adding to cart
              requireAuth(() => router.push('/auth/login'), () => {
                // Add to cart functionality
                addItem({
                  id: selectedProduct.id,
                  name: selectedProduct.name,
                  price: selectedProduct.price,
                  quantity: quantity,
                  image: selectedProduct.image,
                  addons: addons,
                });
                Alert.alert('Added to Cart', `${selectedProduct.name} has been added to your cart`);
                bottomSheetRef.current?.scrollTo(0);
                setSelectedProduct(null);
              });
            }}
            onClose={() => {
              bottomSheetRef.current?.scrollTo(0);
              setSelectedProduct(null);
            }}
          />
        </BottomSheet>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#FF6B35',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  restaurantName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
    textAlign: 'center',
  },
  deliveryTime: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  categoriesContainer: {
    paddingVertical: 15,
    backgroundColor: '#f8f8f8',
  },
  categoriesList: {
    paddingHorizontal: 20,
  },
  categoryButton: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedCategoryButton: {
    backgroundColor: '#FF6B35',
  },
  categoryText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 14,
  },
  selectedCategoryText: {
    color: '#fff',
  },
  foodList: {
    padding: 20,
    paddingTop: 10,
  },
  foodItemCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  foodImage: {
    width: '100%',
    height: 180,
  },
  foodInfo: {
    padding: 15,
  },
  foodName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  foodDescription: {
    fontSize: 15,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  foodPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  addButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});