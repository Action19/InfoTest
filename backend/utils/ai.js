/**
 * AI Utility — Anthropic Claude SDK wrapper
 * Barcha route fayllar uchun yagona AI chaqiruv moduli
 * 
 * OpenAI dan Claude ga o'tish uchun:
 * - model: claude-sonnet-4-20250514 (Sonnet 5 ekvivalenti)
 * - API: Anthropic Messages API
 * - Vision: base64 source type
 */

const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Asosiy model — Claude 3.5 Sonnet (latest alias)
const DEFAULT_MODEL = 'claude-3-5-sonnet-latest';

/**
 * Matnli so'rov yuborish (text-only)
 * @param {string} prompt - Foydalanuvchi so'rovi
 * @param {object} options - { temperature, max_tokens, system }
 * @returns {string} AI javobi (text)
 */
async function chat(prompt, options = {}) {
  const {
    temperature = 0.5,
    max_tokens = 2000,
    system = undefined,
    model = DEFAULT_MODEL
  } = options;

  const params = {
    model,
    max_tokens,
    temperature,
    messages: [{ role: 'user', content: prompt }]
  };

  if (system) {
    params.system = system;
  }

  const response = await anthropic.messages.create(params);
  return response.content[0].text;
}

/**
 * Ko'p xabarli so'rov (multi-turn messages)
 * @param {Array} messages - [{role:'user'|'assistant', content:'...'}]
 * @param {object} options - { temperature, max_tokens, system }
 * @returns {string} AI javobi (text)
 */
async function chatMessages(messages, options = {}) {
  const {
    temperature = 0.5,
    max_tokens = 2000,
    system = undefined,
    model = DEFAULT_MODEL
  } = options;

  const params = {
    model,
    max_tokens,
    temperature,
    messages
  };

  if (system) {
    params.system = system;
  }

  const response = await anthropic.messages.create(params);
  return response.content[0].text;
}

/**
 * Rasm bilan so'rov (Vision)
 * @param {string} prompt - Matnli so'rov
 * @param {string} base64Data - Rasm base64 kodda
 * @param {string} mimeType - 'image/png', 'image/jpeg', etc.
 * @param {object} options - { temperature, max_tokens }
 * @returns {string} AI javobi (text)
 */
async function chatWithImage(prompt, base64Data, mimeType, options = {}) {
  const {
    temperature = 0.2,
    max_tokens = 1000,
    model = DEFAULT_MODEL
  } = options;

  const response = await anthropic.messages.create({
    model,
    max_tokens,
    temperature,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: mimeType,
            data: base64Data
          }
        },
        {
          type: 'text',
          text: prompt
        }
      ]
    }]
  });

  return response.content[0].text;
}

module.exports = {
  chat,
  chatMessages,
  chatWithImage,
  DEFAULT_MODEL,
  anthropic
};
