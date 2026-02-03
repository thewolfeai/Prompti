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

// Preset system prompts
const PRESET_PROMPTS = {
  default: `You are a prompt enhancement assistant. Transform rough prompts into clear, effective prompts.

Rules:
1. Preserve the original intent exactly - don't add requirements the user didn't mention
2. Clarify what the user wants, don't invent specifics (like sizes, colors, numbers) unless they mentioned them
3. Structure clearly: context → task → desired outcome
4. Remove ambiguity while staying true to what was asked
5. Keep it concise - enhance, don't over-elaborate
6. Output ONLY the enhanced prompt, nothing else`,

  formal: `You are a professional prompt enhancement assistant. Transform prompts into formal, business-appropriate language.

Rules:
1. Use professional, polished language
2. Maintain formal tone throughout
3. Clarify objectives without inventing new requirements
4. Remove casual expressions
5. Output ONLY the enhanced prompt, nothing else`,

  creative: `You are a creative prompt enhancement assistant. Transform prompts to encourage imaginative, unique responses.

Rules:
1. Add creative flair while preserving intent
2. Encourage exploration without adding specific constraints
3. Maintain the core request while opening possibilities
4. Don't prescribe exact details unless the user did
5. Output ONLY the enhanced prompt, nothing else`,

  technical: `You are a technical prompt enhancement assistant. Transform prompts for precise, technical responses.

Rules:
1. Use precise technical terminology
2. Clarify technical requirements mentioned, don't invent new ones
3. Structure for clear technical communication
4. Only add specifics (formats, constraints) if the user implied them
5. Output ONLY the enhanced prompt, nothing else`
};

// Animated placeholder examples - rough prompts that benefit from enhancement
const PLACEHOLDER_EXAMPLES = [
  "write a heartfelt thank you note",
  "explain this code to a beginner",
  "make a landing page with glassmorphism",
  "draft an apology email to a client",
  "create a workout plan for busy people",
  "write a cold outreach message"
];

// State
let state = {
  provider: null,
  model: null,
  apiKey: null,
  isLoading: false,
  ollamaModels: [],
  theme: 'dark',
  autostart: false,
  promptPreset: 'default',
  customPrompt: ''
};

// Placeholder animation state
let placeholderAnimation = {
  intervalId: null,
  timeoutId: null,
  currentIndex: 0,
  currentChar: 0,
  isDeleting: false,
  isActive: false
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
  clearInputButton: document.getElementById('clear-input'),
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
  settingsError: document.getElementById('settings-error'),

  // New settings
  themeToggle: document.getElementById('theme-toggle'),
  autostartToggle: document.getElementById('autostart-toggle'),
  presetButtons: document.querySelectorAll('.preset-btn'),
  customPromptTextarea: document.getElementById('custom-prompt')
};

