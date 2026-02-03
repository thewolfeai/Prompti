const keytar = require('keytar');

const SERVICE_NAME = 'Prompti';

// Keys we store
const KEYS = {
  PROVIDER: 'provider',
  MODEL: 'model',
  API_KEY_PREFIX: 'apikey_'
};

/**
 * Get a value from secure storage
 * For API keys, uses keytar (Keychain/Credential Manager)
 * For other settings, uses keytar with a general account
 */
async function get(key) {
  try {
    if (key.startsWith('apikey_')) {
      // API keys stored securely in keychain
      const provider = key.replace('apikey_', '');
      return await keytar.getPassword(SERVICE_NAME, `apikey_${provider}`);
    } else {
      // Other settings stored as JSON in a general account
      const settings = await keytar.getPassword(SERVICE_NAME, 'settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        return parsed[key];
      }
      return null;
    }
  } catch (error) {
    console.error('Storage get error:', error);
    return null;
  }
}

/**
 * Set a value in secure storage
 */
async function set(key, value) {
  try {
    if (key.startsWith('apikey_')) {
      // API keys stored securely in keychain
      const provider = key.replace('apikey_', '');
      await keytar.setPassword(SERVICE_NAME, `apikey_${provider}`, value);
      return true;
    } else {
      // Other settings stored as JSON
      let settings = {};
      const existing = await keytar.getPassword(SERVICE_NAME, 'settings');
      if (existing) {
        settings = JSON.parse(existing);
      }
      settings[key] = value;
      await keytar.setPassword(SERVICE_NAME, 'settings', JSON.stringify(settings));
      return true;
    }
  } catch (error) {
    console.error('Storage set error:', error);
    return false;
  }
}

/**
 * Delete a value from secure storage
 */
async function deleteKey(key) {
  try {
    if (key.startsWith('apikey_')) {
      const provider = key.replace('apikey_', '');
      return await keytar.deletePassword(SERVICE_NAME, `apikey_${provider}`);
    } else {
      let settings = {};
      const existing = await keytar.getPassword(SERVICE_NAME, 'settings');
      if (existing) {
        settings = JSON.parse(existing);
        delete settings[key];
        await keytar.setPassword(SERVICE_NAME, 'settings', JSON.stringify(settings));
      }
      return true;
    }
  } catch (error) {
    console.error('Storage delete error:', error);
    return false;
  }
}

/**
 * Check if onboarding has been completed
 */
async function hasCompletedOnboarding() {
  const provider = await get('provider');
  return provider !== null;
}

/**
 * Get all saved settings
 */
async function getAllSettings() {
  const provider = await get('provider');
  const model = await get('model');
  const apiKey = provider ? await get(`apikey_${provider}`) : null;

  return {
    provider,
    model,
    hasApiKey: apiKey !== null && apiKey !== ''
  };
}

module.exports = {
  get,
  set,
  delete: deleteKey,
  hasCompletedOnboarding,
  getAllSettings
};
