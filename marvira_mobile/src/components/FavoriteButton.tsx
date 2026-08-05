import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, fontSize } from '../theme';

interface FavoriteButtonProps {
  isFavorite: boolean;
  onPress: () => void;
  size?: number;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  isFavorite,
  onPress,
  size = 24,
  style,
  accessibilityLabel,
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.button, style]}
    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}>
    <Text style={[styles.icon, { fontSize: size }]}>
      {isFavorite ? '★' : '☆'}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    padding: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    color: colors.warning,
  },
});
