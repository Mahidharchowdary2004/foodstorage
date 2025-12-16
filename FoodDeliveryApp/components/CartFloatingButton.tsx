import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useCart } from '@/context/cart-context';
import { formatPriceInRupees } from '@/utils/currency';

export default function CartFloatingButton() {
    const router = useRouter();
    const pathname = usePathname();
    const { state } = useCart();

    // Don't show on cart or checkout screen or if cart is empty
    if (state.totalItems === 0 || pathname === '/cart' || pathname === '/checkout' || pathname.includes('/auth/')) {
        return null;
    }

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={() => router.push('/cart')}
            activeOpacity={0.9}
        >
            <View style={styles.content}>
                <View style={styles.leftInfo}>
                    <Text style={styles.itemCount}>{state.totalItems} ITEMS</Text>
                    <Text style={styles.totalPrice}>{formatPriceInRupees(state.totalPrice)}</Text>
                </View>
                <Text style={styles.viewCartText}>View Cart ›</Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: '#FF6B35',
        borderRadius: 12,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        zIndex: 9999, // Ensure it sits on top of everything
    },
    content: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    leftInfo: {
        flexDirection: 'column',
    },
    itemCount: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        opacity: 0.9,
    },
    totalPrice: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    viewCartText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
