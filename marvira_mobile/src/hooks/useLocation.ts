import { useState, useEffect, useCallback, useRef } from 'react';
import { locationService } from '../services/location.service';
import { Location } from '../types';

export const useLocation = () => {
  const [location, setLocation] = useState<Location | null>(
    () => locationService.getLastKnownLocation(),
  );
  const [error, setError] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(
    () => !locationService.getLastKnownLocation(),
  );
  const [hasPermission, setHasPermission] = useState(false);
  const acquiredRef = useRef(false);
  const mountedRef = useRef(true);
  const unsubscribersRef = useRef<Array<() => void>>([]);

  const attachWatch = useCallback(() => {
    if (!mountedRef.current || acquiredRef.current) {
      return;
    }
    locationService.acquireWatch();
    acquiredRef.current = true;

    const unsubscribe = locationService.subscribe(newLocation => {
      if (!mountedRef.current) {
        return;
      }
      setLocation(newLocation);
      setError(null);
      setIsLoading(false);
    });
    const unsubscribeErrors = locationService.subscribeToErrors(err => {
      if (!mountedRef.current) {
        return;
      }
      if (!locationService.getLastKnownLocation()) {
        setError(err);
      }
    });
    unsubscribersRef.current = [unsubscribe, unsubscribeErrors];
  }, []);

  const startTracking = useCallback(async (): Promise<boolean> => {
    const hasPerm = await locationService.checkPermission();
    const granted = hasPerm || (await locationService.requestPermission());
    if (!mountedRef.current) {
      return false;
    }

    if (!granted) {
      setHasPermission(false);
      setError(new Error('Location permission denied'));
      setIsLoading(false);
      return false;
    }

    setHasPermission(true);

    const lastKnown = locationService.getLastKnownLocation();
    if (lastKnown) {
      setLocation(lastKnown);
      setError(null);
      setIsLoading(false);
    }

    try {
      const currentLocation = await locationService.getCurrentLocation();
      if (!mountedRef.current) {
        return true;
      }
      setLocation(currentLocation);
      setError(null);
      setIsLoading(false);
    } catch (err) {
      if (mountedRef.current && !locationService.getLastKnownLocation()) {
        setError(err);
        setIsLoading(false);
      }
    }

    attachWatch();
    return true;
  }, [attachWatch]);

  useEffect(() => {
    mountedRef.current = true;
    void startTracking();

    return () => {
      mountedRef.current = false;
      unsubscribersRef.current.forEach(fn => fn());
      unsubscribersRef.current = [];
      if (acquiredRef.current) {
        locationService.releaseWatch();
        acquiredRef.current = false;
      }
    };
  }, [startTracking]);

  const requestPermission = useCallback(async () => {
    const granted = await locationService.requestPermission();
    if (!mountedRef.current) {
      return false;
    }
    if (!granted) {
      setHasPermission(false);
      setError(new Error('Location permission denied'));
      return false;
    }
    setHasPermission(true);
    setError(null);
    await startTracking();
    return true;
  }, [startTracking]);

  return {
    location,
    error,
    isLoading,
    hasPermission,
    requestPermission,
  };
};
