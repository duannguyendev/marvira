import {useState, useEffect} from 'react';
import {locationService} from '../services/location.service';
import {Location} from '../types';

export const useLocation = () => {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initializeLocation = async () => {
      try {
        // Check permission
        const hasPerm = await locationService.checkPermission();
        if (!hasPerm) {
          const granted = await locationService.requestPermission();
          if (!granted) {
            if (mounted) {
              setError(new Error('Location permission denied'));
              setIsLoading(false);
            }
            return;
          }
        }

        if (mounted) {
          setHasPermission(true);
        }

        // Get initial location
        try {
          const currentLocation = await locationService.getCurrentLocation();
          if (mounted) {
            setLocation(currentLocation);
            setIsLoading(false);
          }
        } catch (err) {
          if (mounted) {
            setError(err);
            setIsLoading(false);
          }
        }

        // Start watching location
        locationService.startWatching();

        // Subscribe to updates
        const unsubscribe = locationService.subscribe(newLocation => {
          if (mounted) {
            setLocation(newLocation);
            setError(null);
          }
        });

        const unsubscribeErrors = locationService.subscribeToErrors(err => {
          if (mounted) {
            setError(err);
          }
        });

        return () => {
          unsubscribe();
          unsubscribeErrors();
          locationService.stopWatching();
        };
      } catch (err) {
        if (mounted) {
          setError(err);
          setIsLoading(false);
        }
      }
    };

    initializeLocation();

    return () => {
      mounted = false;
      locationService.stopWatching();
    };
  }, []);

  return {
    location,
    error,
    isLoading,
    hasPermission,
    requestPermission: locationService.requestPermission.bind(locationService),
  };
};

