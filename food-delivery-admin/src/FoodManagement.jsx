import React, { useState, useEffect } from 'react';

// Function to format price in Indian Rupees
const formatPriceInRupees = (price) => {
  // Convert to number if it's a string
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;

  // Format as Indian Rupees with proper locale
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(numericPrice);
};

import { API_BASE_URL } from './config';

export default function FoodManagement() {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [foodItems, setFoodItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingFoodItem, setEditingFoodItem] = useState(null);
  const [imageSource, setImageSource] = useState('url'); // 'url' or 'upload'
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    category: '',
    image: '',
    isTrending: false
  });

  // Fetch food items from API
  // Fetch restaurants from API
  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/admin/restaurants`);
      const data = await response.json();
      setRestaurants(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      alert('Failed to fetch restaurants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
    fetchCategories();
  }, []);

  // Fetch food items for selected restaurant
  // Fetch food items for selected restaurant
  const fetchRestaurantMenu = async () => {
    if (!selectedRestaurant) return;

    try {
      setLoading(true);
      const restaurantId = selectedRestaurant._id || selectedRestaurant.id;
      const response = await fetch(`${API_BASE_URL}/api/restaurants/${restaurantId}/menu`);
      const data = await response.json();
      setFoodItems(data.items || []);
    } catch (error) {
      console.error('Error fetching menu:', error);
      alert('Failed to fetch menu items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedRestaurant) {
      fetchRestaurantMenu();
    }
  }, [selectedRestaurant]);

  const handleAddFoodItem = () => {
    setEditingFoodItem(null);
    setImageSource('url');
    setSelectedFile(null);
    setFormData({
      name: '',
      description: '',
      price: 0,
      category: '',
      image: '',
      isTrending: false
    });
    setShowAddForm(true);
  };

  const handleEditFoodItem = (foodItem) => {
    setEditingFoodItem(foodItem);
    setImageSource('url');
    setSelectedFile(null);
    setFormData({
      name: foodItem.name || '',
      description: foodItem.description || '',
      price: foodItem.price || 0,
      category: foodItem.category || '',
      image: foodItem.image || '',
      isTrending: foodItem.isTrending || false
    });
    setShowAddForm(true);
  };

  const handleDeleteFoodItem = async (foodItemId) => {
    if (window.confirm('Are you sure you want to delete this food item?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/food-items/${foodItemId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          // Refresh the menu list
          const menuResponse = await fetch(`${API_BASE_URL}/api/restaurants/${selectedRestaurant._id}/menu`);
          const menuData = await menuResponse.json();
          setFoodItems(menuData.items || []);
        } else {
          alert('Failed to delete food item');
        }
      } catch (error) {
        console.error('Error deleting food item:', error);
        alert('Failed to delete food item');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let finalImageUrl = formData.image;

      // Handle file upload if selected
      if (imageSource === 'upload' && selectedFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('image', selectedFile);

        const uploadResponse = await fetch(`${API_BASE_URL}/api/upload`, {
          method: 'POST',
          body: uploadFormData
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          finalImageUrl = uploadData.url;
        } else {
          if (uploadResponse.status === 404) {
            alert('Upload endpoint not found. Please restart your backend server to apply recent changes.');
          } else {
            alert('Failed to upload image');
          }
          return;
        }
      }

      if (editingFoodItem) {
        // Update existing food item
        const foodItemId = editingFoodItem._id || editingFoodItem.id;
        const response = await fetch(`${API_BASE_URL}/api/admin/food-items/${foodItemId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            restaurantId: selectedRestaurant._id || selectedRestaurant.id,
            image: finalImageUrl,
            price: parseFloat(formData.price)
          })
        });

        if (response.ok) {
          fetchRestaurantMenu(); // Refresh the list
        } else {
          alert('Failed to update food item');
          return;
        }
      } else {
        // Add new food item
        if (!selectedRestaurant) {
          alert('No restaurant selected!');
          return;
        }
        console.log('Using restaurant ID:', selectedRestaurant._id || selectedRestaurant.id);

        const response = await fetch(`${API_BASE_URL}/api/admin/food-items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            restaurantId: selectedRestaurant._id || selectedRestaurant.id,
            image: finalImageUrl,
            price: parseFloat(formData.price)
          })
        });

        if (response.ok) {
          fetchRestaurantMenu(); // Refresh the list
        } else {
          alert('Failed to add food item');
          return;
        }
      }

      // Reset form
      setFormData({ name: '', description: '', price: 0, category: '', image: '', isTrending: false });
      setShowAddForm(false);
      setEditingFoodItem(null);
      setSelectedFile(null);
      setImageSource('url');
    } catch (error) {
      console.error('Error saving food item:', error);
      alert('Failed to save food item');
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked :
      e.target.name === 'price' ? parseFloat(e.target.value) : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  // Categories will be fetched from the database
  const [categories, setCategories] = useState([]);

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/categories`);
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Fallback to default categories if API fails
      setCategories([
        'Appetizers', 'Biryani', 'Burgers', 'Chinese', 'Desserts',
        'Drinks', 'Ice Creams', 'Indian', 'Mexican', 'Milk Shakes',
        'Noodles', 'Pasta', 'Pizza', 'Salads', 'Sandwiches', 'Sides'
      ]);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div className="foods-section">
      {!selectedRestaurant ? (
        // Restaurant Selection View
        <>
          <h2>Select a Restaurant</h2>
          <div className="restaurants-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {restaurants.map(restaurant => (
              <div
                key={restaurant._id || restaurant.id}
                className="restaurant-card"
                onClick={() => setSelectedRestaurant(restaurant)}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  backgroundColor: 'white'
                }}
              >
                <div style={{ height: '150px', overflow: 'hidden' }}>
                  <img
                    src={restaurant.image}
                    alt={restaurant.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/300x150?text=No+Image'; }}
                  />
                </div>
                <div style={{ padding: '15px' }}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem' }}>{restaurant.name}</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', fontSize: '0.9rem' }}>
                    <span>⭐ {restaurant.rating}</span>
                    <span>🕒 {restaurant.deliveryTime}</span>
                  </div>
                  <p style={{ color: '#888', margin: '10px 0 0 0', fontSize: '0.9rem' }}>
                    {Array.isArray(restaurant.cuisine) ? restaurant.cuisine.join(', ') : restaurant.cuisine}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        // Items View for Selected Restaurant
        <>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '15px' }}>
            <button
              className="btn-secondary"
              onClick={() => setSelectedRestaurant(null)}
              style={{ padding: '8px 15px' }}
            >
              ← Back
            </button>
            <h2 style={{ margin: 0 }}>Menu: {selectedRestaurant.name}</h2>
          </div>

          {!showAddForm ? (
            <>
              <button className="btn-primary" onClick={handleAddFoodItem}>
                Add New Food Item
              </button>

              {loading ? (
                <div>Loading food items...</div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Price</th>
                      <th>Category</th>
                      <th>Trending</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {foodItems.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '30px' }}>
                          No food items found for this restaurant. Add one to get started!
                        </td>
                      </tr>
                    ) : (
                      foodItems.map(foodItem => (
                        <tr key={foodItem._id || foodItem.id}>
                          <td>
                            <img
                              src={foodItem.image}
                              alt={foodItem.name}
                              style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                            />
                          </td>
                          <td>{foodItem.name}</td>
                          <td>{foodItem.description}</td>
                          <td>{formatPriceInRupees(foodItem.price)}</td>
                          <td>{foodItem.category || 'N/A'}</td>
                          <td>{foodItem.isTrending ? '🔥 Yes' : 'No'}</td>
                          <td>
                            <button
                              className="btn-edit"
                              onClick={() => handleEditFoodItem(foodItem)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn-delete"
                              onClick={() => handleDeleteFoodItem(foodItem._id || foodItem.id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </>
          ) : (
            <div className="form-container">
              <h3>{editingFoodItem ? 'Edit Food Item' : 'Add New Food Item'}</h3>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="name">Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Image Source</label>
                  <div style={{ display: 'flex', gap: '20px', marginBottom: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', fontWeight: 'normal' }}>
                      <input
                        type="radio"
                        checked={imageSource === 'url'}
                        onChange={() => setImageSource('url')}
                        style={{ width: 'auto', marginRight: '5px' }}
                      />
                      Image URL
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', fontWeight: 'normal' }}>
                      <input
                        type="radio"
                        checked={imageSource === 'upload'}
                        onChange={() => setImageSource('upload')}
                        style={{ width: 'auto', marginRight: '5px' }}
                      />
                      Upload Image
                    </label>
                  </div>

                  {imageSource === 'url' ? (
                    <>
                      <label htmlFor="image">Image URL</label>
                      <input
                        type="url"
                        id="image"
                        name="image"
                        value={formData.image}
                        onChange={handleChange}
                        required={imageSource === 'url'}
                        placeholder="https://example.com/food.jpg"
                      />
                    </>
                  ) : (
                    <>
                      <label htmlFor="file">Upload Image</label>
                      <input
                        type="file"
                        id="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        required={imageSource === 'upload'}
                      />
                      {/* Preview if editing and image exists */}
                      {formData.image && !selectedFile && (
                        <div style={{ marginTop: '10px', fontSize: '0.9rem', color: '#666' }}>
                          Current image will be kept if no new file is uploaded.
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="price">Price</label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleChange}
                    required
                  />
                  {formData.price && (
                    <div className="price-preview">
                      Price in INR: {formatPriceInRupees(formData.price)}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="category">Category</label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="checkbox"
                    id="isTrending"
                    name="isTrending"
                    checked={formData.isTrending}
                    onChange={handleChange}
                    style={{ width: 'auto' }}
                  />
                  <label htmlFor="isTrending" style={{ marginBottom: 0 }}>Mark as Trending</label>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-primary">
                    {editingFoodItem ? 'Update Food Item' : 'Add Food Item'}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingFoodItem(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
}