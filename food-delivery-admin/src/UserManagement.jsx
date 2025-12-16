import React, { useState, useEffect } from 'react';

import { API_BASE_URL } from './config';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '' // Add password field
  });

  // Fetch users from API
  const [error, setError] = useState(null);

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      // Use 127.0.0.1 to avoid localhost resolution issues
      const response = await fetch(`${API_BASE_URL}/api/admin/users`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setUsers(data);
      } else {
        console.error('Expected array of users but got:', data);
        setUsers([]);
        setError('Received invalid data format from server');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users. Ensure backend is running.');
      // Keep existing users if fetch fails, or clear?
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (editingUser) {
      setFormData({
        name: editingUser.name || '',
        email: editingUser.email || '',
        phone: editingUser.phone || '',
        password: '' // Don't prefill password for security
      });
    }
  }, [editingUser]);

  const handleAddUser = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', phone: '', password: '' });
    setShowAddForm(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      password: '' // Don't prefill password for security
    });
    setShowAddForm(true);
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          fetchUsers(); // Refresh the list
        } else {
          alert('Failed to delete user');
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name || !formData.email) {
      alert('Name and email are required');
      return;
    }

    try {
      if (editingUser) {
        // Update existing user (don't update password unless provided)
        const updateData = { ...formData };
        if (!updateData.password) {
          delete updateData.password; // Don't update password if not provided
        }

        const response = await fetch(`${API_BASE_URL}/api/admin/users/${editingUser._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData)
        });

        if (response.ok) {
          fetchUsers(); // Refresh the list
        } else {
          alert('Failed to update user');
          return;
        }
      } else {
        // Validate password for new users
        if (!formData.password) {
          alert('Password is required for new users');
          return;
        }

        // Add new user
        const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            signupDate: new Date().toISOString().split('T')[0]
          })
        });

        if (response.ok) {
          fetchUsers(); // Refresh the list
        } else {
          alert('Failed to add user');
          return;
        }
      }

      // Reset form
      setFormData({ name: '', email: '', phone: '', password: '' });
      setShowAddForm(false);
      setEditingUser(null);
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Failed to save user');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="users-section">
      <h2>User Management</h2>

      {!showAddForm ? (
        <>
          <button className="btn-primary" onClick={handleAddUser}>
            Add New User
          </button>

          {error && <div className="error-message" style={{ color: 'red', margin: '10px 0' }}>{error}</div>}

          {loading ? (
            <div>Loading users...</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Signup Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="empty-state">
                      <h3>👥 No Users Found</h3>
                      <p>There are currently no users in the system.</p>
                      <p>Add a new user to get started.</p>
                    </td>
                  </tr>
                ) : (
                  users.map(user => (
                    <tr key={user._id}>
                      <td>{user._id}</td>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.phone}</td>
                      <td>{user.signupDate || 'N/A'}</td>
                      <td>
                        <button
                          className="btn-edit"
                          onClick={() => handleEditUser(user)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => handleDeleteUser(user._id)}
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
          <h3>{editingUser ? 'Edit User' : 'Add New User'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Name:</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone:</label>
              <input
                type="text"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">
                {editingUser ? 'New Password (leave blank to keep current)' : 'Password:'}
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                {...(!editingUser && { required: true })}
              />
            </div>

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => {
                setShowAddForm(false);
                setEditingUser(null);
              }}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                {editingUser ? 'Update User' : 'Add User'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}