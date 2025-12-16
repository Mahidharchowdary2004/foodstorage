import { useNavigation } from 'expo-router';

export function useAppNavigation() {
  const navigation = useNavigation();
  
  return {
    navigateToLogin: () => {
      // @ts-ignore
      navigation.navigate('auth/login');
    },
    navigateToHome: () => {
      // @ts-ignore
      navigation.navigate('(tabs)');
    }
  };
}