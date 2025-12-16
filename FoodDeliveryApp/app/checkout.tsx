import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useCart } from '@/context/cart-context';
import { useAuth } from '@/context/auth-context';
import { formatPriceInRupees } from '@/utils/currency';
import { API_BASE_URL } from '@/app/config';

type OrderType = 'delivery' | 'takeaway' | 'dine-in';

export default function CheckoutScreen() {
    const router = useRouter();
    const { state, clearCart } = useCart();
    const { user } = useAuth();
    const [orderType, setOrderType] = useState<OrderType>('delivery');

    // Delivery/Takeaway Details
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState(user?.phone || ''); // Autofill phone
    const [instructions, setInstructions] = useState('');

    // ...

    const orderDetails = {
        type: orderType,
        userId: user?.id, // Link to user
        userName: user?.name,
        items: state.items,
        total: state.totalPrice,
        details: {
            // ...
        },
        date: new Date().toISOString()
    };


    // Dine-in Details
    const [tableNumber, setTableNumber] = useState('');
    const [numberOfPeople, setNumberOfPeople] = useState('');

    const handlePlaceOrder = async () => {
        if (!user?.id) {
            Alert.alert('Authentication Required', 'Please login to place an order', [
                { text: 'Login', onPress: () => router.push('/auth/login') },
                { text: 'Cancel', style: 'cancel' }
            ]);
            return;
        }

        // Validation
        if (orderType === 'delivery' && !address.trim()) {
            Alert.alert('Required', 'Please enter your delivery address');
            return;
        }
        if (orderType === 'dine-in' && !tableNumber.trim()) {
            Alert.alert('Required', 'Please enter your table number');
            return;
        }
        if (!phone.trim()) {
            Alert.alert('Required', 'Please enter your phone number');
            return;
        }

        const orderDetails = {
            type: orderType,
            userId: user?.id,
            userName: user?.name,
            items: state.items,
            total: state.totalPrice,
            details: {
                address: orderType === 'delivery' ? address : undefined,
                tableNumber: orderType === 'dine-in' ? tableNumber : undefined,
                people: orderType === 'dine-in' ? numberOfPeople : undefined,
                phone,
                instructions
            },
            date: new Date().toISOString()
        };

        try {
            console.log('Sending order to:', `${API_BASE_URL}/api/orders`);

            const response = await fetch(`${API_BASE_URL}/api/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderDetails)
            });

            if (!response.ok) {
                throw new Error('Server responded with error');
            }

            const responseData = await response.json();
            console.log('Order created successfully:', responseData);

            const successMessage = `Order placed for ${orderType.toUpperCase()}! Total: ${formatPriceInRupees(state.totalPrice)}`;

            if (Platform.OS === 'web') {
                alert(successMessage);
                clearCart();
                router.push('/'); // Go to Home
            } else {
                Alert.alert('Success', successMessage, [
                    {
                        text: 'OK', onPress: () => {
                            clearCart();
                            router.push('/');
                        }
                    }
                ]);
            }
        } catch (error) {
            console.error('Order submission error:', error);
            Alert.alert('Error', 'Failed to place order. Please try again.');
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Checkout</Text>

            {/* Order Type Selection */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Select Order Type</Text>
                <View style={styles.typeContainer}>
                    <TouchableOpacity
                        style={[styles.typeButton, orderType === 'delivery' && styles.selectedType]}
                        onPress={() => setOrderType('delivery')}
                    >
                        <Text style={[styles.typeText, orderType === 'delivery' && styles.selectedTypeText]}>Delivery</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.typeButton, orderType === 'takeaway' && styles.selectedType]}
                        onPress={() => setOrderType('takeaway')}
                    >
                        <Text style={[styles.typeText, orderType === 'takeaway' && styles.selectedTypeText]}>Takeaway</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.typeButton, orderType === 'dine-in' && styles.selectedType]}
                        onPress={() => setOrderType('dine-in')}
                    >
                        <Text style={[styles.typeText, orderType === 'dine-in' && styles.selectedTypeText]}>Dine-In</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Dynamic Form Fields */}
            <View style={styles.form}>
                <Text style={styles.sectionTitle}>Details</Text>

                <Text style={styles.label}>Phone Number *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter phone number"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                />

                {orderType === 'delivery' && (
                    <>
                        <Text style={styles.label}>Delivery Address *</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Enter full address"
                            multiline
                            numberOfLines={3}
                            value={address}
                            onChangeText={setAddress}
                        />
                    </>
                )}

                {orderType === 'dine-in' && (
                    <>
                        <View style={styles.row}>
                            <View style={styles.halfInput}>
                                <Text style={styles.label}>Table Number *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. 5"
                                    keyboardType="numeric"
                                    value={tableNumber}
                                    onChangeText={setTableNumber}
                                />
                            </View>
                            <View style={styles.halfInput}>
                                <Text style={styles.label}>No. of People</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. 4"
                                    keyboardType="numeric"
                                    value={numberOfPeople}
                                    onChangeText={setNumberOfPeople}
                                />
                            </View>
                        </View>
                    </>
                )}

                <Text style={styles.label}>Special Instructions (Optional)</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="e.g. Less spicy, extra tissues"
                    multiline
                    numberOfLines={2}
                    value={instructions}
                    onChangeText={setInstructions}
                />
            </View>

            {/* Order Summary */}
            <View style={styles.summary}>
                <Text style={styles.sectionTitle}>Summary</Text>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryText}>Total Items:</Text>
                    <Text style={styles.summaryValue}>{state.items.reduce((acc, item) => acc + item.quantity, 0)}</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.totalText}>Grand Total:</Text>
                    <Text style={styles.totalAmount}>{formatPriceInRupees(state.totalPrice)}</Text>
                </View>
            </View>

            <TouchableOpacity style={styles.placeOrderButton} onPress={handlePlaceOrder}>
                <Text style={styles.placeOrderText}>Place Order ({orderType})</Text>
            </TouchableOpacity>

            <View style={{ height: 50 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
    },
    section: {
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#333',
    },
    typeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    typeButton: {
        flex: 1,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: 4,
        backgroundColor: '#fff',
    },
    selectedType: {
        backgroundColor: '#FF6B35',
        borderColor: '#FF6B35',
    },
    typeText: {
        fontWeight: '600',
        color: '#666',
    },
    selectedTypeText: {
        color: '#fff',
    },
    form: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 15,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    label: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
        fontWeight: '500',
    },
    input: {
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 15,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    halfInput: {
        width: '48%',
    },
    summary: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 15,
        marginBottom: 25,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    summaryText: {
        fontSize: 16,
        color: '#666',
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    totalText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    totalAmount: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FF6B35',
    },
    placeOrderButton: {
        backgroundColor: '#FF6B35',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#FF6B35',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    placeOrderText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
});
