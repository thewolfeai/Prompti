/**
 * Prompti Renderer Process
 * Handles UI logic, state management, and communication with main process
 */

// Model configurations (mirrored from providers.js for UI)
const MODELS = {
  anthropic: [
    { id: 'claude-opus-4-5-20251101', name: 'Claude Opus 4.5', description: 'Most capable' },
    { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', description: 'Balanced' },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude Haiku', description: 'Fast & affordable' }
  ],
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o', description: 'Latest flagship' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Fast & capable' },
    { id: 'gpt-4', name: 'GPT-4', description: 'Original GPT-4' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast & affordable' }
  ],
  google: [
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Latest & fastest' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Most capable' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Fast & efficient' }
  ],
  groq: [
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', description: 'Most capable' },
    { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', description: 'Fast mixture of experts' },
    { id: 'gemma2-9b-it', name: 'Gemma 2 9B', description: 'Compact & fast' }
  ],
  ollama: []
};

const PROVIDER_URLS = {
  anthropic: 'https://console.anthropic.com/settings/keys',
  openai: 'https://platform.openai.com/api-keys',
  google: 'https://aistudio.google.com/app/apikey',
  groq: 'https://console.groq.com/keys',
  ollama: null
};

const PROVIDER_NAMES = {
  anthropic: 'Anthropic (Claude)',
  openai: 'OpenAI (GPT)',
  google: 'Google (Gemini)',
  groq: 'Groq',
  ollama: 'Ollama (Local)'
};

// State
let state = {
  provider: null,
  model: null,
  apiKey: null,
  isLoading: false,
  ollamaModels: []
};

// DOM Elements
const elements = {
  // Views
  onboardingView: document.getElementById('onboarding-view'),
  mainView: document.getElementById('main-view'),
  settingsPanel: document.getElementById('settings-panel'),

  // Onboarding
  providerSelect: document.getElementById('provider-select'),
  modelSelect: document.getElementById('model-select'),
  apiKeyInput: document.getElementById('api-key-input'),
  apiKeyGroup: document.getElementById('api-key-group'),
  getKeyLink: document.getElementById('get-key-link'),
  saveButton: document.getElementById('save-button'),
  onboardingError: document.getElementById('onboarding-error'),

  // Main
  modelIndicator: document.getElementById('model-indicator'),
  currentModel: document.getElementById('current-model'),
  settingsButton: document.getElementById('settings-button'),
  promptInput: document.getElementById('prompt-input'),
  enhanceButton: document.getElementById('enhance-button'),
  outputSection: document.getElementById('output-section'),
  outputText: document.getElementById('output-text'),
  copyButton: document.getElementById('copy-button'),
  mainError: document.getElementById('main-error'),
  toast: document.getElementById('toast'),

  // Settings
  settingsBack: document.getElementById('settings-back'),
  settingsProvider: document.getElementById('settings-provider'),
  settingsModel: document.getElementById('settings-model'),
  settingsApiKey: document.getElementById('settings-api-key'),
  settingsApiKeyGroup: document.getElementById('settings-api-key-group'),
  settingsGetKeyLink: document.getElementById('settings-get-key-link'),
  settingsSave: document.getElementById('settings-save'),
  settingsError: document.getElementById('settings-error')
};

// Initialize
async function init() {
  // Check if onboarding completed
  const provider = await window.prompti.storage.get('provider');

  if (provider) {
    // Load saved settings
    state.provider = provider;
    state.model = await window.prompti.storage.get('model');
    state.apiKey = await window.prompti.storage.get(`apikey_${provider}`);

    showMainView();
  } else {
    showOnboardingView();
  }

  // Load Ollama models
  loadOllamaModels();

  // Set up event listeners
  setupEventListeners();

  // Listen for clipboard content
  window.prompti.onClipboardContent((text) => {
    if (text && !elements.promptInput.value) {
      elements.promptInput.value = text;
    }
  });
}

// Load Ollama models
async function loadOllamaModels() {
  try {
    state.ollamaModels = await window.prompti.getOllamaModels();
    MODELS.ollama = state.ollamaModels;
  } catch (e) {
    MODELS.ollama = [];
  }
}

