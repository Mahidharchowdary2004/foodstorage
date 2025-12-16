import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/auth-context';
import { API_BASE_URL } from '@/app/config';

export default function ProfileScreen() {
    const router = useRouter();
    const { user, logout, isLoading } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [isUpdating, setIsUpdating] = useState(false);

    // Update state when user changes
    React.useEffect(() => {
        if (user) {
            setName(user.name);
            setEmail(user.email);
            setPhone(user.phone);
        }
    }, [user]);

    const handleUpdateProfile = async () => {
        if (!name || !email || !phone) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setIsUpdating(true);
        try {
            // Note: In a real app, you would have a PUT /api/user/profile endpoint
            // For now, we will simulate it or use the admin update user endpoint if user is admin-like

            // Example update call
            const response = await fetch(`${API_BASE_URL}/api/admin/users/${user?.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    email,
                    phone
                })
            });

            if (response.ok) {
                Alert.alert('Success', 'Profile updated successfully');
                setIsEditing(false);
                // Here we should ideally update the local user context too
                // But for now, a refresh or re-login might be needed to see changes unless we add updateUser to context
            } else {
                Alert.alert('Error', 'Failed to update profile');
            }
        } catch (error) {
            console.error('Update error:', error);
            Alert.alert('Error', 'Failed to connect to server');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: () => {
                        logout();
                        router.replace('/');
                    }
                }
            ]
        );
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF6B35" />
            </View>
        );
    }

    if (!user) {
        return (
            <View style={styles.container}>
                <View style={styles.guestContainer}>
                    <Text style={styles.guestTitle}>Welcome Guest</Text>
                    <Text style={styles.guestSubtitle}>Please login to view your profile</Text>
                    <TouchableOpacity
                        style={styles.loginButton}
                        onPress={() => router.push('/auth/login')}
                    >
                        <Text style={styles.loginButtonText}>Login / Signup</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
            </View>

            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Personal Details</Text>
                    <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
                        <Text style={styles.editButton}>{isEditing ? 'Cancel' : 'Edit'}</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Name</Text>
                        {isEditing ? (
                            <TextInput
                                style={styles.input}
                                value={name}
                                onChangeText={setName}
                            />
                        ) : (
                            <Text style={styles.value}>{user.name}</Text>
                        )}
                    </View>
                    <View style={styles.divider} />

                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Email</Text>
                        {isEditing ? (
                            <TextInput
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        ) : (
                            <Text style={styles.value}>{user.email}</Text>
                        )}
                    </View>
                    <View style={styles.divider} />

                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Phone</Text>
                        {isEditing ? (
                            <TextInput
                                style={styles.input}
                                value={phone}
                                onChangeText={setPhone}
                                keyboardType="phone-pad"
                            />
                        ) : (
                            <Text style={styles.value}>{user.phone}</Text>
                        )}
                    </View>
                </View>

                {isEditing && (
                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleUpdateProfile}
                        disabled={isUpdating}
                    >
                        {isUpdating ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.saveButtonText}>Save Changes</Text>
                        )}
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Settings</Text>
                <View style={styles.menuCard}>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => router.push('/orders')}
                    >
                        <Text style={styles.menuIcon}>📦</Text>
                        <Text style={styles.menuText}>My Orders</Text>
                        <Text style={styles.chevron}>›</Text>
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    <TouchableOpacity style={styles.menuItem}>
                        <Text style={styles.menuIcon}>📍</Text>
                        <Text style={styles.menuText}>Saved Addresses</Text>
                        <Text style={styles.chevron}>›</Text>
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    <TouchableOpacity style={styles.menuItem}>
                        <Text style={styles.menuIcon}>🔔</Text>
                        <Text style={styles.menuText}>Notifications</Text>
                        <Text style={styles.chevron}>›</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
                <Text style={styles.versionText}>Version 1.0.0</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    guestContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    guestTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    guestSubtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 30,
    },
    loginButton: {
        backgroundColor: '#FF6B35',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 25,
        elevation: 3,
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    header: {
        backgroundColor: '#fff',
        alignItems: 'center',
        paddingVertical: 30,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FF6B35',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        elevation: 5,
        shadowColor: '#FF6B35',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    avatarText: {
        fontSize: 32,
        color: '#fff',
        fontWeight: 'bold',
    },
    userName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    userEmail: {
        fontSize: 14,
        color: '#666',
    },
    section: {
        marginTop: 20,
        paddingHorizontal: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    editButton: {
        color: '#FF6B35',
        fontWeight: '600',
    },
    infoCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    menuCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingVertical: 5,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        marginBottom: 10,
    },
    infoRow: {
        paddingVertical: 10,
    },
    label: {
        fontSize: 12,
        color: '#888',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    value: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    input: {
        fontSize: 16,
        color: '#333',
        borderBottomWidth: 1,
        borderBottomColor: '#FF6B35',
        paddingVertical: 2,
    },
    divider: {
        height: 1,
        backgroundColor: '#f0f0f0',
    },
    saveButton: {
        backgroundColor: '#FF6B35',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 15,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
    },
    menuIcon: {
        fontSize: 20,
        marginRight: 15,
        width: 25,
        textAlign: 'center',
    },
    menuText: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    chevron: {
        fontSize: 20,
        color: '#ccc',
    },
    logoutButton: {
        margin: 20,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ff4d4d',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    logoutText: {
        color: '#ff4d4d',
        fontSize: 16,
        fontWeight: 'bold',
    },
    footer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    versionText: {
        color: '#ccc',
        fontSize: 12,
    }
});
