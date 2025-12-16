import React, { useState, useEffect } from 'react';

import { API_BASE_URL } from './config';

export default function RestaurantManagement() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [imageSource, setImageSource] = useState('url'); // 'url' or 'upload'
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    rating: 0,
    deliveryTime: '',
    image: '',
    cuisine: '',
    distance: ''
  });

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
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const handleAddRestaurant = () => {
    setEditingRestaurant(null);
    setImageSource('url');
    setSelectedFile(null);
    setFormData({
      name: '',
      rating: 0,
      deliveryTime: '',
      image: '',
      cuisine: '',
      distance: ''
    });
    setShowAddForm(true);
  };

  const handleEditRestaurant = (restaurant) => {
    setEditingRestaurant(restaurant);
    setImageSource('url'); // Default to URL for existing items
    setSelectedFile(null);
    setFormData({
      name: restaurant.name || '',
      rating: restaurant.rating || 0,
      deliveryTime: restaurant.deliveryTime || '',
      image: restaurant.image || '',
      cuisine: Array.isArray(restaurant.cuisine) ? restaurant.cuisine.join(', ') : (restaurant.cuisine || ''),
      distance: restaurant.distance || ''
    });
    setShowAddForm(true);
  };

  const handleDeleteRestaurant = async (id) => {
    if (window.confirm('Are you sure you want to delete this restaurant?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/restaurants/${id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          fetchRestaurants();
        } else {
          alert('Failed to delete restaurant');
        }
      } catch (error) {
        console.error('Error deleting restaurant:', error);
        alert('Failed to delete restaurant');
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

      if (editingRestaurant) {
        // Update existing restaurant
        const response = await fetch(`${API_BASE_URL}/api/admin/restaurants/${editingRestaurant._id || editingRestaurant.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            image: finalImageUrl,
            rating: parseFloat(formData.rating),
            cuisine: formData.cuisine.split(',').map(c => c.trim()).filter(Boolean)
          })
        });

        if (response.ok) {
          fetchRestaurants();
        } else {
          alert('Failed to update restaurant');
          return;
        }
      } else {
        // Add new restaurant
        const response = await fetch(`${API_BASE_URL}/api/admin/restaurants`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            image: finalImageUrl,
            rating: parseFloat(formData.rating),
            cuisine: formData.cuisine.split(',').map(c => c.trim()).filter(Boolean)
          })
        });

        if (response.ok) {
          fetchRestaurants();
        } else {
          alert('Failed to add restaurant');
          return;
        }
      }

      // Reset form
      setFormData({
        name: '',
        rating: 0,
        deliveryTime: '',
        image: '',
        cuisine: '',
        distance: ''
      });
      setShowAddForm(false);
      setEditingRestaurant(null);
      setSelectedFile(null);
      setImageSource('url');
    } catch (error) {
      console.error('Error saving restaurant:', error);
      alert('Failed to save restaurant');
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleChange = (e) => {
    const value = e.target.name === 'rating' ? parseFloat(e.target.value) : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  return (
    <div className="restaurants-section">
      <h2>Restaurant Management</h2>

      {!showAddForm ? (
        <>
          <button className="btn-primary" onClick={handleAddRestaurant}>
            Add New Restaurant
          </button>

          {loading ? (
            <div>Loading restaurants...</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Image</th>
                  <th>Rating</th>
                  <th>Delivery Time</th>
                  <th>Cuisine</th>
                  <th>Distance</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {restaurants.map(restaurant => (
                  <tr key={restaurant._id || restaurant.id}>
                    <td>{restaurant.name}</td>
                    <td>
                      <img
                        src={restaurant.image}
                        alt={restaurant.name}
                        style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </td>
                    <td>{restaurant.rating}</td>
                    <td>{restaurant.deliveryTime}</td>
                    <td>{Array.isArray(restaurant.cuisine) ? restaurant.cuisine.join(', ') : restaurant.cuisine}</td>
                    <td>{restaurant.distance || 'N/A'}</td>
                    <td>
                      <button
                        className="btn-edit"
                        onClick={() => handleEditRestaurant(restaurant)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDeleteRestaurant(restaurant._id || restaurant.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      ) : (
        <div className="form-container">
          <h3>{editingRestaurant ? 'Edit Restaurant' : 'Add New Restaurant'}</h3>
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
                    placeholder="https://example.com/image.jpg"
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
              <label htmlFor="rating">Rating (0-5)</label>
              <input
                type="number"
                id="rating"
                name="rating"
                min="0"
                max="5"
                step="0.1"
                value={formData.rating}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="deliveryTime">Delivery Time</label>
              <input
                type="text"
                id="deliveryTime"
                name="deliveryTime"
                value={formData.deliveryTime}
                onChange={handleChange}
                required
                placeholder="e.g. 30-45 min"
              />
            </div>

            <div className="form-group">
              <label htmlFor="cuisine">Cuisine (comma separated)</label>
              <input
                type="text"
                id="cuisine"
                name="cuisine"
                value={formData.cuisine}
                onChange={handleChange}
                required
                placeholder="Italian, Fast Food, Spicy"
              />
            </div>

            <div className="form-group">
              <label htmlFor="distance">Distance (optional)</label>
              <input
                type="text"
                id="distance"
                name="distance"
                value={formData.distance}
                onChange={handleChange}
                placeholder="e.g. 2.5 km"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                {editingRestaurant ? 'Update Restaurant' : 'Add Restaurant'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingRestaurant(null);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}