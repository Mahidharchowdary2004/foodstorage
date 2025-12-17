import React, { useState, useEffect } from 'react';

import { API_BASE_URL } from './config';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalUsers: 0,
    totalRestaurants: 0,
    totalRevenue: 0
  });

  const [loading, setLoading] = useState(true);


  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/api/admin/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats({
          totalOrders: data.totalOrders || 0,
          totalUsers: data.totalUsers || 0,
          totalRestaurants: data.totalRestaurants || 0,
          totalRevenue: data.totalRevenue || 0
        });
      } else {
        console.error('Failed to fetch stats');
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoading(false);
    }
  };



  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="dashboard">
      <h2>Admin Dashboard</h2>

      {loading ? (
        <div className="loading">Loading dashboard...</div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📦</div>
              <div className="stat-info">
                <h3>{stats.totalOrders}</h3>
                <p>Total Orders</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-info">
                <h3>{stats.totalUsers}</h3>
                <p>Total Users</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🏪</div>
              <div className="stat-info">
                <h3>{stats.totalRestaurants}</h3>
                <p>Restaurants</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-info">
                <h3>{formatCurrency(stats.totalRevenue)}</h3>
                <p>Total Revenue</p>
              </div>
            </div>
          </div>

          <div className="quick-actions">
            <h3>Quick Actions</h3>
            <div className="actions-grid">
              <div className="action-card" onClick={() => window.location.hash = '/users'}>
                <span className="action-icon">👥</span>
                <div>Manage Users</div>
              </div>

              <div className="action-card" onClick={() => window.location.hash = '/orders'}>
                <span className="action-icon">📦</span>
                <div>Manage Orders</div>
              </div>

              <div className="action-card" onClick={() => window.location.hash = '/restaurants'}>
                <span className="action-icon">🏪</span>
                <div>Manage Restaurants</div>
              </div>

              <div className="action-card" onClick={() => window.location.hash = '/food-items'}>
                <span className="action-icon">🍔</span>
                <div>Manage Food Items</div>
              </div>


            </div>
          </div>
        </>
      )}
    </div>
  );
}