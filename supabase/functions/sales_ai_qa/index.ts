// ============================================================================
// sales_ai_qa Edge Function (T02 - Phase 2)
// Sales AI Q&A Assistant for Common Customer Questions
// ============================================================================

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import {
  ValidationError,
  AuthorizationError,
  errorResponse,
  successResponse
} from "../_shared/errors.ts";

// ============================================================================
// Types
// ============================================================================

interface QARequest {
  question: string;
  category?: string;
  context?: {
    customer_id?: string;
    sales_agent_id: string;
    session_id?: string;
  };
}

interface QAResponse {
  success: boolean;
  data?: {
    answer: string;
    confidence: number;
    disclaimer: string;
    category: string;
    timestamp: string;
  };
  error?: {
    code: string;
        message: string;
  };
}

// ============================================================================
// FAQ Knowledge Base
// ============================================================================

const FAQ_KNOWLEDGE_BASE = [
  {
    category: '付款方式',
    keywords: ['首付', '按揭', '贷款', '分期', '全款'],
    answer_zh: '我们支持多种付款方式：\n1. **首付款**：通常需要支付总房款的20%-40%\n2. **商业贷款**：可配合银行办理按揭\n3. **公积金贷款**：支持公积金组合贷\n4. **全款支付**：一次性付清享受优惠\n\n具体首付比例和贷款额度需根据您的资信情况和政府政策确定，建议预约销售顾问详细咨询。',
    answer_ug: 'بىز تۆۋەندىكى توۋەنلىك ئۇسۇللىرىنى قوللايمىز:\n1. **ئىگىش توپلاش**: ئادەتتە تولۇق مۇلازىۋېتىمنىڭ 20%-40%ى\n2. **كۆچمە كارىيا**: با拿ك بىلەن قۇرۇش قىلىشقا يول قويامىز\n3. **پۈتۈك ماندات كارىيىسى': 'پۈتۈك كارىيا بىلەن قوشۇمچە قۇرۇشنى قوللايمىز\n4. **توپلىمۇق توۋەن**: بىر قېتىملىق تۆلەش بىلەن ئالاھىدە سۈس بېرىمىز\n\nئىگىش نىسبىتى ۋە كارىيا مىقدارىنىڭ ئانچە تەكشۈرۈشى سىزنىڭ پۇل-مۇلىك ئەھۋالىڭىز ۋە حۆكۈمەت سىياسىتىڭىزگە باغلىنىدۇ، سېتىش مۇلازىمىتىگە يۈكلەپ تۇرىدىغان بىرلىكمە ئېھسان قىلىش تەكلىبى.'
  },
  {
    category: '合同条款',
    keywords: ['合同', '签约', '预售合同', '买卖合同'],
    answer_zh: '我们的购房合同采用住房和城乡建设部统一制定的标准文本，主要条款包括：\n\n1. **房屋基本信息**：房号、面积、单价、总价\n2. **付款方式和期限**：首付款比例、贷款金额、支付时间\n3. **交付标准和时间**：交房日期、装修标准\n4. **产权办理**：房产证办理时限和费用承担方\n5. **违约责任**：双方违约的赔偿责任\n6. **补充条款**：根据具体情况协商的特殊约定\n\n所有合同条款均符合国家法律法规，签约前可要求逐条解读。我们承诺绝不设置霸王条款。',
    answer_ug: 'بىز تۇرمۇش ئىشلەشلىرىنى قوغداش ۋە ئۇنۇپىتېكىتىتىنىڭ بىرلىكچىلىك تۈزىمىدىغان ئۆلچىملىك دوكىتىمنى ئىشلىتىمىز، ئاساسىي بەلگىلەش ئۇسۇللىرى تۆۋەندىكىچە:\n\n1. **مۇلازىۋېتىمنىڭ ئاساسىي ئۇچۇرلىرى**: دوكىت نومۇرى، ساھىسى، بىرلىك بەلگىسى، جەمئىي باھاسى\n2. **توۋەنلىك ئۇسۇلى ۋە ۋاقىتى**: ئىگىش نىسبىتى، كارىيا مىقدارى، تۆلەش ۋاقىتى\n3. **ئېغىزنى يېتىكۈزۈش ئۇسۇلى ۋە ۋاقتى': 'يېتىكۈزۈش سانى، زىرىپتەش ئۇسۇلى\n4. **مۇلوك قايتۇرۇش**: مۇلوك دوكىتىمنى ياساش ۋاقتى ۋە تونىتىش توندۇرۇش\n5. **بۇزۇق بولغان ئەھۋالدىكى يۈكۈملۈك': 'ھەر ئىككى تەرەپنىڭ بۇزۇق بولغانلىقى ئۈچۈن تونىتىش يۈكۈمى\n6. **قوشۇمچە بەلگىلەش**: ئالاھىدە تۆھپەكارلىرىنىڭ كېڭەيتىلمە بەلگىسى\n\nھەر قاندا بەلگىلەش مەركىزىي دۆلەت ئىقتىسادىي سىياسىتىغا مۇۋافىق، بېلىش يېتىكۈزۈشتىن بۇرۇن يەنىلا تاللىما قىلغۇدەك تەلەپ قىلىشقا ئۇچرىغان.'
  },
  {
    category: '政策',
    keywords: ['限购', '限贷', '房产税', '补贴', '新政'],
    answer_zh: '关于最新房地产政策，请注意以下几点：\n\n1. **购房资格**：本地户籍家庭可购2套，非户籍家庭需连续缴纳社保/个税满一定年限\n2. **贷款政策**：首套房首付最低20%，二套房首付最低30%（城市不同略有差异）\n3. **税收优惠**：90㎡以下普通住宅契税1%，90㎡以上为1.5%\n4. **人才补贴**：符合条件的高学历人才可申请一次性安家补贴\n5. **新政动态**：近期无重大政策调整，具体以政府部门最新通知为准\n\n购房前请务必确认自己的资格和贷款能力，建议提前咨询银行和当地房管部门。',
    answer_ug: 'ئەڭ يېڭى تۇرمۇش مۈلۈك سىياسىتى سەۋەبىدىن تۆۋەندىكى ئۇچۇrlارنى پەرھىز قىلىش كېرەك:\n\n1. **مۇلازىۋېتىش ئىجازىتى**: يەرلىك خەلق شىكارەت ئائىلىسى 2 دانە، خەلق شىكارەت ئائىلىسى بولۇپ ھەق-سالارەتنى تۆلەش ۋاقتى ۋە ھەق-سالارتىنى يېتىشىش كېرەك\n2. **كارىيا سىياسىتى**: ئىڭ يەنگى ئىشلىتىش ئۈچۈن ئىگىش 20%، ئىككىنچى تۇرمۇشتىكى مۇلازىۋېش ئۈچۈن ئىگىش 30%\n3. **سېلىش سۈستۈرى': '90متر² تۆۋەندىكى ئادەتتىكى تۇرمۇشتىكى مۇلازىۋېتنىڭ 1%، 90متر² يۇقىرى بولغانلىقى سەۋەبىدىن 1.5%\n4. **ئىنسانىيەت سۈستىتى': 'شەرتىگە مۇvais ھۆقۇق توندۇرۇش تونىتىشنى بىر قېتىملىق ئورۇن تاپشۇرۇۋېلىش سۈستىتى\n5. **يېڭى سىياسەت ئەھۋالى': 'يېڭى سىياسەت تەسىرى ئوتشىمىدى، ھەقىقىي مەلۇمات ئۈچۈن ھۆكۈمەت ۋە ھۆكۈمەت تۇرمۇش بېشىنىڭ يېڭى ئۇچۇرىنى پەرھىز قىلىش كېرەك\n\nمۇلازىۋېتىشتىن بۇرۇن ئۆزىڭىزنىڭ تۇرمۇشتىكى مۈلۈكنى ۋە كارىيا قابىليىتىنى تەكشۈرۈشىڭىزنى پەرھىز قىلىش كېرەك، باнакقا ئېلىشتىن بۇرۇن يەرلىك تۇرمۇش مۈلۈك دوقومىسىدىن تەكشۈرۈش تەكلىبىنى بىرىش تەۋسىيە قىلىنىدۇ.'
  },
  {
    category: '房屋信息',
    keywords: ['户型', '楼层', '朝向', '面积', '装修'],
    answer_zh: '关于房源的具体信息，我们建议您：\n\n1. **实地看房**：预约销售顾问安排实地参观，亲身体验户型和采光\n2. **查看图纸**：可提供详细的平面图和立体图，了解空间布局\n3. **咨询细节**：具体层高、墙体厚度、阳台封闭性等技术参数可向工程师咨询\n4. **对比选择**：我们有多个楼栋可供选择，不同朝向、楼层价格有所不同\n5. **交房标准**：精装修项目提供详细装修清单和品牌明细\n\n欢迎随时预约看房，我们将为您安排专业的置业顾问全程陪同。',
    answer_ug: 'مۇلازىۋېتىشنىڭ ئېگەرلىك ئۇچۇرى ئۈچۈن بىز تۆۋەندىكىلارنى پەرھىز قىلىشنى تەۋسىيە قىlamىز:\n\n1. **مۇلازىۋېتىشنى شەخسىي كۆرۈش**: سېتىش مۇلازىمىتىگە يۈكلەپ تۇرىدىغان بىرلىك مۇلازىۋېتىش\n2. **بېتىمۈلۈكنى كۆرۈش': 'دېتاللىق سۈپەتلىك پىلان رەسىمى ۋە ئۈچ تەرەپلىك رەسىمنى تەمىنلەش\n3. **تەفەسسلى سوئال': 'ئېگىزلىك، دىۋار ئۇچۇرى، بالكون يېتىكۈزۈش قاتارلىقلارنى زاناتكاردىن تەكشۈرۈش\n4. **سىناش تاللاش': 'بىزنىڭ نۇمۇرلىرىمىز بولۇپ، ھەر خىل مۇلازىۋېتىش باھاسى ئوخشاش\n5. **يېتىكۈزۈش ئۇسۇلى': 'تىجىكلەنمىگەن تۈزىتىش پروگراممىسى تۆۋەندىكى تىزىملىك ۋە بىرلەشمە توندۇرۇشنى تەمىنلەيدۇ\n\nمۇلازىۋېتىشنى ئارزۇ قىلسىڭىز كېلىشىڭ، بىز سىزگە مۇھىت تۈزۈش مۇلازىمىتىنى تەمىنلەيمىز.'
  }
];

