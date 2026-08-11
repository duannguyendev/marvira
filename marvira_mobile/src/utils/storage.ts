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
const REMEMBER_ME_KEY = '@remember_me';
const KEYCHAIN_SERVICE = 'com.marvira.auth';
const REMEMBERED_LOGIN_SERVICE = 'com.marvira.remembered_login';

const getStorage = () => getStorageImpl();

/** Prefer AFTER_FIRST_UNLOCK so tokens remain readable after backgrounding. */
const TOKEN_ACCESSIBLE = Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK;

let keychainMigrationDone = false;

async function setSecureToken(key: 'access' | 'refresh', value: string) {
  const username = key === 'access' ? 'access_token' : 'refresh_token';
  await Keychain.setGenericPassword(username, value, {
    service: `${KEYCHAIN_SERVICE}.${key}`,
    accessible: TOKEN_ACCESSIBLE,
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

/**
 * Re-write existing tokens so accessibility upgrades from WHEN_UNLOCKED
 * (older builds) to AFTER_FIRST_UNLOCK. Runs once per process.
 */
async function migrateTokenAccessibility(): Promise<void> {
  if (keychainMigrationDone) {
    return;
  }
  keychainMigrationDone = true;
  try {
    const [access, refresh] = await Promise.all([
      getSecureToken('access'),
      getSecureToken('refresh'),
    ]);
    await Promise.all([
      access ? setSecureToken('access', access) : Promise.resolve(),
      refresh ? setSecureToken('refresh', refresh) : Promise.resolve(),
    ]);
  } catch {
    // Leave tokens as-is; next login/refresh will rewrite them.
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
      await migrateTokenAccessibility();
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
      await migrateTokenAccessibility();
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

  /**
   * Save email/password for the login form "Remember me" option.
   * Kept separate from session tokens so logout / expiry still leaves them.
   */
  async setRememberedCredentials(
    email: string,
    password: string,
  ): Promise<void> {
    try {
      await Keychain.setGenericPassword(email.trim(), password, {
        service: REMEMBERED_LOGIN_SERVICE,
        accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK,
      });
      await getStorage().setItem(REMEMBER_ME_KEY, 'true');
    } catch (error) {
      console.error('Error saving remembered credentials:', error);
    }
  },

  async getRememberedCredentials(): Promise<{
    email: string;
    password: string;
  } | null> {
    try {
      const enabled = await getStorage().getItem(REMEMBER_ME_KEY);
      if (enabled !== 'true') {
        return null;
      }
      const credentials = await Keychain.getGenericPassword({
        service: REMEMBERED_LOGIN_SERVICE,
      });
      if (credentials && typeof credentials !== 'boolean') {
        return {
          email: credentials.username,
          password: credentials.password,
        };
      }
      return null;
    } catch (error) {
      console.error('Error reading remembered credentials:', error);
      return null;
    }
  },

  async clearRememberedCredentials(): Promise<void> {
    try {
      await Keychain.resetGenericPassword({
        service: REMEMBERED_LOGIN_SERVICE,
      });
    } catch {
      // ignore
    }
    await getStorage().removeItem(REMEMBER_ME_KEY);
  },

  async setItem(key: string, value: string): Promise<void> {
    await getStorage().setItem(key, value);
  },

  async getItem(key: string): Promise<string | null> {
    return getStorage().getItem(key);
  },

  async removeItem(key: string): Promise<void> {
    await getStorage().removeItem(key);
  },
};
