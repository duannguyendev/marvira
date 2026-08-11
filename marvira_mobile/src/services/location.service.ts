import Geolocation from 'react-native-geolocation-service';
import { Platform, PermissionsAndroid } from 'react-native';
import { Location } from '../types';
import { LOCATION_UPDATE_INTERVAL } from '../utils/constants';

type LocationCallback = (location: Location) => void;
type ErrorCallback = (error: any) => void;

const ANDROID_FINE = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;
const ANDROID_COARSE = PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION;

class LocationService {
  private watchId: number | null = null;
  private watchRefCount = 0;
  private listeners: Set<LocationCallback> = new Set();
  private errorListeners: Set<ErrorCallback> = new Set();
  private currentLocation: Location | null = null;

  /**
   * Request location permissions.
   * iOS: use Geolocation.requestAuthorization (same native path as getCurrentPosition).
   * Android: request fine + coarse; either grant is enough to read location.
   */
  async requestPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        const status = await Geolocation.requestAuthorization('whenInUse');
        return status === 'granted';
      }

      const results = await PermissionsAndroid.requestMultiple([
        ANDROID_FINE,
        ANDROID_COARSE,
      ]);
      return (
        results[ANDROID_FINE] === PermissionsAndroid.RESULTS.GRANTED ||
        results[ANDROID_COARSE] === PermissionsAndroid.RESULTS.GRANTED
      );
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
      if (Platform.OS === 'ios') {
        // requestAuthorization returns current status without re-prompting when already decided
        const status = await Geolocation.requestAuthorization('whenInUse');
        return status === 'granted';
      }

      const fine = await PermissionsAndroid.check(ANDROID_FINE);
      const coarse = await PermissionsAndroid.check(ANDROID_COARSE);
      return fine || coarse;
    } catch (error) {
      console.error('Error checking location permission:', error);
      return false;
    }
  }

  /**
   * Get current location once
   */
  async getCurrentLocation(options?: { maximumAge?: number }): Promise<Location> {
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
          maximumAge: options?.maximumAge ?? 10000,
          forceRequestLocation: true,
          showLocationDialog: true,
        },
      );
    });
  }

  /**
   * Start watching location updates (internal; prefer acquireWatch)
   */
  private startWatching(): void {
    if (this.watchId !== null) {
      return;
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
        distanceFilter: 10,
        interval: LOCATION_UPDATE_INTERVAL,
        fastestInterval: LOCATION_UPDATE_INTERVAL,
        forceRequestLocation: true,
        showLocationDialog: true,
      },
    );
  }

  private stopWatching(): void {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  /**
   * Ref-counted watch so one screen unmount does not stop GPS for others.
   */
  acquireWatch(): void {
    this.watchRefCount += 1;
    if (this.watchRefCount === 1) {
      this.startWatching();
    }
  }

  releaseWatch(): void {
    this.watchRefCount = Math.max(0, this.watchRefCount - 1);
    if (this.watchRefCount === 0) {
      this.stopWatching();
    }
  }

  /**
   * Subscribe to location updates
   */
  subscribe(callback: LocationCallback): () => void {
    this.listeners.add(callback);
    if (this.currentLocation) {
      callback(this.currentLocation);
    }
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
