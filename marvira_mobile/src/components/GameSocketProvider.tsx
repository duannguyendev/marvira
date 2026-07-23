import React from 'react';
import { useGameSocket } from '../hooks/useGameSocket';

export const GameSocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  useGameSocket();
  return <>{children}</>;
};
