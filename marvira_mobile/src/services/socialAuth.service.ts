import { Platform } from 'react-native';
import {
  FACEBOOK_APP_ID,
  FACEBOOK_CLIENT_TOKEN,
  GOOGLE_WEB_CLIENT_ID,
  isFacebookSignInConfigured,
  isGoogleSignInConfigured,
} from '../config/socialAuth';

export class SocialAuthNotConfiguredError extends Error {
  constructor(provider: string) {
    super(
      `${provider} sign-in is not configured. Set credentials in .env.local / Codemagic (see release_credentials.txt).`,
    );
    this.name = 'SocialAuthNotConfiguredError';
  }
}

export class SocialAuthCancelledError extends Error {
  constructor(provider: string) {
    super(`${provider} sign-in was cancelled`);
    this.name = 'SocialAuthCancelledError';
  }
}

let googleConfigured = false;
let facebookConfigured = false;

async function ensureGoogleConfigured(): Promise<void> {
  if (!isGoogleSignInConfigured()) {
    throw new SocialAuthNotConfiguredError('Google');
  }
  if (googleConfigured) {
    return;
  }
  const { GoogleSignin } = await import(
    '@react-native-google-signin/google-signin'
  );
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    offlineAccess: false,
  });
  googleConfigured = true;
}

async function ensureFacebookConfigured(): Promise<void> {
  if (!isFacebookSignInConfigured()) {
    throw new SocialAuthNotConfiguredError('Facebook');
  }
  if (facebookConfigured) {
    return;
  }
  const { Settings } = await import('react-native-fbsdk-next');
  Settings.setAppID(FACEBOOK_APP_ID);
  Settings.setClientToken(FACEBOOK_CLIENT_TOKEN);
  Settings.initializeSDK();
  facebookConfigured = true;
}

export const socialAuthService = {
  async signInWithGoogle(): Promise<{ idToken: string }> {
    await ensureGoogleConfigured();
    const { GoogleSignin, statusCodes } = await import(
      '@react-native-google-signin/google-signin'
    );
    try {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      const result = await GoogleSignin.signIn();
      if (result.type === 'cancelled') {
        throw new SocialAuthCancelledError('Google');
      }
      const tokens = await GoogleSignin.getTokens();
      if (!tokens.idToken) {
        throw new Error('Google did not return an ID token');
      }
      return { idToken: tokens.idToken };
    } catch (error: unknown) {
      if (error instanceof SocialAuthCancelledError) {
        throw error;
      }
      const code =
        error && typeof error === 'object' && 'code' in error
          ? String((error as { code: unknown }).code)
          : '';
      if (
        code === statusCodes.SIGN_IN_CANCELLED ||
        code === statusCodes.IN_PROGRESS
      ) {
        throw new SocialAuthCancelledError('Google');
      }
      throw error;
    }
  },

  async signInWithApple(): Promise<{
    identityToken: string;
    name?: string;
  }> {
    if (Platform.OS !== 'ios') {
      throw new Error('Apple Sign-In is only available on iOS');
    }
    const AppleAuthentication = await import(
      '@invertase/react-native-apple-authentication'
    );
    const appleAuth = AppleAuthentication.appleAuth;
    if (!appleAuth.isSupported) {
      throw new Error('Apple Sign-In is not supported on this device');
    }

    const response = await appleAuth.performRequest({
      requestedOperation: appleAuth.Operation.LOGIN,
      requestedScopes: [
        appleAuth.Scope.EMAIL,
        appleAuth.Scope.FULL_NAME,
      ],
    });

    if (!response.identityToken) {
      throw new Error('Apple did not return an identity token');
    }

    const given = response.fullName?.givenName?.trim() || '';
    const family = response.fullName?.familyName?.trim() || '';
    const name = [given, family].filter(Boolean).join(' ') || undefined;

    return { identityToken: response.identityToken, name };
  },

  async signInWithFacebook(): Promise<{ accessToken: string }> {
    await ensureFacebookConfigured();
    const { LoginManager, AccessToken } = await import(
      'react-native-fbsdk-next'
    );
    const result = await LoginManager.logInWithPermissions([
      'public_profile',
      'email',
    ]);
    if (result.isCancelled) {
      throw new SocialAuthCancelledError('Facebook');
    }
    const data = await AccessToken.getCurrentAccessToken();
    if (!data?.accessToken) {
      throw new Error('Facebook did not return an access token');
    }
    return { accessToken: data.accessToken };
  },
};