// Event Listeners
function setupEventListeners() {
  // Onboarding
  elements.providerSelect.addEventListener('change', handleProviderChange);
  elements.modelSelect.addEventListener('change', handleModelChange);
  elements.apiKeyInput.addEventListener('input', validateOnboardingForm);
  elements.saveButton.addEventListener('click', handleSave);

  // Main
  elements.settingsButton.addEventListener('click', showSettings);
  elements.modelIndicator.addEventListener('click', showSettings);
  elements.enhanceButton.addEventListener('click', handleEnhance);
  elements.copyButton.addEventListener('click', handleCopy);
  elements.promptInput.addEventListener('input', updateEnhanceButton);
  elements.promptInput.addEventListener('keydown', handlePromptKeydown);

  // Settings
  elements.settingsBack.addEventListener('click', hideSettings);
  elements.settingsProvider.addEventListener('change', handleSettingsProviderChange);
  elements.settingsSave.addEventListener('click', handleSettingsSave);

  // Keyboard shortcuts
  document.addEventListener('keydown', handleGlobalKeydown);
}

// Handlers
function handleProviderChange(e) {
  const provider = e.target.value;
  updateModelDropdown(elements.modelSelect, provider);

  // Show/hide API key field
  if (provider === 'ollama') {
    elements.apiKeyGroup.classList.add('hidden');
  } else {
    elements.apiKeyGroup.classList.remove('hidden');
    if (PROVIDER_URLS[provider]) {
      elements.getKeyLink.href = PROVIDER_URLS[provider];
      elements.getKeyLink.style.display = 'inline';
    }
  }

  validateOnboardingForm();
}

function handleModelChange() {
  validateOnboardingForm();
}

function updateModelDropdown(selectElement, provider) {
  selectElement.innerHTML = '<option value="">Select a model...</option>';

  const models = MODELS[provider] || [];
  models.forEach(model => {
    const option = document.createElement('option');
    option.value = model.id;
    option.textContent = `${model.name} - ${model.description}`;
    selectElement.appendChild(option);
  });

  selectElement.disabled = !provider || models.length === 0;

  // If Ollama has no models, show message
  if (provider === 'ollama' && models.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'No models found (is Ollama running?)';
    selectElement.appendChild(option);
  }
}

function validateOnboardingForm() {
  const provider = elements.providerSelect.value;
  const model = elements.modelSelect.value;
  const apiKey = elements.apiKeyInput.value;

  const isValid = provider &&
    model &&
    (provider === 'ollama' || apiKey.length > 10);

  elements.saveButton.disabled = !isValid;
}

async function handleSave() {
  const provider = elements.providerSelect.value;
  const model = elements.modelSelect.value;
  const apiKey = elements.apiKeyInput.value;

  elements.saveButton.disabled = true;
  elements.onboardingError.textContent = '';

  try {
    // Validate API key (except for Ollama)
    if (provider !== 'ollama') {
      const result = await window.prompti.validateApiKey({ provider, apiKey });
      if (!result.valid) {
        throw new Error(result.error || 'Invalid API key');
      }
    }

    // Save settings
    await window.prompti.storage.set('provider', provider);
    await window.prompti.storage.set('model', model);
    if (apiKey) {
      await window.prompti.storage.set(`apikey_${provider}`, apiKey);
    }

    // Update state
    state.provider = provider;
    state.model = model;
    state.apiKey = apiKey;

    showMainView();
  } catch (error) {
    elements.onboardingError.textContent = error.message;
    elements.saveButton.disabled = false;
  }
}

async function handleEnhance() {
  const prompt = elements.promptInput.value.trim();
  if (!prompt || state.isLoading) return;

  state.isLoading = true;
  updateEnhanceButton();
  elements.mainError.textContent = '';
  elements.outputSection.classList.add('hidden');

  try {
    const enhanced = await window.prompti.enhancePrompt({
      prompt,
      provider: state.provider,
      model: state.model,
      apiKey: state.apiKey
    });

    elements.outputText.textContent = enhanced;
    elements.outputSection.classList.remove('hidden');

    // Auto-copy
    await window.prompti.setClipboard(enhanced);
    showToast();
  } catch (error) {
    let message = error.message || 'Failed to enhance prompt';

    if (message.includes('401') || message.includes('invalid')) {
      message = 'Invalid API key. Check your key and try again.';
    } else if (message.includes('429') || message.includes('rate')) {
      message = 'Rate limited. Wait a moment and try again.';
    } else if (message.includes('network') || message.includes('fetch')) {
      message = "Can't connect. Check your internet.";
    }

    elements.mainError.textContent = message;
  } finally {
    state.isLoading = false;
    updateEnhanceButton();
  }
}