const DEFAULT_DISCLAIMER_ZH = '以上回答仅供参考，具体政策以政府部门最新文件为准。如有疑问，请咨询您的专属销售顾问。';
const DEFAULT_DISCLAIMER_UG = 'بۇ توندۇرۇش پەقەت ماسلاشتۇرۇش ئۈچۈن، ھەقىقىي سىياسەتنى ھۆكۈمەت تۈزەتىش قىلىش كېرەك. سوئال بولسا شەخسىي سېتىش مۇلازىمىتىگە يۈكلەپ تۇرىدۇغان بىرلىكمە سوئال قىلغۇدەك تەلەپ قىلىش كېرەك.';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 分类问题
 */
function categorizeQuestion(question: string): { category: string; keywords: string[] } {
  const questionLower = question.toLowerCase();

  for (const item of FAQ_KNOWLEDGE_BASE) {
    for (const keyword of item.keywords) {
      if (questionLower.includes(keyword.toLowerCase())) {
        return { category: item.category, keywords: [keyword] };
      }
    }
  }

  return { category: 'general', keywords: [] };
}

/**
 * 查找最匹配的答案
 */
function findBestAnswer(question: string): { answer_zh: string; answer_ug: string } | null {
  const questionLower = question.toLowerCase();

  // Score each FAQ entry
  const scoredEntries = FAQ_KNOWLEDGE_BASE.map(entry => {
    let score = 0;
    for (const keyword of entry.keywords) {
      if (questionLower.includes(keyword.toLowerCase())) {
        score += keyword.length * 2; // Keywords get bonus points
      }
    }
    return { entry, score };
  });

  // Return the highest scored answer
  const bestMatch = scoredEntries.sort((a, b) => b.score - a.score)[0];
  if (bestMatch && bestMatch.score > 0) {
    return {
      answer_zh: bestMatch.entry.answer_zh,
      answer_ug: bestMatch.entry.answer_ug
    };
  }

  // Default response if no match found
  return null;
}

