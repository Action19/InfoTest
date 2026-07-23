/**
 * AI Utility — Anthropic Claude API (to'g'ridan-to'g'ri HTTP fetch)
 * SDK muammolaridan qochish uchun raw fetch ishlatiladi
 * 
 * Model: claude-3-5-sonnet-latest
 * API: https://api.anthropic.com/v1/messages
 */

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const DEFAULT_MODEL = 'claude-3-5-sonnet-latest';

/**
 * Anthropic API'ga raw HTTP so'rov yuborish
 */
async function callAnthropic(body) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY environment variable not set');

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Anthropic API error:', response.status, errorText);
    throw new Error(`Anthropic API ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data;
}

/**
 * Matnli so'rov yuborish (text-only)
 * @param {string} prompt - Foydalanuvchi so'rovi
 * @param {object} options - { temperature, max_tokens, system, model }
 * @returns {string} AI javobi (text)
 */
async function chat(prompt, options = {}) {
  const {
    temperature = 0.5,
    max_tokens = 2000,
    system = undefined,
    model = DEFAULT_MODEL
  } = options;

  const body = {
    model,
    max_tokens,
    messages: [{ role: 'user', content: prompt }]
  };

  // temperature faqat 0 dan farqli bo'lganda qo'shish
  if (temperature !== undefined) body.temperature = temperature;
  if (system) body.system = system;

  const data = await callAnthropic(body);
  return data.content[0].text;
}

/**
 * Ko'p xabarli so'rov (multi-turn messages)
 * @param {Array} messages - [{role:'user'|'assistant', content:'...'}]
 * @param {object} options - { temperature, max_tokens, system, model }
 * @returns {string} AI javobi (text)
 */
async function chatMessages(messages, options = {}) {
  const {
    temperature = 0.5,
    max_tokens = 2000,
    system = undefined,
    model = DEFAULT_MODEL
  } = options;

  const body = {
    model,
    max_tokens,
    messages
  };

  if (temperature !== undefined) body.temperature = temperature;
  if (system) body.system = system;

  const data = await callAnthropic(body);
  return data.content[0].text;
}

/**
 * Rasm bilan so'rov (Vision)
 * @param {string} prompt - Matnli so'rov
 * @param {string} base64Data - Rasm base64 kodda
 * @param {string} mimeType - 'image/png', 'image/jpeg', etc.
 * @param {object} options - { temperature, max_tokens, model }
 * @returns {string} AI javobi (text)
 */
async function chatWithImage(prompt, base64Data, mimeType, options = {}) {
  const {
    temperature = 0.2,
    max_tokens = 1000,
    model = DEFAULT_MODEL
  } = options;

  const body = {
    model,
    max_tokens,
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
  };

  if (temperature !== undefined) body.temperature = temperature;

  const data = await callAnthropic(body);
  return data.content[0].text;
}

module.exports = {
  chat,
  chatMessages,
  chatWithImage,
  DEFAULT_MODEL
};
