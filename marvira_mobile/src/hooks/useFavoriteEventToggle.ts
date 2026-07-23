import { useState } from 'react';
import { useToggleEventFavorite } from './useFavorites';

export function useFavoriteEventToggle() {
  const [pendingUnfavoriteId, setPendingUnfavoriteId] = useState<string | null>(
    null,
  );
  const toggleMutation = useToggleEventFavorite();

  const onFavoritePress = (eventId: string, isFavorite: boolean) => {
    if (isFavorite) {
      setPendingUnfavoriteId(eventId);
      return;
    }
    toggleMutation.mutate({ eventId, isFavorite: false });
  };

  const confirmUnfavorite = () => {
    if (pendingUnfavoriteId) {
      toggleMutation.mutate({
        eventId: pendingUnfavoriteId,
        isFavorite: true,
      });
      setPendingUnfavoriteId(null);
    }
  };

  const cancelUnfavorite = () => setPendingUnfavoriteId(null);

  return {
    pendingUnfavoriteId,
    onFavoritePress,
    confirmUnfavorite,
    cancelUnfavorite,
    isToggling: toggleMutation.isPending,
  };
}