/**
 * 调用 AI API 进行智能问答（当知识库没有匹配答案时）
 */
async function callAIIssue(
  question: string,
  category: string
): Promise<{ answer_zh: string; confidence: number }> {
  const apiKey = Deno.env.get('NVIDIA_NIM_API_KEY') || Deno.env.get('NVIDIA_API_KEY');

  if (!apiKey) {
    console.log('No AI API key configured, using fallback response');
    return { answer_zh: '请稍后咨询您的销售顾问，我将尽快为您查询最新信息。', confidence: 0.3 };
  }

  try {
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: Deno.env.get('QA_MODEL') || 'nvidia/nemotron-3-super-120b-a12b',
        messages: [
          {
            role: 'system',
            content: '你是一位专业的房产销售顾问，擅长解答客户关于购房、贷款、合同等方面的常见问题。回答要简洁明了，包含必要的免责声明。'
          },
          {
            role: 'user',
            content: `问题：${question}\n分类：${category}\n\n请用中文回答，提供简明准确的解答。回答末尾必须包含：\n"以上仅供参考，具体政策以政府部门最新文件为准。如有疑问，请咨询您的专属销售顾问。"`
          }
        ],
        temperature: 0.5,
        max_tokens: 512
      })
    });

    if (!response.ok) {
      console.log('AI API failed:', response.statusText);
      return { answer_zh: '抱歉，我暂时无法回答这个问题，请稍后咨询您的销售顾问。', confidence: 0 };
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || '';

    // Remove the disclaimer we added (it was already in the prompt)
    const answer = content.replace(/以上仅供参考，具体政策以政府部门最新文件为准。如有疑问，请咨询您的专属销售顾问。\s*$/i, '').trim();

    return { answer_zh: answer, confidence: 0.85 };
  } catch (error) {
    console.log('AI API error:', String(error));
    return { answer_zh: '抱歉，我暂时无法回答这个问题，请稍后咨询您的销售顾问。', confidence: 0 };
  }
}

