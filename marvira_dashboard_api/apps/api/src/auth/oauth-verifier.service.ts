import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import appleSignin from 'apple-signin-auth';

export interface OAuthProfile {
  /** May be omitted on returning Apple Sign-In when Hide My Email / private relay. */
  email?: string;
  name: string;
  avatar?: string;
  /** Google sub / Apple sub / Facebook user id — required for stable linking. */
  providerUserId: string;
}

@Injectable()
export class OAuthVerifierService {
  constructor(private readonly config: ConfigService) {}

  /**
   * Accepts a single id or comma-separated list (web + iOS + Android client ids).
   * See release_credentials.txt section C.
   */
  getGoogleAudiences(): string[] {
    const raw =
      this.config.get<string>('GOOGLE_CLIENT_IDS') ||
      this.config.get<string>('GOOGLE_CLIENT_ID') ||
      '';
    return raw
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  }

  async verifyGoogleIdToken(idToken: string): Promise<OAuthProfile> {
    const audiences = this.getGoogleAudiences();
    if (audiences.length === 0) {
      throw new UnauthorizedException('Google Sign-In is not configured');
    }

    const { OAuth2Client } = await import('google-auth-library');
    const client = new OAuth2Client(audiences[0]);

    const ticket = await client.verifyIdToken({
      idToken,
      audience: audiences.length === 1 ? audiences[0] : audiences,
    });
    const payload = ticket.getPayload();
    if (!payload?.sub) {
      throw new UnauthorizedException('Invalid Google token');
    }
    if (!payload.email) {
      throw new UnauthorizedException('Google account has no email');
    }

    return {
      email: payload.email,
      name: payload.name || payload.email.split('@')[0],
      avatar: payload.picture,
      providerUserId: payload.sub,
    };
  }

  async verifyFacebookAccessToken(accessToken: string): Promise<OAuthProfile> {
    const appId = this.config.get<string>('FACEBOOK_APP_ID')?.trim();
    const appSecret = this.config.get<string>('FACEBOOK_APP_SECRET')?.trim();

    if (!appId || !appSecret) {
      throw new UnauthorizedException('Facebook Login is not configured');
    }

    const debugUrl = `https://graph.facebook.com/debug_token?input_token=${encodeURIComponent(accessToken)}&access_token=${encodeURIComponent(`${appId}|${appSecret}`)}`;
    const debugResponse = await fetch(debugUrl);
    if (!debugResponse.ok) {
      throw new UnauthorizedException('Invalid Facebook token');
    }

    const debug = (await debugResponse.json()) as {
      data?: { is_valid?: boolean; app_id?: string };
    };
    if (!debug.data?.is_valid) {
      throw new UnauthorizedException('Invalid Facebook token');
    }
    if (debug.data.app_id && debug.data.app_id !== appId) {
      throw new UnauthorizedException('Invalid Facebook token');
    }

    const profileUrl = `https://graph.facebook.com/me?fields=id,email,name,picture.type(large)&access_token=${encodeURIComponent(accessToken)}`;
    const profileResponse = await fetch(profileUrl);
    if (!profileResponse.ok) {
      throw new UnauthorizedException('Invalid Facebook token');
    }

    const profile = (await profileResponse.json()) as {
      id?: string;
      email?: string;
      name?: string;
      picture?: { data?: { url?: string } };
    };

    if (!profile.id) {
      throw new UnauthorizedException('Invalid Facebook token');
    }
    if (!profile.email) {
      throw new UnauthorizedException('Facebook account has no email');
    }

    return {
      email: profile.email,
      name: profile.name || profile.email.split('@')[0],
      avatar: profile.picture?.data?.url,
      providerUserId: profile.id,
    };
  }

  async verifyAppleIdentityToken(identityToken: string): Promise<OAuthProfile> {
    const clientId = this.config.get<string>('APPLE_CLIENT_ID')?.trim();
    if (!clientId) {
      throw new UnauthorizedException('Apple Sign-In is not configured');
    }

    const payload = await appleSignin.verifyIdToken(identityToken, {
      audience: clientId,
      ignoreExpiration: false,
    });

    if (!payload.sub) {
      throw new UnauthorizedException('Invalid Apple token');
    }

    return {
      email: payload.email,
      name: payload.email
        ? payload.email.split('@')[0]
        : `apple_${payload.sub.slice(0, 8)}`,
      providerUserId: payload.sub,
    };
  }

  isDevBypassEnabled(): boolean {
    return (
      this.config.get('NODE_ENV') !== 'production' &&
      this.config.get('OAUTH_DEV_BYPASS') !== 'false'
    );
  }
}
