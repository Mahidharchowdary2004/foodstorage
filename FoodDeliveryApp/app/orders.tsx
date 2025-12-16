import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/auth-context';
import { formatPriceInRupees } from '@/utils/currency';
import { API_BASE_URL } from '@/app/config';

interface Order {
    _id: string;
    type: string;
    status: string;
    total: number;
    createdAt: string;
    items: any[];
}

export default function OrdersScreen() {
    const router = useRouter();
    const { user, requireAuth } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        requireAuth(() => router.push('/auth/login'), fetchOrders);
    }, [user]);

    const fetchOrders = async () => {
        console.log('Fetching orders. User:', JSON.stringify(user));

        if (!user?.id) {
            console.warn('No user ID found, skipping fetch');
            setLoading(false);
            return;
        }

        try {
            const url = `${API_BASE_URL}/api/orders/user/${user.id}`;
            console.log('Fetching orders from URL:', url);

            const response = await fetch(url);
            console.log('Orders response status:', response.status);

            const data = await response.json();
            console.log('Orders data received:', Array.isArray(data) ? `${data.length} orders` : data);

            if (Array.isArray(data)) {
                setOrders(data);
            } else {
                console.error('Expected array but got:', data);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const activeOrders = orders.filter(o => ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery'].includes(o.status));
    const pastOrders = orders.filter(o => ['Delivered', 'Cancelled'].includes(o.status));

    const renderOrderItem = ({ item }: { item: Order }) => (
        <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
                <Text style={styles.orderId}>Order #{item._id.substring(item._id.length - 6)}</Text>
                <Text style={[styles.status, { color: getStatusColor(item.status) }]}>{item.status}</Text>
            </View>
            <Text style={styles.date}>{new Date(item.createdAt).toLocaleString()}</Text>
            <Text style={styles.itemsText}>
                {item.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
            </Text>
            <View style={styles.footer}>
                <Text style={styles.total}>{formatPriceInRupees(item.total)}</Text>
                <Text style={styles.type}>{item.type.toUpperCase()}</Text>
            </View>
        </View>
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Delivered': return '#28a745';
            case 'Cancelled': return '#dc3545';
            case 'Pending': return '#ffc107';
            default: return '#007bff';
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#FF6B35" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>My Orders</Text>

            <FlatList
                data={[...activeOrders, ...pastOrders]} // Show all, maybe separate sections later
                keyExtractor={item => item._id}
                renderItem={renderOrderItem}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.center}>
                        <Text>No orders found.</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
    list: { paddingBottom: 20 },
    orderCard: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 3 },
    orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    orderId: { fontWeight: 'bold', fontSize: 16 },
    status: { fontWeight: 'bold' },
    date: { color: '#666', fontSize: 12, marginBottom: 10 },
    itemsText: { color: '#333', marginBottom: 10 },
    footer: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10 },
    total: { fontWeight: 'bold', color: '#FF6B35', fontSize: 16 },
    type: { color: '#666', fontSize: 12 }
});