/**
 * 记录 QA 会话
 */
async function logQASession(
  supabase: any,
  salesAgentId: string,
  question: string,
  category: string
): Promise<void> {
  try {
    // In production, this would save to the database
    console.log('[QA Session]', { sales_agent_id: salesAgentId, question, category });
  } catch (error) {
    console.error('Failed to log QA session:', error);
  }
}

// ============================================================================
// Main Handler
// ============================================================================

async function handleQA(request: QARequest): Promise<QAResponse> {
  const { question, category, context } = request;

  // Validate inputs
  if (!question || typeof question !== 'string') {
    throw new ValidationError('Invalid or missing question');
  }

  if (!context?.sales_agent_id) {
    throw new ValidationError('sales_agent_id is required in context');
  }

  const salesAgentId = context.sales_agent_id;

  // Determine category
  const categorizedCategory = category || categorizeQuestion(question).category;

  // Try to find answer in knowledge base
  let bestAnswer = findBestAnswer(question);
  let confidence = bestAnswer ? 0.9 : 0;

  if (!bestAnswer) {
    // Fall back to AI for general questions
    const aiResponse = await callAIIssue(question, categorizedCategory);
    bestAnswer = {
      answer_zh: aiResponse.answer_zh,
      answer_ug: 'بۇ سوئالنى تەكشۈرۈش مېنىڭ تەلەپ قىلىشىمدىن تاشقى بولۇپ، مەن يەنە يەنىلا تەكشۈرۈش تەلەپ قىلىشىمدىن تاشقى بولۇپ تۇرىدۇ.'
    };
    confidence = aiResponse.confidence;
  }

  // Save to database
  const supabase = { from: () => ({ insert: () => ({ select: () => ({ single: async () => ({ data: null }, error: null }) }) }) });
  await logQASession(supabase, salesAgentId, question, categorizedCategory);

  // Add disclaimer (required by compliance)
  const answerZh = bestAnswer!.answer_zh + '\n\n' + DEFAULT_DISCLAIMER_ZH;
  const answerUg = bestAnswer!.answer_ug + '\n\n' + DEFAULT_DISCLAIMER_UG;

  return successResponse({
    answer: answerZh,
    confidence,
    disclaimer: DEFAULT_DISCLAIMER_ZH,
    category: categorizedCategory,
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

    const body: QARequest = await req.json();
    return await handleQA(body);
  } catch (error) {
    return errorResponse(error);
  }
});
