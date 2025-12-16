import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  TouchableWithoutFeedback
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAX_TRANSLATE_Y = -SCREEN_HEIGHT * 0.8;

interface BottomSheetProps {
  children: React.ReactNode;
  onClose: () => void;
}

export interface BottomSheetRef {
  scrollTo: (y: number, animated?: boolean) => void;
  close: () => void;
}

const BottomSheet = forwardRef<BottomSheetRef, BottomSheetProps>((props, ref) => {
  const { children, onClose } = props;
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const [isOpen, setIsOpen] = useState(false);

  const scrollTo = useCallback((destination: number, animated = true) => {
    if (animated) {
      Animated.spring(translateY, {
        toValue: destination,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }).start();
    } else {
      translateY.setValue(destination);
    }
  }, [translateY]);

  const close = useCallback(() => {
    scrollTo(SCREEN_HEIGHT, true);
    setTimeout(() => {
      onClose();
    }, 300);
  }, [onClose, scrollTo]);

  useImperativeHandle(ref, () => ({
    scrollTo,
    close,
  }));

  useEffect(() => {
    scrollTo(MAX_TRANSLATE_Y, true);
    setIsOpen(true);
  }, [scrollTo]);

  const backdropOpacity = translateY.interpolate({
    inputRange: [MAX_TRANSLATE_Y, SCREEN_HEIGHT],
    outputRange: [0.5, 0],
    extrapolate: 'clamp',
  });

  return (
    <GestureHandlerRootView style={styles.container}>
      <TouchableWithoutFeedback onPress={close}>
        <Animated.View
          style={[styles.backdrop, { opacity: backdropOpacity }]}
        />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.bottomSheet,
          {
            transform: [{ translateY }],
          },
        ]}
      >
        <View style={styles.indicator} />
        {children}
      </Animated.View>
    </GestureHandlerRootView>
  );
});

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheet: {
    position: 'absolute',
    top: SCREEN_HEIGHT,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.8, // Explicit height to constrain content
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  indicator: {
    width: 40,
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: 10,
  },
});

export default BottomSheet;