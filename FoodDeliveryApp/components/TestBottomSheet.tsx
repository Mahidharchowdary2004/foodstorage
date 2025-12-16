import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetRef } from './BottomSheet';
import ProductDetail from './ProductDetail';

const TestBottomSheet = () => {
  const bottomSheetRef = useRef<BottomSheetRef>(null);
  const [showBottomSheet, setShowBottomSheet] = useState(false);

  const testProduct = {
    id: '1',
    name: 'Deluxe Burger',
    description: 'Juicy beef patty with cheese, lettuce, tomato, and special sauce',
    price: 120,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80'
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bottom Sheet Test</Text>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={() => setShowBottomSheet(true)}
      >
        <Text style={styles.buttonText}>Open Bottom Sheet</Text>
      </TouchableOpacity>
      
      {showBottomSheet && (
        <BottomSheet 
          ref={bottomSheetRef}
          onClose={() => setShowBottomSheet(false)}
        >
          <ProductDetail 
            product={testProduct}
            onAddToCart={(quantity, addons) => {
              console.log('Add to cart:', { quantity, addons });
              alert(`Added ${quantity} ${testProduct.name} with ${addons.length} addons to cart`);
              bottomSheetRef.current?.close();
            }}
            onClose={() => {
              bottomSheetRef.current?.close();
            }}
          />
        </BottomSheet>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TestBottomSheet;