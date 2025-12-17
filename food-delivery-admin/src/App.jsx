import React, { useState } from 'react';
import './App.css';
import Dashboard from './Dashboard';
import UserManagement from './UserManagement';
import RestaurantManagement from './RestaurantManagement';
import FoodManagement from './FoodManagement';
import OrderManagement from './OrderManagement';

function App({ onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div className="header-left">
          <button
            className="menu-toggle"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            ☰
          </button>
          <h1>Food Delivery Admin</h1>
        </div>
        <div className="user-info">
          <span>Admin User</span>
          <button onClick={onLogout} className="logout-button">Logout</button>
        </div>
      </header>

      <div className="admin-content">
        {/* Overlay for mobile */}
        <div
          className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`}
          onClick={() => setIsSidebarOpen(false)}
        />

        <nav className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
          <ul>
            <li className={activeTab === 'dashboard' ? 'active' : ''}>
              <button onClick={() => handleTabChange('dashboard')}>
                Dashboard
              </button>
            </li>
            <li className={activeTab === 'users' ? 'active' : ''}>
              <button onClick={() => handleTabChange('users')}>
                Users
              </button>
            </li>
            <li className={activeTab === 'restaurants' ? 'active' : ''}>
              <button onClick={() => handleTabChange('restaurants')}>
                Restaurants
              </button>
            </li>
            <li className={activeTab === 'foods' ? 'active' : ''}>
              <button onClick={() => handleTabChange('foods')}>
                Food Items
              </button>
            </li>
            <li className={activeTab === 'orders' ? 'active' : ''}>
              <button onClick={() => handleTabChange('orders')}>
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