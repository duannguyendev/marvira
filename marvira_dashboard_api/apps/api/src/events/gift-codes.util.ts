import { BadRequestException } from '@nestjs/common';

export const MAX_GIFT_CODES = 10;
export const MAX_GIFT_CODE_LENGTH = 64;
export const MAX_GIFT_TEASER_LENGTH = 80;
export const MAX_COMPLETION_MESSAGE_LENGTH = 2000;

export function normalizeGiftCodes(codes: string[] | undefined | null): string[] {
  if (codes == null) return [];
  return codes.map((c) => c.trim()).filter((c) => c.length > 0);
}

export function validateGiftFields(input: {
  giftCodes?: string[] | null;
  giftTeaser?: string | null;
  completionMessage?: string | null;
}): {
  giftCodes: string[];
  giftTeaser: string | null;
  completionMessage: string | null;
} {
  const giftCodes = normalizeGiftCodes(input.giftCodes);

  if (giftCodes.length > MAX_GIFT_CODES) {
    throw new BadRequestException(`At most ${MAX_GIFT_CODES} gift codes are allowed`);
  }

  const seen = new Set<string>();
  for (const code of giftCodes) {
    if (code.length > MAX_GIFT_CODE_LENGTH) {
      throw new BadRequestException(
        `Gift codes must be at most ${MAX_GIFT_CODE_LENGTH} characters`,
      );
    }
    const key = code.toLowerCase();
    if (seen.has(key)) {
      throw new BadRequestException('Gift codes must be unique within an event');
    }
    seen.add(key);
  }

  let giftTeaser =
    input.giftTeaser === undefined || input.giftTeaser === null
      ? null
      : input.giftTeaser.trim();
  if (giftTeaser === '') giftTeaser = null;

  if (giftTeaser && giftTeaser.length > MAX_GIFT_TEASER_LENGTH) {
    throw new BadRequestException(
      `Gift teaser must be at most ${MAX_GIFT_TEASER_LENGTH} characters`,
    );
  }

  if (giftCodes.length > 0 && !giftTeaser) {
    throw new BadRequestException('Gift teaser is required when gift codes are set');
  }

  let completionMessage =
    input.completionMessage === undefined || input.completionMessage === null
      ? null
      : input.completionMessage.trim();
  if (completionMessage === '') completionMessage = null;

  if (completionMessage && completionMessage.length > MAX_COMPLETION_MESSAGE_LENGTH) {
    throw new BadRequestException(
      `Completion message must be at most ${MAX_COMPLETION_MESSAGE_LENGTH} characters`,
    );
  }

  return { giftCodes, giftTeaser, completionMessage };
}

/**
 * v1 freeze: awarded prefix is immutable; unused codes cannot be removed/reordered —
 * only append new codes at the end (until max 10).
 */
export function assertGiftCodesAppendOnly(
  existingCodes: string[],
  nextCodes: string[],
): void {
  if (nextCodes.length < existingCodes.length) {
    throw new BadRequestException(
      'Gift codes cannot be removed once set; you may only append new codes',
    );
  }
  for (let i = 0; i < existingCodes.length; i++) {
    if (nextCodes[i] !== existingCodes[i]) {
      throw new BadRequestException(
        'Awarded or existing gift code slots cannot be changed; append new codes only',
      );
    }
  }
}

export function buildCompletionPayload(params: {
  finishRank: number | null;
  giftCodeAwarded: string | null;
  completionMessage: string | null;
  giftTeaser: string | null;
  giftCount: number;
}): {
  finishRank: number | null;
  completionMessage: string | null;
  giftTeaser: string | null;
  giftCode: string | null;
  giftCount: number;
  giftsAllClaimed: boolean;
} {
  const giftCount = params.giftCount;
  const finishRank = params.finishRank;
  const hasGift = giftCount > 0;
  const giftsAllClaimed =
    hasGift && finishRank != null && finishRank > giftCount;

  return {
    finishRank,
    completionMessage: params.completionMessage,
    giftTeaser: params.giftTeaser,
    giftCode: params.giftCodeAwarded,
    giftCount,
    giftsAllClaimed,
  };
}
