import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { View } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CartProvider } from '@/context/cart-context';
import { AuthProvider } from '@/context/auth-context';
import CartFloatingButton from '@/components/CartFloatingButton';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <CartProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <View style={{ flex: 1 }}>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
              <Stack.Screen name="menu" options={{ headerShown: false }} />
              <Stack.Screen name="checkout" options={{ headerShown: false, title: 'Checkout' }} />
              <Stack.Screen name="profile" options={{ headerShown: false, title: 'Profile' }} />

              {/* Auth screens are auto-detected */}
              <Stack.Screen name="auth/login" options={{ headerShown: false }} />
              <Stack.Screen name="auth/signup" options={{ headerShown: false }} />
            </Stack>
            <CartFloatingButton />
          </View>
          <StatusBar style="auto" />
        </ThemeProvider>
      </CartProvider>
    </AuthProvider>
  );
}