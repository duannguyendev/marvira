import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { useTranslation } from 'react-i18next';
import { Location } from '../types';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { DEFAULT_MAP_REGION } from '../utils/constants';

const { height } = Dimensions.get('window');
const MAP_HEIGHT = height * 0.32;

interface MapPickerProps {
  coordinate: Location;
  onCoordinateChange: (location: Location) => void;
  onUseMyLocation?: () => void;
  markers?: Array<{ id: string; coordinate: Location; label?: string }>;
}

export const MapPicker: React.FC<MapPickerProps> = ({
  coordinate,
  onCoordinateChange,
  onUseMyLocation,
  markers = [],
}) => {
  const { t } = useTranslation();
  const [region, setRegion] = useState<Region>({
    ...coordinate,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const handleMapPress = (event: {
    nativeEvent: { coordinate: { latitude: number; longitude: number } };
  }) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    onCoordinateChange({ latitude, longitude });
  };

  const handleMarkerDrag = (event: {
    nativeEvent: { coordinate: { latitude: number; longitude: number } };
  }) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    onCoordinateChange({ latitude, longitude });
  };

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        onPress={handleMapPress}
        showsUserLocation
        showsMyLocationButton={false}>
        {markers.map(marker => (
          <Marker
            key={marker.id}
            coordinate={marker.coordinate}
            title={marker.label}
            pinColor={colors.textLight}
          />
        ))}
        <Marker
          coordinate={coordinate}
          draggable
          onDragEnd={handleMarkerDrag}
          pinColor={colors.mapMarker}
        />
      </MapView>
      {onUseMyLocation ? (
        <TouchableOpacity
          style={styles.locationButton}
          onPress={onUseMyLocation}>
          <Text style={styles.locationButtonText}>
            {t('createEvent.useMyLocation')}
          </Text>
        </TouchableOpacity>
      ) : null}
      <Text style={styles.hint}>{t('createEvent.mapTapHint')}</Text>
    </View>
  );
};

export function getDefaultCoordinate(userLocation?: Location | null): Location {
  if (userLocation) {
    return userLocation;
  }
  return {
    latitude: DEFAULT_MAP_REGION.latitude,
    longitude: DEFAULT_MAP_REGION.longitude,
  };
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  map: {
    height: MAP_HEIGHT,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  locationButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  locationButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  hint: {
    marginTop: spacing.sm,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
