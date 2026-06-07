// ============================================================================
// translate_text Edge Function (T04 - Phase 2)
// Chinese to Uyghur Translation Assistant
// ============================================================================

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import {
  ValidationError,
  errorResponse,
  successResponse
} from "../_shared/errors.ts";

// ============================================================================
// Types
// ============================================================================

interface TranslateRequest {
  text: string;           // 待翻译的中文文本
  target_lang?: 'ug';     // 目标语言（目前只支持维语）
  context?: string;       // 上下文（如 "房产描述"、"合同条款"）
}

interface TranslateResponse {
  success: boolean;
  data?: {
    translated_text: string;
    source_lang: 'zh';
    target_lang: 'ug';
    translation_model: string;
    confidence: number;
    timestamp: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 构建翻译 Prompt
 */
function buildTranslationPrompt(text: string, context?: string): string {
  let prompt = `你是一位专业的维吾尔语翻译专家，请将以下中文房地产相关文本翻译成维吾尔语（使用阿拉伯文字写法）。\n` +
    `保持专业准确，尽量使用当地习惯用法。\n\n`;

  if (context) {
    prompt += `上下文: ${context}\n\n`;
  }

  prompt += `中文原文: "${text}"\n\n` +
    `要求：\n` +
    `1. 只返回翻译结果，不要解释或添加额外内容\n` +
    `2. 保持专业术语的一致性\n` +
    `3. 如果遇到无法准确翻译的词汇，请用最接近的意思表达\n`;

  return prompt;
}

/**
 * 调用翻译 API
 */
async function callTranslationAPI(text: string, context?: string): Promise<string | null> {
  const apiKey = Deno.env.get('NVIDIA_NIM_API_KEY') || Deno.env.get('NVIDIA_API_KEY');

  if (!apiKey) {
    console.log('No translation API key configured, using fallback translations');
    return null;
  }

  try {
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: Deno.env.get('TRANSLATION_MODEL') || 'nvidia/nemotron-3-super-120b-a12b',
        messages: [
          { role: 'system', content: '你是一位专业的维吾尔语翻译专家，专注于房地产领域的中维翻译。' },
          { role: 'user', content: buildTranslationPrompt(text, context) }
        ],
        temperature: 0.3,
        max_tokens: 512
      })
    });

    if (!response.ok) {
      console.log('Translation API failed:', response.statusText);
      return null;
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || '';

    // 清理翻译结果，移除可能的前缀
    let translated = content.trim();
    // 移除 "维吾尔语：" 等前缀
    translated = translated.replace(/^维吾尔语[:：]?\s*/i, '');
    translated = translated.replace(/^(ug|uy|uighur)[:：]\s*/i, '');

    return translated;
  } catch (error) {
    console.log('Translation API error:', String(error));
    return null;
  }
}

/**
 * 检测是否为有效的维吾尔语文本
 */
function isValidUyghurText(text: string): boolean {
  // 维吾尔语使用阿拉伯字母
  const uyghurChars = /[؀-ۿݐ-ݿ]/;
  return uyghurChars.test(text);
}

/**
 * 获取简单的内置翻译（用于 API 不可用时）
 */
function getFallbackTranslation(text: string, context?: string): string {
  const fallbacks: Record<string, Record<string, string>> = {
    "三室两厅": { ug: "3 ئۆي 2 مەيدان" },
    "学区房": { ug: "مەكتەپ يaqىنلىقىدا" },
    "南北通透": { ug: "شىمال-جەنۇب تېخىكىنىش" },
    "电梯房": { ug: "يورۇش تېلېفونى بار" },
    "带车位": { ug: "ئاپتومобىل تۈرۈش ئورنى بار" },
    "精装修": { ug: "جىلتىرىك جەريانى" },
    "毛坯房": { ug: "سېلىندۇرۇلغان" },
    "预售许可证": { ug: "ئالدىن سېتىش رۇخسىتى" },
    "购房合同": { ug: "تۇرمۇش تۈزۈش قارىشى" },
    "按揭贷款": { ug: "قۇرۇلۇش كاپىتالى" },
  };

  if (context && fallbacks[context]?.[text]) {
    return fallbacks[context][text];
  }

  // 直接查找
  for (const [zh, translation] of Object.entries(fallbacks)) {
    if (translation['ug'] && text.includes(zh)) {
      return translation['ug'];
    }
  }

  // 如果找不到，返回一个通用的占位符
  return `[Translation needed: ${text}]`;
}

// ============================================================================
// Main Translation Function
// ============================================================================

async function translateText(request: TranslateRequest): Promise<TranslateResponse> {
  const { text, target_lang = 'ug', context } = request;

  if (!text || typeof text !== 'string') {
    throw new ValidationError('text is required and must be a string');
  }

  // 调用翻译 API
  let translatedText = await callTranslationAPI(text, context);

  // 如果 API 调用失败，使用 fallback 翻译
  if (!translatedText || !isValidUyghurText(translatedText)) {
    console.log('Using fallback translation for:', text);
    translatedText = getFallbackTranslation(text, context);
  }

  return successResponse({
    source_lang: 'zh',
    target_lang: target_lang,
    translation_model: Deno.env.get('TRANSLATION_MODEL') || 'fallback_v1',
    confidence: isValidUyghurText(translatedText) ? 0.85 : 0.5,
    translated_text: translatedText,
    timestamp: new Date().toISOString()
  });
}

// ============================================================================
// HTTP Handler
// ============================================================================

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }

  try {
    if (req.method !== 'POST') {
      throw new ValidationError('Only POST method allowed');
    }

    const body: TranslateRequest = await req.json();
    return await translateText(body);
  } catch (error) {
    return errorResponse(error);
  }
});