// Initialize
async function init() {
  // Load theme first (before any UI shows)
  const savedTheme = await window.prompti.storage.get('theme');
  state.theme = savedTheme || 'dark';
  applyTheme(state.theme);

  // Load other preferences
  state.autostart = await window.prompti.storage.get('autostart') || false;
  state.promptPreset = await window.prompti.storage.get('promptPreset') || 'default';
  state.customPrompt = await window.prompti.storage.get('customPrompt') || '';

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
  elements.clearInputButton.addEventListener('click', handleClearInput);
  elements.promptInput.addEventListener('input', updateEnhanceButton);
  elements.promptInput.addEventListener('keydown', handlePromptKeydown);

  // Placeholder animation events
  elements.promptInput.addEventListener('focus', stopPlaceholderAnimation);
  elements.promptInput.addEventListener('blur', () => {
    if (!elements.promptInput.value) {
      startPlaceholderAnimation();
    }
  });

  // Settings
  elements.settingsBack.addEventListener('click', hideSettings);
  elements.settingsProvider.addEventListener('change', handleSettingsProviderChange);
  elements.settingsSave.addEventListener('click', handleSettingsSave);

  // Theme toggle
  elements.themeToggle.addEventListener('change', handleThemeToggle);

  // Auto-start toggle
  elements.autostartToggle.addEventListener('change', handleAutostartToggle);

  // Preset buttons
  elements.presetButtons.forEach(btn => {
    btn.addEventListener('click', handlePresetClick);
  });

  // Custom prompt textarea
  elements.customPromptTextarea.addEventListener('input', handleCustomPromptInput);

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
      apiKey: state.apiKey,
      systemPrompt: getCurrentSystemPrompt()
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

function handleClearInput() {
  elements.promptInput.value = '';
  elements.outputSection.classList.add('hidden');
  elements.mainError.textContent = '';
  updateEnhanceButton();
  elements.promptInput.focus();
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

// Theme handling
function applyTheme(theme) {
  if (theme === 'light') {
    document.documentElement.classList.add('light');
  } else {
    document.documentElement.classList.remove('light');
  }
}

async function handleThemeToggle(e) {
  state.theme = e.target.checked ? 'light' : 'dark';
  applyTheme(state.theme);
  await window.prompti.storage.set('theme', state.theme);
}

// Auto-start handling
async function handleAutostartToggle(e) {
  state.autostart = e.target.checked;
  await window.prompti.storage.set('autostart', state.autostart);
  await window.prompti.setAutostart(state.autostart);
}

// Preset handling
function handlePresetClick(e) {
  const preset = e.target.dataset.preset;

  // Update active button
  elements.presetButtons.forEach(btn => btn.classList.remove('active'));
  e.target.classList.add('active');

  state.promptPreset = preset;

  // Show/hide custom textarea
  if (preset === 'custom') {
    elements.customPromptTextarea.classList.remove('hidden');
    elements.customPromptTextarea.value = state.customPrompt;
  } else {
    elements.customPromptTextarea.classList.add('hidden');
  }

  // Save preference (don't await, fire and forget)
  window.prompti.storage.set('promptPreset', preset);
}

async function handleCustomPromptInput(e) {
  state.customPrompt = e.target.value;
  await window.prompti.storage.set('customPrompt', state.customPrompt);
}

// Get current system prompt based on preset
function getCurrentSystemPrompt() {
  if (state.promptPreset === 'custom' && state.customPrompt.trim()) {
    return state.customPrompt;
  }
  return PRESET_PROMPTS[state.promptPreset] || PRESET_PROMPTS.default;
}

function updateEnhanceButton() {
  const hasPrompt = elements.promptInput.value.trim().length > 0;
  elements.enhanceButton.disabled = !hasPrompt || state.isLoading;

  // Show/hide clear button
  if (hasPrompt) {
    elements.clearInputButton.classList.remove('hidden');
  } else {
    elements.clearInputButton.classList.add('hidden');
  }

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

  // Set theme toggle state
  elements.themeToggle.checked = state.theme === 'light';

  // Set autostart toggle state
  elements.autostartToggle.checked = state.autostart;

  // Set preset buttons state
  elements.presetButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.preset === state.promptPreset);
  });

  // Show/hide custom prompt textarea
  if (state.promptPreset === 'custom') {
    elements.customPromptTextarea.classList.remove('hidden');
    elements.customPromptTextarea.value = state.customPrompt;
  } else {
    elements.customPromptTextarea.classList.add('hidden');
  }

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

  // Start placeholder animation if input is empty
  // Don't auto-focus so animation can play - user clicks to type
  if (!elements.promptInput.value) {
    startPlaceholderAnimation();
  }
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

// Placeholder animation functions
function startPlaceholderAnimation() {
  if (placeholderAnimation.isActive) return;
  if (elements.promptInput.value) return; // Don't animate if there's content

  placeholderAnimation.isActive = true;
  placeholderAnimation.currentIndex = 0;
  placeholderAnimation.currentChar = 0;
  placeholderAnimation.isDeleting = false;

  animatePlaceholder();
}

function stopPlaceholderAnimation() {
  placeholderAnimation.isActive = false;
  if (placeholderAnimation.timeoutId) {
    clearTimeout(placeholderAnimation.timeoutId);
    placeholderAnimation.timeoutId = null;
  }
  // Reset placeholder to default
  elements.promptInput.placeholder = 'Type or paste your prompt here...';
}

function animatePlaceholder() {
  if (!placeholderAnimation.isActive) return;

  const currentExample = PLACEHOLDER_EXAMPLES[placeholderAnimation.currentIndex];

  if (!placeholderAnimation.isDeleting) {
    // Typing
    placeholderAnimation.currentChar++;
    elements.promptInput.placeholder = currentExample.substring(0, placeholderAnimation.currentChar);

    if (placeholderAnimation.currentChar === currentExample.length) {
      // Done typing, pause then start deleting
      placeholderAnimation.timeoutId = setTimeout(() => {
        placeholderAnimation.isDeleting = true;
        animatePlaceholder();
      }, 2000); // Pause for 2 seconds
    } else {
      // Continue typing
      placeholderAnimation.timeoutId = setTimeout(animatePlaceholder, 80);
    }
  } else {
    // Deleting
    placeholderAnimation.currentChar--;
    elements.promptInput.placeholder = currentExample.substring(0, placeholderAnimation.currentChar);

    if (placeholderAnimation.currentChar === 0) {
      // Done deleting, move to next example
      placeholderAnimation.isDeleting = false;
      placeholderAnimation.currentIndex = (placeholderAnimation.currentIndex + 1) % PLACEHOLDER_EXAMPLES.length;
      placeholderAnimation.timeoutId = setTimeout(animatePlaceholder, 500);
    } else {
      // Continue deleting
      placeholderAnimation.timeoutId = setTimeout(animatePlaceholder, 40);
    }
  }
}

// Start
init();
