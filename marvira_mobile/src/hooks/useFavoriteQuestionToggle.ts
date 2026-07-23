import { useState } from 'react';
import { useToggleQuestionFavorite } from './useFavorites';

export function useFavoriteQuestionToggle() {
  const [pendingUnfavoriteId, setPendingUnfavoriteId] = useState<string | null>(
    null,
  );
  const toggleMutation = useToggleQuestionFavorite();

  const onFavoritePress = (questionId: string, isFavorite: boolean) => {
    if (isFavorite) {
      setPendingUnfavoriteId(questionId);
      return;
    }
    toggleMutation.mutate({ questionId, isFavorite: false });
  };

  const confirmUnfavorite = () => {
    if (pendingUnfavoriteId) {
      toggleMutation.mutate({
        questionId: pendingUnfavoriteId,
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
