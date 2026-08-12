import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  View,
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { borderRadius, colors } from '../../theme';

type SkeletonPulseProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export const SkeletonPulse: React.FC<SkeletonPulseProps> = ({
  children,
  style,
}) => {
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[style, { opacity }]}
      accessible
      accessibilityRole="progressbar">
      {children}
    </Animated.View>
  );
};

type SkeletonBoneProps = {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

export const SkeletonBone: React.FC<SkeletonBoneProps> = ({
  width,
  height = 14,
  radius = borderRadius.sm,
  style,
}) => (
  <View
    style={[
      styles.bone,
      { height, borderRadius: radius },
      width !== undefined ? { width } : null,
      style,
    ]}
  />
);

const styles = StyleSheet.create({
  bone: {
    backgroundColor: colors.border,
  },
});
