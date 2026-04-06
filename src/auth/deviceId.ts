import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_KEY = 'auth_device_id';

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
  const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (existing) {
    return existing;
  }

  const nextDeviceId = createUuid();
  await AsyncStorage.setItem(DEVICE_ID_KEY, nextDeviceId);
  return nextDeviceId;
};
