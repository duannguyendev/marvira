import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
} from 'react-native';
import Mapbox from '@rnmapbox/maps';
import { useTranslation } from 'react-i18next';
import { Location } from '../types';
import { MapPin } from './MapPin';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { locationService } from '../services/location.service';
import { DEFAULT_MAP_REGION, MAP_CAMERA_ANIMATION_MS } from '../utils/constants';
import { hasUsableCoordinates } from '../utils/distance';
import { MAPBOX_STYLE, zoomFromLatitudeDelta } from '../utils/mapbox';

const { height } = Dimensions.get('window');
const MAP_HEIGHT = height * 0.32;
const DEFAULT_DELTA = 0.01;
const DEFAULT_ZOOM = zoomFromLatitudeDelta(DEFAULT_DELTA);

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
  const cameraRef = useRef<React.ElementRef<typeof Mapbox.Camera>>(null);
  const zoomRef = useRef(DEFAULT_ZOOM);

  useEffect(() => {
    cameraRef.current?.setCamera({
      centerCoordinate: [coordinate.longitude, coordinate.latitude],
      zoomLevel: zoomRef.current,
      animationDuration: MAP_CAMERA_ANIMATION_MS,
      animationMode: 'easeTo',
    });
  }, [coordinate.latitude, coordinate.longitude]);

  const handleMapPress = (event: {
    geometry: { type: string; coordinates: number[] };
  }) => {
    if (event.geometry.type !== 'Point') {
      return;
    }
    const [longitude, latitude] = event.geometry.coordinates;
    onCoordinateChange({ latitude, longitude });
  };

  const handleMarkerDrag = (event: {
    geometry: { type: string; coordinates: number[] };
  }) => {
    if (event.geometry.type !== 'Point') {
      return;
    }
    const [longitude, latitude] = event.geometry.coordinates;
    onCoordinateChange({ latitude, longitude });
  };

  return (
    <View style={styles.container}>
      <Mapbox.MapView
        style={styles.map}
        styleURL={MAPBOX_STYLE}
        compassEnabled={false}
        scaleBarEnabled={false}
        logoEnabled={false}
        attributionEnabled={false}
        onPress={handleMapPress}>
        <Mapbox.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: [coordinate.longitude, coordinate.latitude],
            zoomLevel: DEFAULT_ZOOM,
          }}
          onCameraChanged={(state: { properties: { zoom?: number } }) => {
            if (typeof state.properties.zoom === 'number') {
              zoomRef.current = state.properties.zoom;
            }
          }}
        />
        <Mapbox.UserLocation visible />
        {markers.map(marker => (
          <Mapbox.PointAnnotation
            key={marker.id}
            id={`extra-${marker.id}`}
            coordinate={[
              marker.coordinate.longitude,
              marker.coordinate.latitude,
            ]}
            title={marker.label}>
            <MapPin color={colors.textLight} />
          </Mapbox.PointAnnotation>
        ))}
        <Mapbox.PointAnnotation
          id="selected-coordinate"
          coordinate={[coordinate.longitude, coordinate.latitude]}
          draggable
          onDragEnd={handleMarkerDrag}>
          <MapPin color={colors.mapMarker} />
        </Mapbox.PointAnnotation>
      </Mapbox.MapView>
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

/** Prefer live GPS → last known → Hà Nội (never 0,0 / SF). */
export function getDefaultCoordinate(userLocation?: Location | null): Location {
  if (userLocation && hasUsableCoordinates(userLocation)) {
    return userLocation;
  }
  const lastKnown = locationService.getLastKnownLocation();
  if (lastKnown && hasUsableCoordinates(lastKnown)) {
    return lastKnown;
  }
  return {
    latitude: DEFAULT_MAP_REGION.latitude,
    longitude: DEFAULT_MAP_REGION.longitude,
  };
}

/**
 * Event map center priority:
 * 1) first place with usable coords
 * 2) user / last known GPS
 * 3) Hà Nội fallback
 */
export function getEventMapCenter(
  places: Array<{ location: Location }> | undefined | null,
  userLocation?: Location | null,
): Location {
  const first = places?.[0]?.location;
  if (hasUsableCoordinates(first)) {
    return { latitude: first!.latitude, longitude: first!.longitude };
  }
  return getDefaultCoordinate(userLocation);
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
