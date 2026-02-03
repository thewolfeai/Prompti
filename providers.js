/**
 * AI Provider integrations for Prompti
 * Unified interface for Claude, GPT, Gemini, Groq, and Ollama
 */

// Model configurations
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
  ollama: [] // Dynamically populated
};

// Provider console URLs for getting API keys
const PROVIDER_URLS = {
  anthropic: 'https://console.anthropic.com/settings/keys',
  openai: 'https://platform.openai.com/api-keys',
  google: 'https://aistudio.google.com/app/apikey',
  groq: 'https://console.groq.com/keys',
  ollama: null // No API key needed
};

// The system prompt for enhancing prompts
const ENHANCEMENT_SYSTEM_PROMPT = `You are a prompt enhancement assistant. Transform rough prompts into clear, effective prompts that get better AI results.

Rules:
1. Preserve the original intent exactly
2. Add context and specificity where missing
3. Structure clearly: context → task → format (if needed)
4. Remove ambiguity
5. Stay concise - don't over-elaborate
6. Output ONLY the enhanced prompt, nothing else

Example:
User: "help me write an email to my boss about being late"
Enhanced: "Write a professional, apologetic email to my manager explaining I'll be 15-30 minutes late today. Keep it respectful and brief. Offer to make up the time or handle urgent matters remotely."`;

/**
 * Enhance a prompt using the specified provider
 */
async function enhance(prompt, provider, model, apiKey, systemPrompt) {
  // Use custom system prompt if provided, otherwise use default
  const effectiveSystemPrompt = systemPrompt || ENHANCEMENT_SYSTEM_PROMPT;

  try {
    switch (provider) {
      case 'anthropic':
        return await enhanceWithAnthropic(prompt, model, apiKey, effectiveSystemPrompt);
      case 'openai':
        return await enhanceWithOpenAI(prompt, model, apiKey, effectiveSystemPrompt);
      case 'google':
        return await enhanceWithGoogle(prompt, model, apiKey, effectiveSystemPrompt);
      case 'groq':
        return await enhanceWithGroq(prompt, model, apiKey, effectiveSystemPrompt);
      case 'ollama':
        return await enhanceWithOllama(prompt, model, effectiveSystemPrompt);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  } catch (error) {
    console.error('Enhancement error:', error);
    throw error;
  }
}

/**
 * Validate an API key
 */
async function validateKey(provider, apiKey) {
  try {
    switch (provider) {
      case 'anthropic':
        return await validateAnthropicKey(apiKey);
      case 'openai':
        return await validateOpenAIKey(apiKey);
      case 'google':
        return await validateGoogleKey(apiKey);
      case 'groq':
        return await validateGroqKey(apiKey);
      case 'ollama':
        return { valid: true }; // No key needed
      default:
        return { valid: false, error: 'Unknown provider' };
    }
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

// Anthropic (Claude)
async function enhanceWithAnthropic(prompt, model, apiKey, systemPrompt) {
  const Anthropic = require('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: model,
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: prompt }]
  });

  return response.content[0].text;
}

async function validateAnthropicKey(apiKey) {
  const Anthropic = require('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey });

  try {
    // Make a minimal API call to validate
    await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Hi' }]
    });
    return { valid: true };
  } catch (error) {
    if (error.status === 401) {
      return { valid: false, error: 'Invalid API key' };
    }
    throw error;
  }
}

// OpenAI (GPT)
async function enhanceWithOpenAI(prompt, model, apiKey, systemPrompt) {
  const OpenAI = require('openai');
  const client = new OpenAI({ apiKey });

  const response = await client.chat.completions.create({
    model: model,
    max_tokens: 1024,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ]
  });

  return response.choices[0].message.content;
}

async function validateOpenAIKey(apiKey) {
  const OpenAI = require('openai');
  const client = new OpenAI({ apiKey });

  try {
    await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Hi' }]
    });
    return { valid: true };
  } catch (error) {
    if (error.status === 401) {
      return { valid: false, error: 'Invalid API key' };
    }
    throw error;
  }
}

// Google (Gemini)
async function enhanceWithGoogle(prompt, model, apiKey, systemPrompt) {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(apiKey);
  const genModel = genAI.getGenerativeModel({ model: model });

  const result = await genModel.generateContent({
    contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nUser prompt to enhance: ${prompt}` }] }]
  });

  return result.response.text();
}

async function validateGoogleKey(apiKey) {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    await model.generateContent('Hi');
    return { valid: true };
  } catch (error) {
    if (error.message?.includes('API key')) {
      return { valid: false, error: 'Invalid API key' };
    }
    throw error;
  }
}

// Groq
async function enhanceWithGroq(prompt, model, apiKey, systemPrompt) {
  const Groq = require('groq-sdk');
  const client = new Groq({ apiKey });

  const response = await client.chat.completions.create({
    model: model,
    max_tokens: 1024,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ]
  });

  return response.choices[0].message.content;
}

async function validateGroqKey(apiKey) {
  const Groq = require('groq-sdk');
  const client = new Groq({ apiKey });

  try {
    await client.chat.completions.create({
      model: 'gemma2-9b-it',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Hi' }]
    });
    return { valid: true };
  } catch (error) {
    if (error.status === 401) {
      return { valid: false, error: 'Invalid API key' };
    }
    throw error;
  }
}

// Ollama (Local)
async function enhanceWithOllama(prompt, model, systemPrompt) {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model,
      prompt: `${systemPrompt}\n\nUser prompt to enhance: ${prompt}`,
      stream: false
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.response;
}

async function getOllamaModels() {
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    if (!response.ok) {
      return [];
    }
    const data = await response.json();
    return data.models?.map(m => ({
      id: m.name,
      name: m.name,
      description: `${(m.size / 1e9).toFixed(1)}GB`
    })) || [];
  } catch (error) {
    // Ollama not running
    return [];
  }
}

module.exports = {
  MODELS,
  PROVIDER_URLS,
  enhance,
  validateKey,
  getOllamaModels
};
