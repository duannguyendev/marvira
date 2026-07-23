import * as Keychain from 'react-native-keychain';

// Lazy initialization of AsyncStorage for non-sensitive data
let AsyncStorage: any = null;
let useMemoryStorage = false;
let storageInitialized = false;

const memoryStorage: Record<string, string> = {};

const getStorageImpl = () => {
  return {
    getItem: async (key: string): Promise<string | null> => {
      try {
        if (!storageInitialized) {
          try {
            const module = require('@react-native-async-storage/async-storage');
            AsyncStorage = module.default || module;
            useMemoryStorage = !(
              AsyncStorage && typeof AsyncStorage.getItem === 'function'
            );
          } catch {
            useMemoryStorage = true;
          }
          storageInitialized = true;
        }

        if (!useMemoryStorage && AsyncStorage) {
          return await AsyncStorage.getItem(key);
        }
        return memoryStorage[key] || null;
      } catch {
        return memoryStorage[key] || null;
      }
    },
    setItem: async (key: string, value: string): Promise<void> => {
      try {
        if (!storageInitialized) {
          try {
            const module = require('@react-native-async-storage/async-storage');
            AsyncStorage = module.default || module;
            useMemoryStorage = !(
              AsyncStorage && typeof AsyncStorage.setItem === 'function'
            );
          } catch {
            useMemoryStorage = true;
          }
          storageInitialized = true;
        }

        if (!useMemoryStorage && AsyncStorage) {
          await AsyncStorage.setItem(key, value);
        } else {
          memoryStorage[key] = value;
        }
      } catch {
        memoryStorage[key] = value;
      }
    },
    removeItem: async (key: string): Promise<void> => {
      try {
        if (!useMemoryStorage && AsyncStorage) {
          await AsyncStorage.removeItem(key);
        } else {
          delete memoryStorage[key];
        }
      } catch {
        delete memoryStorage[key];
      }
    },
    multiRemove: async (keys: string[]): Promise<void> => {
      try {
        if (!useMemoryStorage && AsyncStorage) {
          await AsyncStorage.multiRemove(keys);
        } else {
          keys.forEach(key => delete memoryStorage[key]);
        }
      } catch {
        keys.forEach(key => delete memoryStorage[key]);
      }
    },
  };
};

const USER_KEY = '@user_data';
const KEYCHAIN_SERVICE = 'com.marvira.auth';

const getStorage = () => getStorageImpl();

async function setSecureToken(key: 'access' | 'refresh', value: string) {
  const username = key === 'access' ? 'access_token' : 'refresh_token';
  await Keychain.setGenericPassword(username, value, {
    service: `${KEYCHAIN_SERVICE}.${key}`,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
  });
}

async function getSecureToken(
  key: 'access' | 'refresh',
): Promise<string | null> {
  try {
    const credentials = await Keychain.getGenericPassword({
      service: `${KEYCHAIN_SERVICE}.${key}`,
    });
    if (credentials && typeof credentials !== 'boolean') {
      return credentials.password;
    }
    return null;
  } catch {
    return null;
  }
}

async function removeSecureToken(key: 'access' | 'refresh') {
  try {
    await Keychain.resetGenericPassword({
      service: `${KEYCHAIN_SERVICE}.${key}`,
    });
  } catch {
    // ignore
  }
}

export const storage = {
  async setToken(token: string): Promise<void> {
    try {
      await setSecureToken('access', token);
    } catch (error) {
      console.error('Error setting token:', error);
    }
  },

  async getToken(): Promise<string | null> {
    try {
      return await getSecureToken('access');
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },

  async removeToken(): Promise<void> {
    await removeSecureToken('access');
  },

  async setRefreshToken(token: string): Promise<void> {
    try {
      await setSecureToken('refresh', token);
    } catch (error) {
      console.error('Error setting refresh token:', error);
    }
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      return await getSecureToken('refresh');
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  },

  async removeRefreshToken(): Promise<void> {
    await removeSecureToken('refresh');
  },

  async setUser(user: any): Promise<void> {
    const impl = getStorage();
    await impl.setItem(USER_KEY, JSON.stringify(user));
  },

  async getUser(): Promise<any | null> {
    const impl = getStorage();
    const user = await impl.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  async removeUser(): Promise<void> {
    const impl = getStorage();
    await impl.removeItem(USER_KEY);
  },

  async clearAll(): Promise<void> {
    await Promise.all([
      this.removeToken(),
      this.removeRefreshToken(),
      this.removeUser(),
    ]);
  },
};
