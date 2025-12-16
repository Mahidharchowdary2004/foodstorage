import React, { useState } from 'react';
import './App.css';
import Dashboard from './Dashboard';
import UserManagement from './UserManagement';
import RestaurantManagement from './RestaurantManagement';
import FoodManagement from './FoodManagement';
import OrderManagement from './OrderManagement';

function App({ onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>Food Delivery Admin Panel</h1>
        <div className="user-info">
          <span>Admin User</span>
          <button onClick={onLogout} className="logout-button">Logout</button>
        </div>
      </header>

      <div className="admin-content">
        <nav className="sidebar">
          <ul>
            <li className={activeTab === 'dashboard' ? 'active' : ''}>
              <button onClick={() => setActiveTab('dashboard')}>
                Dashboard
              </button>
            </li>
            <li className={activeTab === 'users' ? 'active' : ''}>
              <button onClick={() => setActiveTab('users')}>
                Users
              </button>
            </li>
            <li className={activeTab === 'restaurants' ? 'active' : ''}>
              <button onClick={() => setActiveTab('restaurants')}>
                Restaurants
              </button>
            </li>
            <li className={activeTab === 'foods' ? 'active' : ''}>
              <button onClick={() => setActiveTab('foods')}>
                Food Items
              </button>
            </li>
            <li className={activeTab === 'orders' ? 'active' : ''}>
              <button onClick={() => setActiveTab('orders')}>
                Orders
              </button>
            </li>
          </ul>
        </nav>

        <main className="main-content">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'restaurants' && <RestaurantManagement />}
          {activeTab === 'foods' && <FoodManagement />}
          {activeTab === 'orders' && <OrderManagement />}
        </main>
      </div>
    </div>
  );
}

export default App;