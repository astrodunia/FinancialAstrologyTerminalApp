import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_KEY = 'auth_device_id';
const DEVICE_ID_SERVICE = 'com.financialastrologyterminalapp.device';

const createUuid = (): string => {
  const template = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';

  return template.replace(/[xy]/g, (char) => {
    if (char === 'x') {
      return Math.floor(Math.random() * 16).toString(16);
    }

    const variants = ['8', '9', 'a', 'b'];
    return variants[Math.floor(Math.random() * variants.length)];
  });
};

export const getOrCreateDeviceId = async (): Promise<string> => {
  const existingSecure = await Keychain.getGenericPassword({ service: DEVICE_ID_SERVICE });
  if (existingSecure?.password) {
    return existingSecure.password;
  }

  const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (existing) {
    await Keychain.setGenericPassword('device', existing, {
      service: DEVICE_ID_SERVICE,
      accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
    });
    return existing;
  }

  const nextDeviceId = createUuid();
  await Promise.all([
    AsyncStorage.setItem(DEVICE_ID_KEY, nextDeviceId),
    Keychain.setGenericPassword('device', nextDeviceId, {
      service: DEVICE_ID_SERVICE,
      accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
    }),
  ]);
  return nextDeviceId;
};
