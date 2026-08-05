import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';

export type FcmPayload = {
  title: string;
  body: string;
  data: Record<string, string>;
};

@Injectable()
export class FcmSenderService implements OnModuleInit {
  private readonly logger = new Logger(FcmSenderService.name);
  private ready = false;

  onModuleInit() {
    this.initAdmin();
  }

  private initAdmin() {
    if (admin.apps.length > 0) {
      this.ready = true;
      return;
    }

    const json = process.env.FIREBASE_ADMIN_CREDENTIALS_JSON?.trim();
    const b64 = process.env.FIREBASE_ADMIN_CREDENTIALS_BASE64?.trim();

    try {
      if (json) {
        const cred = JSON.parse(json) as admin.ServiceAccount;
        admin.initializeApp({
          credential: admin.credential.cert(cred),
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || cred.projectId,
        });
        this.ready = true;
        this.logger.log('Firebase Admin initialized from JSON env');
        return;
      }
      if (b64) {
        const decoded = Buffer.from(b64, 'base64').toString('utf8');
        const cred = JSON.parse(decoded) as admin.ServiceAccount;
        admin.initializeApp({
          credential: admin.credential.cert(cred),
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || cred.projectId,
        });
        this.ready = true;
        this.logger.log('Firebase Admin initialized from BASE64 env');
        return;
      }
      this.logger.warn(
        'Firebase Admin credentials missing — FCM sends will be skipped until FIREBASE_ADMIN_CREDENTIALS_JSON or _BASE64 is set',
      );
    } catch (err) {
      this.logger.error(`Firebase Admin init failed: ${err}`);
      this.ready = false;
    }
  }

  isReady() {
    return this.ready;
  }

  /**
   * Send to many tokens. Returns tokens that should be pruned.
   */
  async sendToTokens(
    tokens: string[],
    payload: FcmPayload,
  ): Promise<{ successCount: number; invalidTokens: string[] }> {
    if (!tokens.length) {
      return { successCount: 0, invalidTokens: [] };
    }
    if (!this.ready) {
      this.logger.debug(
        `skip FCM (admin not ready): ${payload.title} → ${tokens.length} token(s)`,
      );
      return { successCount: 0, invalidTokens: [] };
    }

    const stringData: Record<string, string> = {};
    for (const [k, v] of Object.entries(payload.data)) {
      if (v != null) stringData[k] = String(v);
    }

    const response = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: stringData,
      android: {
        priority: 'high',
        notification: {
          channelId: 'marvira_default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
          },
        },
      },
    });

    const invalidTokens: string[] = [];
    response.responses.forEach((res, idx) => {
      if (res.success) return;
      const code = res.error?.code ?? '';
      if (
        code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-registration-token' ||
        code === 'messaging/invalid-argument'
      ) {
        invalidTokens.push(tokens[idx]!);
      } else {
        this.logger.warn(
          `FCM send failed for token[${idx}]: ${code} ${res.error?.message}`,
        );
      }
    });

    return {
      successCount: response.successCount,
      invalidTokens,
    };
  }
}
