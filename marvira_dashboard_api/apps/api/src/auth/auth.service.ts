import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { AuthProvider, User, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import { EmailService } from '../email/email.service';
import { RequestUser } from '../common/types/request-user';
import { OAuthProfile, OAuthVerifierService } from './oauth-verifier.service';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export type PublicUser = Omit<User, 'passwordHash'> & {
  hasPassword: boolean;
};

@Injectable()
export class AuthService {
  private static readonly BCRYPT_ROUNDS = 12;
  private static readonly RESET_TOKEN_BYTES = 32;
  private static readonly RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
    private readonly emailService: EmailService,
    private readonly oauthVerifier: OAuthVerifierService,
  ) {}

  async register(
    email: string,
    name: string,
    password: string,
  ): Promise<{ user: PublicUser; tokens: TokenPair }> {
    const existing = await this.prisma.client.user.findUnique({
      where: { email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await this.hashPassword(password);
    const user = await this.prisma.client.user.create({
      data: {
        email,
        name,
        passwordHash,
        provider: AuthProvider.LOCAL,
        role: UserRole.USER,
      },
    });

    const tokens = await this.generateTokens(user);
    return { user: this.toPublicUser(user), tokens };
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ user: PublicUser; tokens: TokenPair }> {
    const user = await this.prisma.client.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await this.verifyPassword(user, password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user);
    return { user: this.toPublicUser(user), tokens };
  }

  async forgotPassword(email: string): Promise<{ devResetToken?: string }> {
    const user = await this.prisma.client.user.findUnique({ where: { email } });
    // Any active account can set/reset a Marvira password (SSO-first included).
    if (!user || !user.isActive) {
      return {};
    }

    const rawToken = randomBytes(AuthService.RESET_TOKEN_BYTES).toString('hex');
    const tokenHash = this.hashResetToken(rawToken);
    const expiresAt = new Date(Date.now() + AuthService.RESET_TOKEN_TTL_MS);

    await this.prisma.client.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });
    await this.prisma.client.passwordResetToken.create({
      data: {
        userId: user.id,
        token: tokenHash,
        expiresAt,
      },
    });

    const resetBaseUrl = this.config.get(
      'PASSWORD_RESET_URL',
      'http://localhost:3002/reset-password',
    );
    const resetUrl = `${resetBaseUrl}?token=${rawToken}`;
    // Send in the background so a slow/unreachable SMTP never times out mobile clients.
    void this.emailService.sendPasswordResetEmail(
      user.email,
      resetUrl,
      user.name,
      { isFirstPassword: !user.passwordHash },
    );

    const emailConfigured =
      !!this.config.get<string>('RESEND_API_KEY')?.trim() ||
      !!this.config.get<string>('SMTP_HOST')?.trim();
    if (!emailConfigured && this.config.get('NODE_ENV') !== 'production') {
      return { devResetToken: rawToken };
    }

    return {};
  }

  async resetPassword(token: string, password: string): Promise<void> {
    const tokenHash = this.hashResetToken(token);
    const resetRecord = await this.prisma.client.passwordResetToken.findUnique({
      where: { token: tokenHash },
      include: { user: true },
    });

    if (
      !resetRecord ||
      resetRecord.usedAt ||
      resetRecord.expiresAt < new Date()
    ) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (!resetRecord.user.isActive) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await this.hashPassword(password);

    await this.prisma.client.$transaction([
      this.prisma.client.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash },
      }),
      this.prisma.client.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.client.session.deleteMany({
        where: { userId: resetRecord.userId },
      }),
    ]);
  }

  async setPassword(userId: string, password: string): Promise<PublicUser> {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found');
    }

    if (user.passwordHash) {
      throw new BadRequestException(
        'Password already set. Use change password instead.',
      );
    }

    const passwordHash = await this.hashPassword(password);
    const updated = await this.prisma.client.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return this.toPublicUser(updated);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.passwordHash) {
      throw new BadRequestException(
        'No password set yet. Use set password or the email reset link first.',
      );
    }

    const valid = await this.comparePassword(
      currentPassword,
      user.passwordHash,
    );
    if (!valid) {
      throw new BadRequestException('Current password is incorrect');
    }

    if (currentPassword === newPassword) {
      throw new BadRequestException(
        'New password must be different from the current password',
      );
    }

    const passwordHash = await this.hashPassword(newPassword);

    await this.prisma.client.$transaction([
      this.prisma.client.user.update({
        where: { id: userId },
        data: { passwordHash },
      }),
      this.prisma.client.session.deleteMany({
        where: { userId },
      }),
    ]);
  }

  async loginWithGoogle(input: {
    idToken?: string;
    email?: string;
    name?: string;
    avatar?: string;
  }): Promise<{ user: PublicUser; tokens: TokenPair }> {
    const profile = input.idToken
      ? await this.oauthVerifier.verifyGoogleIdToken(input.idToken)
      : this.resolveDevProfile(input, 'Google');

    return this.loginWithProvider(profile, AuthProvider.GOOGLE);
  }

  async loginWithFacebook(input: {
    accessToken?: string;
    email?: string;
    name?: string;
    avatar?: string;
  }): Promise<{ user: PublicUser; tokens: TokenPair }> {
    const profile = input.accessToken
      ? await this.oauthVerifier.verifyFacebookAccessToken(input.accessToken)
      : this.resolveDevProfile(input, 'Facebook');

    return this.loginWithProvider(profile, AuthProvider.FACEBOOK);
  }

  async loginWithApple(input: {
    identityToken?: string;
    email?: string;
    name?: string;
  }): Promise<{ user: PublicUser; tokens: TokenPair }> {
    let profile: OAuthProfile;

    if (input.identityToken) {
      profile = await this.oauthVerifier.verifyAppleIdentityToken(
        input.identityToken,
      );
      if (input.name?.trim()) {
        profile.name = input.name.trim();
      }
    } else {
      profile = this.resolveDevProfile(input, 'Apple');
    }

    return this.loginWithProvider(profile, AuthProvider.APPLE);
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    const session = await this.prisma.client.session.findFirst({
      where: { refreshToken, expiresAt: { gt: new Date() } },
      include: { user: true },
    });

    if (!session || !session.user.isActive) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.client.session.delete({ where: { id: session.id } });
    return this.generateTokens(session.user);
  }

  async logout(refreshToken: string): Promise<void> {
    await this.prisma.client.session.deleteMany({ where: { refreshToken } });
    await this.redis.del(`session:${refreshToken}`);
  }

  async getMe(userId: string): Promise<PublicUser> {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new UnauthorizedException('User not found');
    return this.toPublicUser(user);
  }

  async validateUser(payload: { sub: string }): Promise<RequestUser | null> {
    const user = await this.prisma.client.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        isActive: true,
      },
    });
    if (!user || !user.isActive) return null;
    const { isActive: _, ...rest } = user;
    return rest;
  }

  hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, AuthService.BCRYPT_ROUNDS);
  }

  comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Account linking policy:
   * 1. Match by (provider + providerUserId) when present — stable for Apple returns.
   * 2. Else match by email — same email links to the existing account (LOCAL or OAuth).
   *    LOCAL passwordHash is preserved so email/password login still works.
   * 3. Else create a new user (email required for new accounts).
   */
  private async loginWithProvider(
    profile: OAuthProfile,
    provider: AuthProvider,
  ): Promise<{ user: PublicUser; tokens: TokenPair }> {
    let user =
      profile.providerUserId
        ? await this.prisma.client.user.findFirst({
            where: {
              provider,
              providerUserId: profile.providerUserId,
            },
          })
        : null;

    if (!user && profile.email) {
      user = await this.prisma.client.user.findUnique({
        where: { email: profile.email },
      });
      if (user) {
        user = await this.prisma.client.user.update({
          where: { id: user.id },
          data: {
            providerUserId: user.providerUserId ?? profile.providerUserId,
            avatar: user.avatar ?? profile.avatar ?? null,
            name: user.name || profile.name,
            // Keep LOCAL so password login / reset remain available when hash exists.
            provider:
              user.provider === AuthProvider.LOCAL ? AuthProvider.LOCAL : provider,
          },
        });
      }
    }

    if (!user) {
      if (!profile.email) {
        throw new UnauthorizedException(
          'No email available for this sign-in. Use the same provider account you used before, or register with email.',
        );
      }
      user = await this.prisma.client.user.create({
        data: {
          email: profile.email,
          name: profile.name,
          avatar: profile.avatar ?? null,
          provider,
          providerUserId: profile.providerUserId,
          role: UserRole.USER,
        },
      });
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account deactivated');
    }

    const tokens = await this.generateTokens(user);
    return { user: this.toPublicUser(user), tokens };
  }

  private resolveDevProfile(
    input: { email?: string; name?: string; avatar?: string },
    provider: string,
  ): OAuthProfile {
    if (!this.oauthVerifier.isDevBypassEnabled()) {
      throw new UnauthorizedException(`${provider} token is required`);
    }

    if (!input.email || !input.name) {
      throw new BadRequestException(
        `${provider} profile requires email and name in development mode`,
      );
    }

    return {
      email: input.email,
      name: input.name,
      avatar: input.avatar,
      providerUserId: `dev_${provider.toLowerCase()}_${input.email}`,
    };
  }

  private async verifyPassword(user: User, password: string): Promise<boolean> {
    if (!user.passwordHash) {
      return false;
    }
    return bcrypt.compare(password, user.passwordHash);
  }

  private hashResetToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private toPublicUser(user: User): PublicUser {
    const { passwordHash, ...publicUser } = user;
    return { ...publicUser, hasPassword: !!passwordHash };
  }

  private async generateTokens(user: User): Promise<TokenPair> {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get('JWT_SECRET'),
      expiresIn: this.config.get('JWT_ACCESS_EXPIRES_IN', '15m'),
    });

    const refreshToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.client.session.create({
      data: { userId: user.id, refreshToken, expiresAt },
    });

    await this.redis.set(`session:${refreshToken}`, user.id, 7 * 24 * 60 * 60);

    return { accessToken, refreshToken };
  }
}
