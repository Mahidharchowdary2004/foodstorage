import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert, DeviceEventEmitter, NativeEventEmitter, Platform } from 'react-native';
import { API_BASE_URL } from '@/app/config';

// Define types
interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (emailOrPhone: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  signup: (name: string, email: string, phone: string, password: string) => Promise<{ success: boolean; message?: string }>;
  requireAuth: (navigateToLogin: () => void, callback: () => void) => void;
}

// Create context
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => ({ success: false, message: 'Not implemented' }),
  logout: () => { },
  signup: async () => ({ success: false, message: 'Not implemented' }),
  requireAuth: () => { },
});

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Simulate checking auth status (in a real app, this would check stored tokens)
  useEffect(() => {
    // For now, we'll just set isLoading to false
    setState(prev => ({
      ...prev,
      isLoading: false,
    }));
  }, []);

  const login = async (emailOrPhone: string, password: string) => {
    try {
      console.log('Attempting login with:', { emailOrPhone, password });

      // API call to login endpoint - using the correct admin auth endpoint
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: emailOrPhone, // This can be email or phone for regular users
          password,
        }),
      });

      console.log('Login response status:', response.status);
      const responseText = await response.text();
      console.log('Login response text:', responseText);

      // Check if response is JSON
      try {
        const data = JSON.parse(responseText);
        console.log('Parsed login response:', data);

        if (response.ok && data.success) {
          console.log('Login successful, user data:', data.user);
          setState({
            user: {
              id: data.user.id.toString(),
              name: data.user.name || data.user.username,
              email: data.user.email || `${data.user.username}@example.com`,
              phone: data.user.phone || '(555) 123-4567'
            },
            isAuthenticated: true,
            isLoading: false,
          });

          return { success: true };
        } else {
          console.log('Login failed:', data.message || 'Invalid credentials');
          return { success: false, message: data.message || 'Invalid credentials' };
        }
      } catch (jsonError) {
        console.error('JSON Parse error:', jsonError);
        console.error('Response text:', responseText);

        // Check if it's an HTML error page
        if (responseText.includes('<html') || responseText.includes('<!DOCTYPE')) {
          return { success: false, message: 'Login endpoint not available. Please check backend server.' };
        }

        return { success: false, message: 'Server error. Please try again later.' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Failed to connect to server' };
    }
  };

  const signup = async (name: string, email: string, phone: string, password: string) => {
    try {
      console.log('Attempting signup with:', { name, email, phone, password });

      // Use the admin API to create a user (since there's no public signup endpoint)
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          // Note: In a real app, password would be hashed on the server
          // For this demo, we're just storing it as-is
          password,
          signupDate: new Date().toISOString().split('T')[0]
        }),
      });

      console.log('Signup response status:', response.status);
      const responseText = await response.text();
      console.log('Signup response text:', responseText);

      // Check if response is JSON
      try {
        const data = JSON.parse(responseText);
        console.log('Parsed signup response:', data);

        if (response.ok) {
          console.log('Signup successful');
          // After successful signup, automatically log the user in
          return { success: true, message: 'Account created successfully! You can now log in.' };
        } else {
          console.log('Signup failed:', data.message || 'Failed to create account');
          return { success: false, message: data.message || 'Failed to create account' };
        }
      } catch (jsonError) {
        console.error('JSON Parse error:', jsonError);
        console.error('Response text:', responseText);

        // Check if it's an HTML error page (endpoint not found)
        if (responseText.includes('Cannot POST') || responseText.includes('<html') || responseText.includes('<!DOCTYPE')) {
          return { success: false, message: 'Signup is not available. Please contact support.' };
        }

        return { success: false, message: 'Server error. Please try again later.' };
      }
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, message: 'Failed to connect to server' };
    }
  };

  const logout = () => {
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });

    // Dispatch a custom event to notify other parts of the app
    const emitter = Platform.OS === 'android' ? DeviceEventEmitter : new NativeEventEmitter();
    emitter.emit('user-logout');
  };

  const requireAuth = (navigateToLogin: () => void, callback: () => void) => {
    if (state.isAuthenticated) {
      callback();
    } else {
      // Navigate to login screen
      navigateToLogin();
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, signup, requireAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}