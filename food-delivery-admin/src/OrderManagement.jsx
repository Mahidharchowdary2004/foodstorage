import React, { useState, useEffect } from 'react';

// Function to format price in Indian Rupees
const formatPriceInRupees = (price) => {
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
    }).format(numericPrice);
};

import { API_BASE_URL } from './config';

export default function OrderManagement() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch orders from API
    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/api/admin/orders`);
            const data = await response.json();
            setOrders(data);
        } catch (error) {
            console.error('Error fetching orders:', error);
            alert('Failed to fetch orders');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                fetchOrders(); // Refresh the list
            } else {
                alert('Failed to update order status');
            }
        } catch (error) {
            console.error('Error updating order status:', error);
            alert('Failed to update order status');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return '#ffc107'; // Yellow
            case 'Confirmed': return '#17a2b8'; // Blue
            case 'Preparing': return '#fd7e14'; // Orange
            case 'Out for Delivery': return '#6610f2'; // Purple
            case 'Delivered': return '#28a745'; // Green
            case 'Cancelled': return '#dc3545'; // Red
            default: return '#6c757d'; // Gray
        }
    };

    return (
        <div className="orders-section">
            <h2>Order Management</h2>

            {loading ? (
                <div>Loading orders...</div>
            ) : (
                <>
                    <div className="actions-bar">
                        <button className="btn-secondary" onClick={fetchOrders}>
                            ↻ Refresh Orders
                        </button>
                    </div>

                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>ID / Type</th>
                                <th>Date</th>
                                <th>Customer Info</th>
                                <th>Items</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="empty-state">
                                        <h3>📦 No Orders Yet</h3>
                                        <p>When users place orders, they will appear here.</p>
                                    </td>
                                </tr>
                            ) : (
                                orders.map(order => (
                                    <tr key={order._id}>
                                        <td>
                                            <strong>#{order._id.substring(order._id.length - 6)}</strong>
                                            <br />
                                            <small>{order.type ? order.type.toUpperCase() : 'DELIVERY'}</small>
                                        </td>
                                        <td>{new Date(order.createdAt).toLocaleString()}</td>
                                        <td>
                                            <div>{order.details ? (order.details.phone || 'N/A') : 'Guest'}</div>
                                            {order.type === 'delivery' && order.details?.address && (
                                                <small style={{ color: '#669' }}>📍 {order.details.address}</small>
                                            )}
                                            {order.type === 'dine-in' && order.details?.tableNumber && (
                                                <small style={{ color: '#696' }}>🍽️ Table: {order.details.tableNumber} (Pax: {order.details.people})</small>
                                            )}
                                        </td>
                                        <td>
                                            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85em' }}>
                                                {order.items && order.items.map((item, idx) => (
                                                    <li key={idx}>
                                                        {item.quantity}x {item.name}
                                                        {item.addons && item.addons.length > 0 && (
                                                            <div style={{ color: '#888', fontSize: '0.9em' }}>
                                                                + {item.addons.map(a => a.name).join(', ')}
                                                            </div>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        </td>
                                        <td><strong>{formatPriceInRupees(order.total)}</strong></td>
                                        <td>
                                            <span
                                                style={{
                                                    backgroundColor: getStatusColor(order.status),
                                                    color: 'white',
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    fontSize: '0.85em'
                                                }}
                                            >
                                                {order.status}
                                            </span>
                                        </td>
                                        <td>
                                            <select
                                                value={order.status}
                                                onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                                className="status-select"
                                                style={{ padding: '5px', borderRadius: '4px' }}
                                            >
                                                <option value="Pending">Pending</option>
                                                <option value="Confirmed">Confirmed</option>
                                                <option value="Preparing">Preparing</option>
                                                <option value="Out for Delivery">Out for Delivery</option>
                                                <option value="Delivered">Delivered</option>
                                                <option value="Cancelled">Cancelled</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </>
            )}
        </div>
    );
}
