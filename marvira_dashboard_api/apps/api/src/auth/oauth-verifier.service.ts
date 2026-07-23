import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import appleSignin from 'apple-signin-auth';

export interface OAuthProfile {
  email: string;
  name: string;
  avatar?: string;
}

@Injectable()
export class OAuthVerifierService {
  constructor(private readonly config: ConfigService) {}

  async verifyGoogleIdToken(idToken: string): Promise<OAuthProfile> {
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    const { OAuth2Client } = await import('google-auth-library');
    const client = new OAuth2Client(clientId);

    const ticket = await client.verifyIdToken({
      idToken,
      audience: clientId,
    });
    const payload = ticket.getPayload();
    if (!payload?.email) {
      throw new UnauthorizedException('Google account has no email');
    }

    return {
      email: payload.email,
      name: payload.name || payload.email.split('@')[0],
      avatar: payload.picture,
    };
  }

  async verifyFacebookAccessToken(accessToken: string): Promise<OAuthProfile> {
    const appId = this.config.get<string>('FACEBOOK_APP_ID');
    const appSecret = this.config.get<string>('FACEBOOK_APP_SECRET');

    if (appId && appSecret) {
      const debugUrl = `https://graph.facebook.com/debug_token?input_token=${encodeURIComponent(accessToken)}&access_token=${encodeURIComponent(`${appId}|${appSecret}`)}`;
      const debugResponse = await fetch(debugUrl);
      if (!debugResponse.ok) {
        throw new UnauthorizedException('Invalid Facebook token');
      }

      const debug = (await debugResponse.json()) as {
        data?: { is_valid?: boolean };
      };
      if (!debug.data?.is_valid) {
        throw new UnauthorizedException('Invalid Facebook token');
      }
    }

    const profileUrl = `https://graph.facebook.com/me?fields=id,email,name,picture.type(large)&access_token=${encodeURIComponent(accessToken)}`;
    const profileResponse = await fetch(profileUrl);
    if (!profileResponse.ok) {
      throw new UnauthorizedException('Invalid Facebook token');
    }

    const profile = (await profileResponse.json()) as {
      email?: string;
      name?: string;
      picture?: { data?: { url?: string } };
    };

    if (!profile.email) {
      throw new UnauthorizedException('Facebook account has no email');
    }

    return {
      email: profile.email,
      name: profile.name || profile.email.split('@')[0],
      avatar: profile.picture?.data?.url,
    };
  }

  async verifyAppleIdentityToken(identityToken: string): Promise<OAuthProfile> {
    const clientId = this.config.get<string>('APPLE_CLIENT_ID');
    if (!clientId) {
      throw new UnauthorizedException('Apple Sign-In is not configured');
    }

    const payload = await appleSignin.verifyIdToken(identityToken, {
      audience: clientId,
      ignoreExpiration: false,
    });

    if (!payload.email) {
      throw new UnauthorizedException('Apple account has no email');
    }

    return {
      email: payload.email,
      name: payload.email.split('@')[0],
    };
  }

  isDevBypassEnabled(): boolean {
    return (
      this.config.get('NODE_ENV') !== 'production' &&
      this.config.get('OAUTH_DEV_BYPASS') !== 'false'
    );
  }
}