function handleCopy() {
  const text = elements.outputText.textContent;
  if (text) {
    window.prompti.setClipboard(text);
    showToast();
  }
}

function handlePromptKeydown(e) {
  // Enter to enhance (without shift)
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleEnhance();
  }

  // Cmd+Enter to enhance, copy, and close
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    handleEnhance().then(() => {
      setTimeout(() => window.prompti.hideWindow(), 300);
    });
  }
}

function handleGlobalKeydown(e) {
  // Escape to close
  if (e.key === 'Escape') {
    if (!elements.settingsPanel.classList.contains('hidden')) {
      hideSettings();
    } else {
      window.prompti.hideWindow();
    }
  }
}

function updateEnhanceButton() {
  const hasPrompt = elements.promptInput.value.trim().length > 0;
  elements.enhanceButton.disabled = !hasPrompt || state.isLoading;

  const textEl = elements.enhanceButton.querySelector('.button-text');
  const loadingEl = elements.enhanceButton.querySelector('.button-loading');

  if (state.isLoading) {
    textEl.classList.add('hidden');
    loadingEl.classList.remove('hidden');
  } else {
    textEl.classList.remove('hidden');
    loadingEl.classList.add('hidden');
  }
}

// Settings
function showSettings() {
  // Populate provider dropdown
  elements.settingsProvider.innerHTML = '';
  Object.entries(PROVIDER_NAMES).forEach(([value, name]) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = name;
    if (value === state.provider) option.selected = true;
    elements.settingsProvider.appendChild(option);
  });

  // Populate model dropdown
  updateModelDropdown(elements.settingsModel, state.provider);
  elements.settingsModel.value = state.model;

  // Update API key link
  handleSettingsProviderChange();

  elements.settingsPanel.classList.remove('hidden');
}

function hideSettings() {
  elements.settingsPanel.classList.add('hidden');
  elements.settingsError.textContent = '';
  elements.settingsApiKey.value = '';
}

function handleSettingsProviderChange() {
  const provider = elements.settingsProvider.value;
  updateModelDropdown(elements.settingsModel, provider);

  if (provider === 'ollama') {
    elements.settingsApiKeyGroup.classList.add('hidden');
  } else {
    elements.settingsApiKeyGroup.classList.remove('hidden');
    if (PROVIDER_URLS[provider]) {
      elements.settingsGetKeyLink.href = PROVIDER_URLS[provider];
    }
  }
}

async function handleSettingsSave() {
  const provider = elements.settingsProvider.value;
  const model = elements.settingsModel.value;
  const newApiKey = elements.settingsApiKey.value;

  elements.settingsSave.disabled = true;
  elements.settingsError.textContent = '';

  try {
    // If provider changed or new API key entered, validate
    if (newApiKey && provider !== 'ollama') {
      const result = await window.prompti.validateApiKey({ provider, apiKey: newApiKey });
      if (!result.valid) {
        throw new Error(result.error || 'Invalid API key');
      }
    }

    // Save settings
    await window.prompti.storage.set('provider', provider);
    await window.prompti.storage.set('model', model);
    if (newApiKey) {
      await window.prompti.storage.set(`apikey_${provider}`, newApiKey);
      state.apiKey = newApiKey;
    } else if (provider !== state.provider) {
      // Provider changed, load existing key for new provider
      state.apiKey = await window.prompti.storage.get(`apikey_${provider}`);
    }

    state.provider = provider;
    state.model = model;

    updateMainView();
    hideSettings();
  } catch (error) {
    elements.settingsError.textContent = error.message;
  } finally {
    elements.settingsSave.disabled = false;
  }
}

// View management
function showOnboardingView() {
  elements.onboardingView.classList.remove('hidden');
  elements.mainView.classList.add('hidden');
}

function showMainView() {
  elements.onboardingView.classList.add('hidden');
  elements.mainView.classList.remove('hidden');
  updateMainView();
  elements.promptInput.focus();
}

function updateMainView() {
  // Update model indicator
  const models = MODELS[state.provider] || [];
  const currentModel = models.find(m => m.id === state.model);
  elements.currentModel.textContent = currentModel?.name || state.model || 'Select model';
}

function showToast() {
  elements.toast.classList.remove('hidden');
  setTimeout(() => {
    elements.toast.classList.add('hidden');
  }, 2000);
}

// Start
init();
