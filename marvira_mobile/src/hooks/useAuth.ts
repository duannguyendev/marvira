import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Platform } from 'react-native';
import { authService } from '../services/auth.service';
import {
  SocialAuthCancelledError,
  socialAuthService,
} from '../services/socialAuth.service';
import { LoginCredentials, RegisterCredentials } from '../types';

export const useAuth = () => {
  const queryClient = useQueryClient();

  const onAuthSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['user'] });
  };

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) =>
      authService.login(credentials),
    onSuccess: onAuthSuccess,
  });

  const registerMutation = useMutation({
    mutationFn: (credentials: RegisterCredentials) =>
      authService.register(credentials),
    onSuccess: onAuthSuccess,
  });

  const googleMutation = useMutation({
    mutationFn: async () => {
      const { idToken } = await socialAuthService.signInWithGoogle();
      return authService.loginWithGoogle(idToken);
    },
    onSuccess: onAuthSuccess,
  });

  const appleMutation = useMutation({
    mutationFn: async () => {
      const { identityToken, name } = await socialAuthService.signInWithApple();
      return authService.loginWithApple(identityToken, name);
    },
    onSuccess: onAuthSuccess,
  });

  const facebookMutation = useMutation({
    mutationFn: async () => {
      const { accessToken } = await socialAuthService.signInWithFacebook();
      return authService.loginWithFacebook(accessToken);
    },
    onSuccess: onAuthSuccess,
  });

  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      queryClient.clear();
    },
  });

  const { data: user, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: () => authService.getCurrentUser(),
    staleTime: 5 * 60 * 1000,
  });

  const isAuthenticated = !!user;
  const isSocialPending =
    googleMutation.isPending ||
    appleMutation.isPending ||
    facebookMutation.isPending;

  return {
    user,
    isLoading,
    isAuthenticated,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    loginWithGoogle: googleMutation.mutateAsync,
    loginWithApple: appleMutation.mutateAsync,
    loginWithFacebook: facebookMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isSocialPending,
    isLoggingOut: logoutMutation.isPending,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
    appleAvailable: Platform.OS === 'ios',
    isSocialCancelled: (error: unknown) =>
      error instanceof SocialAuthCancelledError,
  };
};
