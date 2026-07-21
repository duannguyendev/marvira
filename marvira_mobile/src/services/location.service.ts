import Geolocation from 'react-native-geolocation-service';
import {Platform, PermissionsAndroid} from 'react-native';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import {Location} from '../types';
import {LOCATION_UPDATE_INTERVAL} from '../utils/constants';

type LocationCallback = (location: Location) => void;
type ErrorCallback = (error: any) => void;

class LocationService {
  private watchId: number | null = null;
  private listeners: Set<LocationCallback> = new Set();
  private errorListeners: Set<ErrorCallback> = new Set();
  private currentLocation: Location | null = null;

  /**
   * Request location permissions
   */
  async requestPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'Marvira needs access to your location to play events.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const permission =
          Platform.OS === 'ios'
            ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
            : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

        const result = await request(permission);
        return result === RESULTS.GRANTED;
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  }

  /**
   * Check if location permission is granted
   */
  async checkPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        return granted;
      } else {
        const permission =
          Platform.OS === 'ios'
            ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
            : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

        const result = await check(permission);
        return result === RESULTS.GRANTED;
      }
    } catch (error) {
      console.error('Error checking location permission:', error);
      return false;
    }
  }

  /**
   * Get current location once
   */
  async getCurrentLocation(): Promise<Location> {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        position => {
          const location: Location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          };
          this.currentLocation = location;
          resolve(location);
        },
        error => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        },
      );
    });
  }

  /**
   * Start watching location updates
   */
  startWatching(): void {
    if (this.watchId !== null) {
      return; // Already watching
    }

    this.watchId = Geolocation.watchPosition(
      position => {
        const location: Location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };
        this.currentLocation = location;
        this.notifyListeners(location);
      },
      error => {
        this.notifyErrorListeners(error);
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 10, // Update every 10 meters
        interval: LOCATION_UPDATE_INTERVAL,
        fastestInterval: LOCATION_UPDATE_INTERVAL,
      },
    );
  }

  /**
   * Stop watching location updates
   */
  stopWatching(): void {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  /**
   * Subscribe to location updates
   */
  subscribe(callback: LocationCallback): () => void {
    this.listeners.add(callback);
    // Immediately notify with current location if available
    if (this.currentLocation) {
      callback(this.currentLocation);
    }
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Subscribe to location errors
   */
  subscribeToErrors(callback: ErrorCallback): () => void {
    this.errorListeners.add(callback);
    return () => {
      this.errorListeners.delete(callback);
    };
  }

  /**
   * Get last known location
   */
  getLastKnownLocation(): Location | null {
    return this.currentLocation;
  }

  private notifyListeners(location: Location): void {
    this.listeners.forEach(callback => {
      try {
        callback(location);
      } catch (error) {
        console.error('Error in location callback:', error);
      }
    });
  }

  private notifyErrorListeners(error: any): void {
    this.errorListeners.forEach(callback => {
      try {
        callback(error);
      } catch (err) {
        console.error('Error in error callback:', err);
      }
    });
  }
}

export const locationService = new LocationService();

