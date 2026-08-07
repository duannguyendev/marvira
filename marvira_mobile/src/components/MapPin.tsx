import React from 'react';
import { View, StyleSheet } from 'react-native';

interface MapPinProps {
  color: string;
  size?: number;
}

/** Simple colored pin for Mapbox PointAnnotation / MarkerView. */
export const MapPin: React.FC<MapPinProps> = ({ color, size = 20 }) => (
  <View
    style={[
      styles.pin,
      {
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
      },
    ]}
  />
);

const styles = StyleSheet.create({
  pin: {
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 3,
  },
});
