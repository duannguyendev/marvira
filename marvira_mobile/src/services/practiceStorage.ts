const FAVORITE_EVENTS_KEY = '@practice_favorite_events';
const FAVORITE_QUESTIONS_KEY = '@practice_favorite_questions';
const TRAINING_COMPLETED_KEY = '@practice_training_completed';

let AsyncStorage: {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
} | null = null;

const memoryStorage: Record<string, string> = {};

function getStorage() {
  if (!AsyncStorage) {
    try {
      const module = require('@react-native-async-storage/async-storage');
      AsyncStorage = module.default || module;
    } catch {
      AsyncStorage = {
        getItem: async (key: string) => memoryStorage[key] ?? null,
        setItem: async (key: string, value: string) => {
          memoryStorage[key] = value;
        },
      };
    }
  }
  return AsyncStorage!;
}

async function readIdSet(key: string): Promise<Set<string>> {
  const storage = getStorage();
  const raw = await storage.getItem(key);
  if (!raw) {
    return new Set();
  }
  try {
    const parsed = JSON.parse(raw) as string[];
    return new Set(parsed);
  } catch {
    return new Set();
  }
}

async function writeIdSet(key: string, ids: Set<string>): Promise<void> {
  const storage = getStorage();
  await storage.setItem(key, JSON.stringify([...ids]));
}

export const practiceStorage = {
  getFavoriteEventIds: () => readIdSet(FAVORITE_EVENTS_KEY),
  setFavoriteEventIds: (ids: Set<string>) => writeIdSet(FAVORITE_EVENTS_KEY, ids),

  getFavoriteQuestionIds: () => readIdSet(FAVORITE_QUESTIONS_KEY),
  setFavoriteQuestionIds: (ids: Set<string>) =>
    writeIdSet(FAVORITE_QUESTIONS_KEY, ids),

  getTrainingCompletedIds: () => readIdSet(TRAINING_COMPLETED_KEY),
  setTrainingCompletedIds: (ids: Set<string>) =>
    writeIdSet(TRAINING_COMPLETED_KEY, ids),
};
