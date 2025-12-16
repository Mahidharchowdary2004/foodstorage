import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  RefreshControl,
  Animated,
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { formatPriceInRupees } from '@/utils/currency';
import { useAuth } from '@/context/auth-context';
import { useCart } from '@/context/cart-context';
import BottomSheet, { BottomSheetRef } from '@/components/BottomSheet';
import ProductDetail from '@/components/ProductDetail';

// Define types
interface Restaurant {
  id: string;
  _id?: string; // Add optional _id for MongoDB compatibility
  name: string;
  rating: number;
  deliveryTime: string;
  image: string;
  cuisine: string[];
  distance?: string;
}

interface FoodCategory {
  id: string;
  name: string;
  image: string;
}

interface FoodItem {
  id: string;
  name: string;
  price: number;
  image: string;
  rating: number;
  isTrending?: boolean;
}



import { API_BASE_URL, getApiUrl, getPublicImageUrl } from '@/app/config';

// Remove the local getApiBaseUrl function since we now import it
const ApiService = {
  fetchFoodCategories: async (): Promise<FoodCategory[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching food categories:', error);
      throw new Error('Failed to fetch food categories');
    }
  },
  fetchTrendingItems: async (): Promise<FoodItem[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/trending`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching trending items:', error);
      throw new Error('Failed to fetch trending items');
    }
  },

  fetchPopularItems: async (): Promise<FoodItem[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/popular`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching popular items:', error);
      throw new Error('Failed to fetch popular items');
    }
  },

  fetchBestReviewedItems: async (): Promise<FoodItem[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/best-reviewed`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching best reviewed items:', error);
      throw new Error('Failed to fetch best reviewed items');
    }
  },

  fetchRestaurants: async (location?: string): Promise<Restaurant[]> => {
    try {
      // Try to fetch from API with proper error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      // Include location in the request if provided
      const url = location
        ? `${API_BASE_URL}/api/restaurants?location=${encodeURIComponent(location)}`
        : `${API_BASE_URL}/api/restaurants`;

      console.log('Fetching restaurants from:', url);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (response.ok) {
        return data;
      } else {
        throw new Error(data.message || 'Failed to fetch restaurants');
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('Fetch aborted due to timeout');
        throw new Error('Connection timed out. Please check your server.');
      }
      console.error('Error fetching restaurants:', error);
      throw new Error('Failed to fetch restaurants');
    }
  },

  fetchNearbyItems: async (location: string): Promise<FoodItem[]> => {
    try {
      // For now, we'll just return popular items
      // In a real app, this would be filtered by location
      const response = await fetch(`${API_BASE_URL}/api/popular`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching nearby items:', error);
      throw new Error('Failed to fetch nearby items');
    }
  },

  // Enhanced updateLocation function
  updateLocation: async (): Promise<string> => {
    try {
      // In a real app, this would use device GPS or location services
      // For now, we'll simulate different Indian locations
      const locations = [
        'Mumbai, MH 400001',
        'Delhi, DL 110001',
        'Bangalore, KA 560001',
        'Hyderabad, TS 500001',
        'Chennai, TN 600001',
        'Kolkata, WB 700001',
        'Pune, MH 411001'
      ];

      // Return a random location for demo purposes
      const randomIndex = Math.floor(Math.random() * locations.length);
      return locations[randomIndex];
    } catch (error) {
      console.error('Error updating location:', error);
      return 'Current Location';
    }
  },

  // Function to validate pincode (in a real app, this would call a geocoding API)
  validatePincode: async (pincode: string): Promise<boolean> => {
    // Simple validation for Indian Pincodes (6 digits)
    const pincodeRegex = /^[1-9][0-9]{5}$/;
    return pincodeRegex.test(pincode.trim());
  }
};

export default function HomeScreen() {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState('Current Location');
  const [foodCategories, setFoodCategories] = useState<FoodCategory[]>([]);
  const [trendingItems, setTrendingItems] = useState<FoodItem[]>([]);
  const [popularItems, setPopularItems] = useState<FoodItem[]>([]);
  const [bestReviewedItems, setBestReviewedItems] = useState<FoodItem[]>([]);
  const [nearbyItems, setNearbyItems] = useState<FoodItem[]>([]);

  // Manual location entry states
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationInput, setLocationInput] = useState('');
  const [locationType, setLocationType] = useState<'pincode' | 'address'>('pincode');

  // Loading states for individual sections
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [popularLoading, setPopularLoading] = useState(true);
  const [bestReviewedLoading, setBestReviewedLoading] = useState(true);
  const [restaurantsLoading, setRestaurantsLoading] = useState(true);
  const [nearbyLoading, setNearbyLoading] = useState(true);

  // Error states for individual sections
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [trendingError, setTrendingError] = useState<string | null>(null);
  const [popularError, setPopularError] = useState<string | null>(null);
  const [bestReviewedError, setBestReviewedError] = useState<string | null>(null);
  const [restaurantsError, setRestaurantsError] = useState<string | null>(null);
  const [nearbyError, setNearbyError] = useState<string | null>(null);

  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);
  const [sortBy, setSortBy] = useState<'rating' | 'price'>('rating');
  const { isAuthenticated, logout } = useAuth();
  const { addItem } = useCart();
  const bottomSheetRef = useRef<BottomSheetRef>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const { height: SCREEN_HEIGHT } = Dimensions.get('window');

  // Function to sort best reviewed items
  const sortBestReviewedItems = (criteria: 'rating' | 'price') => {
    setSortBy(criteria);
    let sortedItems = [...bestReviewedItems];

    if (criteria === 'rating') {
      sortedItems.sort((a, b) => b.rating - a.rating);
    } else {
      sortedItems.sort((a, b) => a.price - b.price);
    }

    setBestReviewedItems(sortedItems);
  };

  // Auto-scroll carousel
  useEffect(() => {
    if (trendingItems.length > 0) {
      const interval = setInterval(() => {
        // Auto-scroll logic would go here in a real implementation
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [trendingItems]);

  // Enhanced location update function
  const updateLocation = async () => {
    try {
      const newLocation = await ApiService.updateLocation();
      setLocation(newLocation);

      // Re-fetch nearby items based on new location
      const nearbyData = await ApiService.fetchNearbyItems(newLocation);
      setNearbyItems(nearbyData);
    } catch (error) {
      console.error('Error updating location:', error);
      Alert.alert('Location Error', 'Failed to update location. Please try again.');
    }
  };

  // Function to manually set location
  const setManualLocation = async () => {
    if (!locationInput.trim()) {
      Alert.alert('Invalid Input', 'Please enter a valid location or pincode');
      return;
    }

    try {
      // If it's a pincode, validate it first
      if (locationType === 'pincode') {
        const isValid = await ApiService.validatePincode(locationInput);
        if (!isValid) {
          Alert.alert('Invalid Pincode', 'Please enter a valid pincode');
          return;
        }
      }

      setLocation(locationInput);
      setShowLocationModal(false);

      // Re-fetch all location-specific data
      const [restaurantsData, nearbyData] = await Promise.all([
        ApiService.fetchRestaurants(locationInput),
        ApiService.fetchNearbyItems(locationInput)
      ]);

      setRestaurants(restaurantsData);
      setNearbyItems(nearbyData);

      // Clear input
      setLocationInput('');
    } catch (error) {
      console.error('Error setting manual location:', error);
      Alert.alert('Location Error', 'Failed to update location. Please try again.');
    }
  };

  // Enhanced fetchData with location-based restaurant fetching
  const fetchData = async () => {
    try {
      setLoading(true);

      // Reset loading and error states
      setCategoriesLoading(true);
      setTrendingLoading(true);
      setPopularLoading(true);
      setBestReviewedLoading(true);
      setRestaurantsLoading(true);
      setNearbyLoading(true);

      setCategoriesError(null);
      setTrendingError(null);
      setPopularError(null);
      setBestReviewedError(null);
      setRestaurantsError(null);
      setNearbyError(null);

      // Fetch all data in parallel with individual error handling
      const categoriesPromise = ApiService.fetchFoodCategories()
        .then(data => {
          setFoodCategories(data);
          setCategoriesLoading(false);
        })
        .catch(error => {
          console.error('Error fetching categories:', error);
          setCategoriesError('Failed to load food categories');
          setCategoriesLoading(false);
        });

      const trendingPromise = ApiService.fetchTrendingItems()
        .then(data => {
          setTrendingItems(data);
          setTrendingLoading(false);
        })
        .catch(error => {
          console.error('Error fetching trending items:', error);
          setTrendingError('Failed to load trending items');
          setTrendingLoading(false);
        });

      const popularPromise = ApiService.fetchPopularItems()
        .then(data => {
          setPopularItems(data);
          setPopularLoading(false);
        })
        .catch(error => {
          console.error('Error fetching popular items:', error);
          setPopularError('Failed to load popular items');
          setPopularLoading(false);
        });

      const bestReviewedPromise = ApiService.fetchBestReviewedItems()
        .then(data => {
          setBestReviewedItems(data);
          setBestReviewedLoading(false);
        })
        .catch(error => {
          console.error('Error fetching best reviewed items:', error);
          setBestReviewedError('Failed to load best reviewed items');
          setBestReviewedLoading(false);
        });

      // Pass location to fetch location-specific restaurants
      const restaurantsPromise = ApiService.fetchRestaurants(location)
        .then(data => {
          setRestaurants(data);
          setRestaurantsLoading(false);
        })
        .catch(error => {
          console.error('Error fetching restaurants:', error);
          setRestaurantsError('Failed to load restaurants');
          setRestaurantsLoading(false);
        });

      const nearbyPromise = ApiService.fetchNearbyItems(location)
        .then(data => {
          setNearbyItems(data);
          setNearbyLoading(false);
        })
        .catch(error => {
          console.error('Error fetching nearby items:', error);
          setNearbyError('Failed to load nearby items');
          setNearbyLoading(false);
        });

      // Wait for all promises to complete
      await Promise.all([
        categoriesPromise,
        trendingPromise,
        popularPromise,
        bestReviewedPromise,
        restaurantsPromise,
        nearbyPromise
      ]);

    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Network Error', 'Failed to load data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Individual section retry functions
  const retryFetchCategories = async () => {
    setCategoriesLoading(true);
    setCategoriesError(null);
    try {
      const data = await ApiService.fetchFoodCategories();
      setFoodCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategoriesError('Failed to load food categories');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const retryFetchTrending = async () => {
    setTrendingLoading(true);
    setTrendingError(null);
    try {
      const data = await ApiService.fetchTrendingItems();
      setTrendingItems(data);
    } catch (error) {
      console.error('Error fetching trending items:', error);
      setTrendingError('Failed to load trending items');
    } finally {
      setTrendingLoading(false);
    }
  };

  const retryFetchPopular = async () => {
    setPopularLoading(true);
    setPopularError(null);
    try {
      const data = await ApiService.fetchPopularItems();
      setPopularItems(data);
    } catch (error) {
      console.error('Error fetching popular items:', error);
      setPopularError('Failed to load popular items');
    } finally {
      setPopularLoading(false);
    }
  };

  const retryFetchBestReviewed = async () => {
    setBestReviewedLoading(true);
    setBestReviewedError(null);
    try {
      const data = await ApiService.fetchBestReviewedItems();
      setBestReviewedItems(data);
    } catch (error) {
      console.error('Error fetching best reviewed items:', error);
      setBestReviewedError('Failed to load best reviewed items');
    } finally {
      setBestReviewedLoading(false);
    }
  };

  const retryFetchRestaurants = async () => {
    setRestaurantsLoading(true);
    setRestaurantsError(null);
    try {
      const data = await ApiService.fetchRestaurants(location);
      setRestaurants(data);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      setRestaurantsError('Failed to load restaurants');
    } finally {
      setRestaurantsLoading(false);
    }
  };

  const retryFetchNearby = async () => {
    setNearbyLoading(true);
    setNearbyError(null);
    try {
      const data = await ApiService.fetchNearbyItems(location);
      setNearbyItems(data);
    } catch (error) {
      console.error('Error fetching nearby items:', error);
      setNearbyError('Failed to load nearby items');
    } finally {
      setNearbyLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Function to filter restaurants by cuisine
  const filterRestaurantsByCuisine = (cuisine: string) => {
    // In a real app, this would make an API call to filter restaurants
    Alert.alert('Filter Applied', `Showing restaurants for ${cuisine} cuisine`);
  };

  const renderRestaurant = ({ item }: { item: Restaurant }) => (
    <TouchableOpacity
      style={styles.restaurantCard}
      onPress={() => {
        const rId = item._id || item.id;
        console.log('Navigating to menu for Restaurant ID:', rId);
        router.push(`/menu?restaurantId=${rId}&restaurantName=${encodeURIComponent(item.name)}`);
      }}
    >
      <Image source={{ uri: getPublicImageUrl(item.image) }} style={styles.restaurantImage} />
      <View style={styles.restaurantInfo}>
        <Text style={styles.restaurantName}>{item.name}</Text>
        <View style={styles.cuisineTagsContainer}>
          {item.cuisine.map((tag, index) => (
            <TouchableOpacity
              key={index}
              style={styles.cuisineTag}
              onPress={() => filterRestaurantsByCuisine(tag)}
            >
              <Text style={styles.cuisineTagText}>{tag}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.ratingContainer}>
          <Text style={styles.rating}>★ {item.rating}</Text>
          <Text style={styles.deliveryTime}>{item.deliveryTime}</Text>
          {item.distance && <Text style={styles.distance}>{item.distance}</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFoodCategory = ({ item }: { item: FoodCategory }) => (
    <TouchableOpacity
      style={styles.categoryItem}
      onPress={() => {
        // Filter restaurants by selected category
        Alert.alert('Filter Applied', `Showing restaurants for ${item.name}`);
      }}
    >
      <Image source={{ uri: getPublicImageUrl(item.image) }} style={styles.categoryImage} />
      <Text style={styles.categoryName}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderFoodItem = ({ item }: { item: FoodItem }) => (
    <TouchableOpacity
      style={styles.foodItemCard}
      onPress={() => {
        setSelectedProduct(item);
        // Open bottom sheet
        setTimeout(() => {
          bottomSheetRef.current?.scrollTo(-(SCREEN_HEIGHT * 0.7));
        }, 100);
      }}
    >
      <View style={styles.foodItemImageContainer}>
        <Image source={{ uri: getPublicImageUrl(item.image) }} style={styles.foodItemImage} />
        {item.isTrending && (
          <View style={styles.trendingBadge}>
            <Text style={styles.trendingText}>Trending</Text>
          </View>
        )}
      </View>
      <View style={styles.foodItemInfo}>
        <Text style={styles.foodItemName} numberOfLines={1}>{item.name}</Text>
        <View style={styles.foodItemRating}>
          <Text style={styles.ratingStar}>★</Text>
          <Text style={styles.foodItemRatingText}>{item.rating}</Text>
        </View>
        <Text style={styles.foodItemPrice}>{formatPriceInRupees(item.price)}</Text>
      </View>
    </TouchableOpacity>
  );

  // Carousel item for trending items with enhanced styling
  const renderTrendingCarouselItem = ({ item, index }: { item: FoodItem; index: number }) => (
    <TouchableOpacity
      style={styles.carouselItem}
      onPress={() => {
        // Handle item press
        Alert.alert('Item Selected', `You selected ${item.name}`);
      }}
    >
      <View style={styles.carouselImageContainer}>
        <Image source={{ uri: getPublicImageUrl(item.image) }} style={styles.carouselImage} />
        {item.isTrending && (
          <View style={styles.trendingBadgeCarousel}>
            <Text style={styles.trendingText}>Trending</Text>
          </View>
        )}
      </View>
      <View style={styles.carouselInfo}>
        <Text style={styles.carouselItemName} numberOfLines={1}>{item.name}</Text>
        <View style={styles.carouselRatingContainer}>
          <Text style={styles.ratingStar}>★</Text>
          <Text style={styles.carouselRating}>{item.rating}</Text>
        </View>
        <Text style={styles.carouselPrice}>{formatPriceInRupees(item.price)}</Text>
      </View>
    </TouchableOpacity>
  );

  // Simplified carousel indicators without direct access to scrollX value
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Update carousel index based on scroll
  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (Dimensions.get('window').width * 0.8 + 20));
    setCarouselIndex(index);
  };

  // Simplified carousel indicators
  const renderCarouselIndicators = () => {
    return (
      <View style={styles.indicatorContainer}>
        {trendingItems.map((_, index) => {
          return (
            <View
              key={index}
              style={[
                styles.indicator,
                {
                  backgroundColor: index === carouselIndex ? '#FF6B35' : '#E0E0E0'
                }
              ]}
            />
          );
        })}
      </View>
    );
  };

  // Render loading indicator for a section
  const renderSectionLoading = () => (
    <View style={styles.sectionLoadingContainer}>
      <ActivityIndicator size="large" color="#FF6B35" />
    </View>
  );

  // Render error message for a section
  const renderSectionError = (errorMessage: string, retryFunction: () => void) => (
    <View style={styles.sectionErrorContainer}>
      <Text style={styles.sectionErrorText}>{errorMessage}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={retryFunction}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading delicious food options...</Text>
      </View>
    );
  }

  // Function to truncate long location text
  const truncateLocation = (locationText: string) => {
    if (locationText.length > 25) {
      return locationText.substring(0, 22) + '...';
    }
    return locationText;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.contentScrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header Section - Now inside ScrollView */}
        <View style={styles.header}>
          <View style={styles.topHeader}>
            <TouchableOpacity
              style={styles.locationContainer}
              onPress={() => setShowLocationModal(true)}
            >
              <Text style={styles.locationIcon}>📍</Text>
              <View>
                <Text style={styles.locationLabel}>Deliver to</Text>
                <Text style={styles.locationText}>{truncateLocation(location)}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.profileIconContainer}
              onPress={() => {
                if (isAuthenticated) {
                  // Show profile options
                  Alert.alert(
                    'Profile',
                    'Choose an action',
                    [
                      {
                        text: 'My Orders',
                        onPress: () => router.push('/orders')
                      },
                      {
                        text: 'Logout',
                        onPress: logout,
                        style: 'destructive'
                      },
                      { text: 'Cancel', style: 'cancel' }
                    ]
                  );
                } else {
                  // Navigate to login screen
                  router.push('/auth/login');
                }
              }}
            >
              <View style={styles.profileIcon}>
                <Text style={styles.profileIconText}>👤</Text>
              </View>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.searchBar}
            placeholder="Search for restaurants or dishes..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Today's Trends Carousel */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Trends</Text>
          {trendingLoading ? (
            renderSectionLoading()
          ) : trendingError ? (
            renderSectionError(trendingError, retryFetchTrending)
          ) : trendingItems.length > 0 ? (
            <>
              <Animated.FlatList
                ref={flatListRef}
                data={trendingItems}
                renderItem={renderTrendingCarouselItem}
                keyExtractor={(item, index) => `trending-${item.id || index}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.carouselList}
                pagingEnabled
                snapToInterval={Dimensions.get('window').width * 0.8 + 20}
                decelerationRate="fast"
                bounces={false}
                onScroll={Animated.event(
                  [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                  {
                    useNativeDriver: true,
                    listener: handleScroll
                  }
                )}
                scrollEventThrottle={16}
              />
              {renderCarouselIndicators()}
            </>
          ) : (
            <Text style={styles.emptyStateText}>No trending items available</Text>
          )}
        </View>

        {/* Best Reviewed Food Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Best Reviewed Food</Text>
            <View style={styles.sortContainer}>
              <TouchableOpacity
                style={[styles.sortButton, sortBy === 'rating' && styles.activeSortButton]}
                onPress={() => sortBestReviewedItems('rating')}
              >
                <Text style={[styles.sortButtonText, sortBy === 'rating' && styles.activeSortButtonText]}>Top Rated</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortButton, sortBy === 'price' && styles.activeSortButton]}
                onPress={() => sortBestReviewedItems('price')}
              >
                <Text style={[styles.sortButtonText, sortBy === 'price' && styles.activeSortButtonText]}>Lowest Price</Text>
              </TouchableOpacity>
            </View>
          </View>
          {bestReviewedLoading ? (
            renderSectionLoading()
          ) : bestReviewedError ? (
            renderSectionError(bestReviewedError, retryFetchBestReviewed)
          ) : bestReviewedItems.length > 0 ? (
            <FlatList
              data={bestReviewedItems}
              renderItem={renderFoodItem}
              keyExtractor={(item, index) => `best-reviewed-${item.id || index}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.foodItemsList}
            />
          ) : (
            <Text style={styles.emptyStateText}>No reviewed items available</Text>
          )}
        </View>

        {/* Popular Restaurants Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Restaurants</Text>
          {restaurantsLoading ? (
            renderSectionLoading()
          ) : restaurantsError ? (
            renderSectionError(restaurantsError, retryFetchRestaurants)
          ) : restaurants.length > 0 ? (
            <FlatList
              data={restaurants}
              renderItem={renderRestaurant}
              keyExtractor={(item, index) => `restaurant-${item.id || index}`}
              contentContainerStyle={styles.restaurantList}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.emptyStateText}>No restaurants available</Text>
          )}
        </View>

        {/* Popular Food Near You Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderWithAction}>
            <Text style={styles.sectionTitle}>Popular Food Near You</Text>
            <TouchableOpacity
              style={styles.refreshLocationButton}
              onPress={updateLocation}
            >
              <Text style={styles.refreshLocationText}>Refresh Location</Text>
            </TouchableOpacity>
          </View>
          {nearbyLoading ? (
            renderSectionLoading()
          ) : nearbyError ? (
            renderSectionError(nearbyError, retryFetchNearby)
          ) : nearbyItems.length > 0 ? (
            <FlatList
              data={nearbyItems}
              renderItem={renderFoodItem}
              keyExtractor={(item, index) => `nearby-${item.id || index}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.foodItemsList}
            />
          ) : (
            <Text style={styles.emptyStateText}>No nearby items available</Text>
          )}
        </View>

        {/* Food Categories Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What's on your mind?</Text>
          {categoriesLoading ? (
            renderSectionLoading()
          ) : categoriesError ? (
            renderSectionError(categoriesError, retryFetchCategories)
          ) : foodCategories.length > 0 ? (
            <FlatList
              data={foodCategories}
              renderItem={renderFoodCategory}
              keyExtractor={(item, index) => `category-${item.id || index}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesList}
            />
          ) : (
            <Text style={styles.emptyStateText}>No categories available</Text>
          )}
        </View>
      </ScrollView>

      {/* Location Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showLocationModal}
        onRequestClose={() => setShowLocationModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Enter Your Location</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowLocationModal(false)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.locationTypeContainer}>
              <Pressable
                style={[styles.locationTypeButton, locationType === 'pincode' && styles.activeLocationTypeButton]}
                onPress={() => setLocationType('pincode')}
              >
                <Text style={[styles.locationTypeText, locationType === 'pincode' && styles.activeLocationTypeText]}>
                  Pincode
                </Text>
              </Pressable>
              <Pressable
                style={[styles.locationTypeButton, locationType === 'address' && styles.activeLocationTypeButton]}
                onPress={() => setLocationType('address')}
              >
                <Text style={[styles.locationTypeText, locationType === 'address' && styles.activeLocationTypeText]}>
                  Address
                </Text>
              </Pressable>
            </View>

            <TextInput
              style={styles.locationInput}
              placeholder={locationType === 'pincode' ? 'Enter your pincode' : 'Enter your address'}
              value={locationInput}
              onChangeText={setLocationInput}
              keyboardType={locationType === 'pincode' ? 'numeric' : 'default'}
              autoFocus={true}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowLocationModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={setManualLocation}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalDivider}>
              <Text style={styles.modalDividerText}>OR</Text>
            </View>

            <TouchableOpacity
              style={styles.detectLocationButton}
              onPress={updateLocation}
            >
              <Text style={styles.detectLocationText}>Detect My Location Automatically</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bottom Sheet for Product Detail */}
      {selectedProduct && (
        <BottomSheet
          ref={bottomSheetRef}
          onClose={() => setSelectedProduct(null)}
        >
          <ProductDetail
            product={selectedProduct}
            onAddToCart={(quantity: number, addons: any[]) => {
              // Add to cart functionality
              addItem({
                id: selectedProduct.id,
                name: selectedProduct.name,
                price: selectedProduct.price,
                quantity: quantity,
                image: selectedProduct.image,
                addons: addons,
              });
              bottomSheetRef.current?.scrollTo(0);
              setSelectedProduct(null);
              Alert.alert('Added to Cart', `${selectedProduct.name} added to your cart!`);
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
  contentScrollView: {
    flex: 1,
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
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  locationLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  locationText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileIconContainer: {
    padding: 5,
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIconText: {
    fontSize: 20,
  },
  searchBar: {
    height: 45,
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 20,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  section: {
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 20,
  },
  categoriesList: {
    paddingHorizontal: 20,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 20,
  },
  categoryImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  carouselList: {
    paddingHorizontal: 20,
  },
  carouselItem: {
    backgroundColor: '#fff',
    borderRadius: 15,
    width: Dimensions.get('window').width * 0.8,
    marginRight: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
    overflow: 'hidden',
  },
  carouselImageContainer: {
    position: 'relative',
  },
  carouselImage: {
    width: '100%',
    height: 160,
  },
  trendingBadgeCarousel: {
    position: 'absolute',
    top: 15,
    left: 15,
    backgroundColor: '#FF6B35',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
    zIndex: 1,
  },
  trendingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  carouselInfo: {
    padding: 15,
  },
  carouselItemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  carouselRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  carouselRating: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  carouselPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
    marginBottom: 25,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    backgroundColor: '#E0E0E0',
  },
  foodItemsList: {
    paddingHorizontal: 20,
  },
  foodItemCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    marginRight: 15,
    width: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  foodItemImageContainer: {
    position: 'relative',
  },
  foodItemImage: {
    width: '100%',
    height: 100,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  trendingBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FF6B35',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 1,
  },
  foodItemInfo: {
    padding: 10,
  },
  foodItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  foodItemRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  ratingStar: {
    color: '#FF6B35',
    fontSize: 14,
    marginRight: 3,
  },
  foodItemRatingText: {
    fontSize: 14,
    color: '#666',
  },
  foodItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  restaurantList: {
    paddingHorizontal: 20,
  },
  restaurantCard: {
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
  restaurantImage: {
    width: '100%',
    height: 180,
  },
  restaurantInfo: {
    padding: 15,
  },
  restaurantName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  cuisineTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },

  cuisineTag: {
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },

  cuisineTagText: {
    fontSize: 12,
    color: '#666',
  },

  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rating: {
    color: '#FF6B35',
    fontWeight: 'bold',
    fontSize: 16,
  },
  deliveryTime: {
    color: '#666',
    fontSize: 14,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  distance: {
    color: '#666',
    fontSize: 14,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },

  loadingText: {
    fontSize: 18,
    color: '#666',
    marginTop: 10,
  },

  sectionLoadingContainer: {
    paddingVertical: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },

  sectionErrorContainer: {
    padding: 20,
    alignItems: 'center',
  },

  sectionErrorText: {
    fontSize: 16,
    color: '#ff4444',
    textAlign: 'center',
    marginBottom: 15,
  },

  retryButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },

  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },

  sortContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    padding: 4,
  },

  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },

  activeSortButton: {
    backgroundColor: '#FF6B35',
  },

  sortButtonText: {
    fontSize: 12,
    color: '#666',
  },

  activeSortButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  sectionHeaderWithAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },

  refreshLocationButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  refreshLocationText: {
    fontSize: 12,
    color: '#666',
  },

  // Location Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 10,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  locationTypeContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    padding: 4,
  },
  locationTypeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 16,
  },
  activeLocationTypeButton: {
    backgroundColor: '#FF6B35',
  },
  locationTypeText: {
    fontSize: 16,
    color: '#666',
  },
  activeLocationTypeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  locationInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    marginRight: 10,
  },
  confirmButton: {
    backgroundColor: '#FF6B35',
    marginLeft: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  modalDivider: {
    alignItems: 'center',
    marginVertical: 15,
  },
  modalDividerText: {
    color: '#666',
    fontSize: 14,
  },
  detectLocationButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  detectLocationText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
