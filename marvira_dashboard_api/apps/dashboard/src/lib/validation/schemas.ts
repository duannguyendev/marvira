import { z } from 'zod';
import {
  EventDifficulty,
  QuestionType,
  ArticleStatus,
  CONTENT_LANGUAGES,
  DEFAULT_CONTENT_LANGUAGE,
} from '@marvira/shared-types';

const trimmed = (min: number, label: string) =>
  z.string().trim().min(min, `${label} must be at least ${min} characters`);

const contentLanguageSchema = z.enum(CONTENT_LANGUAGES);

export const eventSchema = z
  .object({
    title: trimmed(3, 'Title'),
    description: trimmed(10, 'Description'),
    city: trimmed(2, 'City'),
    difficulty: z.nativeEnum(EventDifficulty, {
      errorMap: () => ({ message: 'Select a difficulty' }),
    }),
    rewardPoints: z.coerce
      .number({ invalid_type_error: 'Reward points must be a number' })
      .int('Reward points must be a whole number')
      .min(0, 'Reward points cannot be negative')
      .max(10000, 'Reward points cannot exceed 10,000'),
    isActive: z.boolean(),
    language: contentLanguageSchema.default(DEFAULT_CONTENT_LANGUAGE),
    completionMessage: z
      .string()
      .max(2000, 'Completion message must be at most 2000 characters')
      .optional()
      .nullable()
      .or(z.literal('')),
    giftTeaser: z
      .string()
      .max(80, 'Gift teaser must be at most 80 characters')
      .optional()
      .nullable()
      .or(z.literal('')),
    giftCodes: z
      .array(z.string().max(64, 'Each gift code must be at most 64 characters'))
      .default([]),
  })
  .superRefine((data, ctx) => {
    if (data.isActive && data.title.length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Title is required to publish',
        path: ['title'],
      });
    }

    const codes = (data.giftCodes ?? []).map(c => c.trim()).filter(Boolean);
    if (codes.length > 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Maximum 10 gift codes',
        path: ['giftCodes'],
      });
    }
    if (codes.length > 0 && !data.giftTeaser?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Gift teaser is required when gift codes are set',
        path: ['giftTeaser'],
      });
    }

    const seen = new Set<string>();
    for (const code of codes) {
      if (seen.has(code)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Gift codes must be unique',
          path: ['giftCodes'],
        });
        break;
      }
      seen.add(code);
    }
  });

export type EventFormValues = z.infer<typeof eventSchema>;

/** Block publishing on create — places must be added after the event exists */
export const newEventSchema = eventSchema.superRefine((data, ctx) => {
  if (data.isActive) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        'Create as draft first. Add places and questions, then publish from the edit page.',
      path: ['isActive'],
    });
  }
});

export function createEditEventSchema(meta?: {
  placeCount?: number;
  placesWithoutQuestion?: number;
}) {
  return eventSchema.superRefine((data, ctx) => {
    if (!data.isActive) return;

    if (!meta?.placeCount || meta.placeCount < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Add at least one place before publishing',
        path: ['isActive'],
      });
    }

    if (meta?.placesWithoutQuestion && meta.placesWithoutQuestion > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Each place needs a question (${meta.placesWithoutQuestion} place(s) missing)`,
        path: ['isActive'],
      });
    }
  });
}

export const placeSchema = z.object({
  title: trimmed(2, 'Title'),
  description: z.string().trim().max(2000, 'Description must be at most 2000 characters'),
  latitude: z.coerce
    .number({ invalid_type_error: 'Latitude is required' })
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90'),
  longitude: z.coerce
    .number({ invalid_type_error: 'Longitude is required' })
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180'),
  radiusMeters: z.coerce
    .number({ invalid_type_error: 'Radius is required' })
    .int('Radius must be a whole number')
    .min(10, 'Minimum radius is 10 meters')
    .max(5000, 'Maximum radius is 5000 meters'),
  orderIndex: z.coerce
    .number({ invalid_type_error: 'Order is required' })
    .int('Order must be a whole number')
    .min(0, 'Order cannot be negative'),
  hint: z.string().trim().optional().or(z.literal('')),
});

export type PlaceFormValues = z.infer<typeof placeSchema>;

export const questionSchema = z
  .object({
    question: trimmed(3, 'Question'),
    type: z.nativeEnum(QuestionType),
    imageUrl: z.string().optional(),
    answer: z.string().trim().min(1, 'Answer is required'),
    explanation: z.string().trim().optional(),
    points: z.coerce
      .number({ invalid_type_error: 'Points must be a number' })
      .int('Points must be a whole number')
      .min(1, 'Minimum 1 point')
      .max(1000, 'Maximum 1000 points'),
    language: contentLanguageSchema.default(DEFAULT_CONTENT_LANGUAGE),
    options: z
      .array(
        z.object({ value: z.string().trim().min(1, 'Option cannot be empty') }),
      )
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === QuestionType.IMAGE && !data.imageUrl?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Upload an image for image questions',
        path: ['imageUrl'],
      });
    }
    if (data.type === QuestionType.MULTIPLE_CHOICE) {
      const options =
        data.options?.map(o => o.value.trim()).filter(Boolean) ?? [];
      if (options.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Multiple choice needs at least 2 options',
          path: ['options'],
        });
      }
      if (!options.some(o => o.toLowerCase() === data.answer.toLowerCase())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Answer must match one of the options',
          path: ['answer'],
        });
      }
    }
    if (data.type === QuestionType.TRUE_FALSE) {
      const valid = ['true', 'false'];
      if (!valid.includes(data.answer.toLowerCase())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Answer must be True or False',
          path: ['answer'],
        });
      }
    }
    if (data.type === QuestionType.TEXT && data.answer.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Answer is required',
        path: ['answer'],
      });
    }
  });

export type QuestionFormValues = z.infer<typeof questionSchema>;

export const articleSchema = z.object({
  title: trimmed(3, 'Title').max(200, 'Title is too long'),
  slug: z
    .string()
    .trim()
    .max(220, 'Slug is too long')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Use lowercase letters, numbers, and hyphens only',
    )
    .optional()
    .or(z.literal('')),
  placeName: trimmed(2, 'Place name').max(160, 'Place name is too long'),
  city: z
    .string()
    .trim()
    .max(100, 'City is too long')
    .optional()
    .or(z.literal('')),
  excerpt: trimmed(10, 'Excerpt').max(
    300,
    'Keep the excerpt under 300 characters',
  ),
  body: trimmed(10, 'Body'),
  coverImage: z.string().optional().or(z.literal('')),
  status: z.nativeEnum(ArticleStatus),
  eventId: z.string().optional().or(z.literal('')),
});

export type ArticleFormValues = z.infer<typeof articleSchema>;
