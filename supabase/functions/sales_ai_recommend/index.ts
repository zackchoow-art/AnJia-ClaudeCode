// ============================================================================
// sales_ai_recommend Edge Function (T02 - Phase 2)
// Property Recommendation Engine using AI
// ============================================================================

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import {
  ValidationError,
  AuthorizationError,
  NotFoundError,
  errorResponse,
  successResponse
} from "../_shared/errors.ts";

// ============================================================================
// Types
// ============================================================================

interface Property {
  id: string;
  property_code: string;
  building_number: string;
  unit_number: string;
  room_number: string;
  floor_area: number;
  list_price?: number;
  final_price?: number;
  property_type: Record<string, string>;
  features: Array<string | Record<string, string>>;
}

interface Customer {
  id: string;
  customer_name: string;
  customer_phone: string;
  budget_range_min?: number;
  budget_range_max?: number;
  interested_property_type?: string;
  notes?: string;
}

interface RecommendationScore {
  property_id: string;
  score: number;  // 0-1
  reasons_zh: string[];
  reasons_ug?: string[];
  rank: number;
}

interface RecommendationRequest {
  customer_id: string;
  sales_agent_id: string;
  model?: string;
}

interface RecommendationResponse {
  success: boolean;
  data?: {
    recommendation_id: string;
    customer_id: string;
    scores: RecommendationScore[];
    total_properties_evaluated: number;
    ai_model: string;
    timestamp: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

// ============================================================================
// Mock Data (in real implementation, fetch from database)
// ============================================================================

const MOCK_PROPERTIES: Property[] = [
  {
    id: 'prop-1',
    property_code: 'A-1-1-101',
    building_number: 'A栋',
    unit_number: '1单元',
    room_number: '101',
    floor_area: 120.5,
    list_price: 1200000,
    property_type: { zh: '三室两厅', ug: '3 ئۆي 2 مەيدان' },
    features: ['学区房', '南北通透', '电梯房']
  },
  {
    id: 'prop-2',
    property_code: 'A-1-2-201',
    building_number: 'A栋',
    unit_number: '2单元',
    room_number: '201',
    floor_area: 98.3,
    list_price: 980000,
    property_type: { zh: '两室一厅', ug: '2 ئۆي 1 مەيدان' },
    features: ['学区房', '精装']
  },
  {
    id: 'prop-3',
    property_code: 'B-2-1-102',
    building_number: 'B栋',
    unit_number: '1单元',
    room_number: '102',
    floor_area: 156.7,
    list_price: 1650000,
    property_type: { zh: '三室两厅', ug: '3 ئۆي 2 مەيدان' },
    features: ['近地铁', '带车位', '南北通透']
  },
  {
    id: 'prop-4',
    property_code: 'C-3-3-301',
    building_number: 'C栋',
    unit_number: '3单元',
    room_number: '301',
    floor_area: 89.2,
    list_price: 880000,
    property_type: { zh: '两室一厅', ug: '2 ئۆي 1 مەيدان' },
    features: ['价格实惠', '楼层佳']
  }
];

const MOCK_CUSTOMERS: Record<string, Customer> = {
  'cust-1': {
    id: 'cust-1',
    customer_name: '张伟',
    customer_phone: '13812341234',
    budget_range_min: 800000,
    budget_range_max: 1500000,
    interested_property_type: '三室两厅',
    notes: '有小孩，看重学区；双职工家庭'
  },
  'cust-2': {
    id: 'cust-2',
    customer_name: '李娜',
    customer_phone: '13956785678',
    budget_range_min: 1000000,
    budget_range_max: 1200000,
    interested_property_type: '两室一厅',
    notes: '首次购房，预算有限'
  }
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 构建 AI Prompt
 */
function buildRecommendationPrompt(customer: Customer, properties: Property[]): string {
  const budgetMin = customer.budget_range_min || 0;
  const budgetMax = customer.budget_range_max || 999999999;

  let prompt = `你是一位专业的房产销售顾问，请根据客户情况推荐最合适的房源。\n\n`;

  prompt += `【客户信息】\n`;
  prompt += `- 预算范围：${budgetMin} 至 ${budgetMax} 元\n`;
  if (customer.interested_property_type) {
    prompt += `- 偏好户型：${customer.interested_property_type}\n`;
  }
  if (customer.notes) {
    prompt += `- 家庭情况/偏好：${customer.notes}\n`;
  }

  prompt += `\n【可用房源】\n`;
  properties.forEach((prop, index) => {
    const price = prop.list_price || prop.final_price;
    prompt += `${index + 1}. ${prop.property_code} - ${prop.building_number}${prop.unit_number}${prop.room_number}\n`;
    prompt += `   面积: ${prop.floor_area}㎡ | 价格: ${price?.toLocaleString('zh-CN')}元\n`;
    if (prop.property_type.zh) {
      prompt += `   户型: ${prop.property_type.zh}\n`;
    }
    if (prop.features && prop.features.length > 0) {
      const features = Array.isArray(prop.features)
        ? prop.features.map((f: any) => (typeof f === 'string' ? f : f.zh || f.ug)).join(', ')
        : '';
      prompt += `   特征: ${features}\n`;
    }
    prompt += '\n';
  });

  prompt += `【任务】\n`;
  prompt += `请根据客户预算和偏好，从以上房源中选出最匹配的3套，并按适合度排序。\n\n`;
  prompt += `【输出格式】\n`;
  prompt += `返回JSON数组，每个对象包含：\n`;
  prompt += `- property_id: 房源ID\n`;
  prompt += `- score: 0-1之间的适合度分数（四舍五入到小数点后2位）\n`;
  prompt += `- reasons_zh: 推荐理由数组，每条不超过50字，用中文\n\n`;
  prompt += `格式示例：[\n`;
  prompt += `  {"property_id": "prop-1", "score": 0.95, "reasons_zh": ["完全在预算范围内", "户型符合需求"]}\n`;
  prompt += `]\n`;

  return prompt;
}

/**
 * 调用 AI API 进行推荐
 */
async function callAIRecommendation(prompt: string): Promise<Array<{ property_id: string; score: number; reasons_zh: string[] }>> {
  const apiKey = Deno.env.get('NVIDIA_NIM_API_KEY') || Deno.env.get('NVIDIA_API_KEY');

  if (!apiKey) {
    console.log('No AI API key configured, using mock recommendations');
    return [];
  }

  try {
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: Deno.env.get('RECOMMENDATION_MODEL') || 'nvidia/nemotron-3-super-120b-a12b',
        messages: [
          { role: 'system', content: '你是一位专业的房产销售顾问，擅长根据客户需求推荐合适的房源。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      console.log('AI API failed:', response.statusText);
      return [];
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || '';

    // Extract JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.log('No valid JSON in AI response');
      return [];
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (e) {
      console.log('Failed to parse AI response:', e);
    }

    return [];
  } catch (error) {
    console.log('AI API error:', String(error));
    return [];
  }
}

/**
 * 计算推荐分数（简化版，当 API 不可用时使用）
 */
function calculateRecommendationScores(
  customer: Customer,
  properties: Property[]
): RecommendationScore[] {
  const budgetMin = customer.budget_range_min || 0;
  const budgetMax = customer.budget_range_max || 999999999;

  const scoredProperties = properties
    .map((prop) => {
      const price = prop.list_price || prop.final_price || 0;

      // Check if in budget
      if (price < budgetMin || price > budgetMax) {
        return null;
      }

      let score = 50; // Base score

      // Budget match score
      const midBudget = (budgetMin + budgetMax) / 2;
      if (price <= midBudget) {
        score += 20; // Well under max budget
      } else if (price <= budgetMax * 0.9) {
        score += 15;
      }

      // Property type match
      if (customer.interested_property_type && prop.property_type.zh?.includes(customer.interested_property_type)) {
        score += 20;
      } else if (!customer.interested_property_type) {
        score += 10; // No specific preference
      }

      // Features bonus
      const features = Array.isArray(prop.features)
        ? prop.features.map((f: any) => (typeof f === 'string' ? f : f.zh || f.ug)).join('')
        : '';
      if (features.includes('学区') && customer.notes?.includes('小孩')) {
        score += 10;
      }
      if (features.includes('地铁')) {
        score += 5;
      }

      // Convert to 0-1 scale
      const finalScore = Math.min(score, 100) / 100;

      return {
        property_id: prop.id,
        score: parseFloat(finalScore.toFixed(2)),
        reasons_zh: generateReasons(prop, customer, price),
        rank: 0
      };
    })
    .filter(Boolean) as RecommendationScore[];

  // Sort by score descending and assign ranks
  scoredProperties.sort((a, b) => b.score - a.score);
  scoredProperties.forEach((prop, index) => {
    prop.rank = index + 1;
  });

  return scoredProperties.slice(0, 3); // Return top 3
}

/**
 * Generate recommendation reasons
 */
function generateReasons(
  property: Property,
  customer: Customer,
  price: number
): string[] {
  const reasons: string[] = [];

  if (price <= (customer.budget_range_max || Infinity) * 0.8) {
    reasons.push('价格在预算范围内');
  }

  if (property.floor_area >= 90) {
    reasons.push('面积宽敞舒适');
  }

  if (property.features.some((f: any) => typeof f === 'string' && f.includes('学区'))) {
    if (customer.notes?.includes('小孩') || customer.interested_property_type?.includes('三室')) {
      reasons.push('优质学区房');
    }
  }

  if (!reasons.length) {
    reasons.push('综合性价比高');
  }

  return reasons;
}

/**
 * Save recommendation to database
 */
async function saveRecommendation(
  supabase: any,
  customerId: string,
  salesAgentId: string,
  scores: RecommendationScore[],
  aiModel: string
): Promise<string> {
  const { data, error } = await supabase
    .from('property_recommendations')
    .insert({
      customer_id: customerId,
      sales_agent_id: salesAgentId,
      customer_budget_min: MOCK_CUSTOMERS[customerId]?.budget_range_min || null,
      customer_budget_max: MOCK_CUSTOMERS[customerId]?.budget_range_max || null,
      recommended_property_ids: scores.map(s => s.property_id),
      recommendation_scores: {
        zh: scores.map(s => ({ property_id: s.property_id, score: s.score, reasons: s.reasons_zh })),
        ug: scores.map(s => ({ property_id: s.property_id, score: s.score, reasons: [] }))
      },
      ai_model: aiModel
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to save recommendation:', error);
    return '';
  }

  return data.id;
}

// ============================================================================
// Main Handler
// ============================================================================

async function generateRecommendations(request: RecommendationRequest): Promise<RecommendationResponse> {
  const { customer_id, sales_agent_id, model = 'nvidia/nemotron-3-super-120b-a12b' } = request;

  // Validate inputs
  if (!customer_id || !sales_agent_id) {
    throw new ValidationError('customer_id and sales_agent_id are required');
  }

  // Get customer data
  const customer = MOCK_CUSTOMERS[customer_id] || MOCK_CUSTOMERS['cust-1']; // Fallback to first customer

  // Filter properties by budget
  const budgetMin = customer.budget_range_min || 0;
  const budgetMax = customer.budget_range_max || 999999999;

  const propertiesInBudget = MOCK_PROPERTIES.filter(p => {
    const price = p.list_price || p.final_price || 0;
    return price >= budgetMin && price <= budgetMax;
  });

  if (propertiesInBudget.length === 0) {
    // Return empty recommendations
    return successResponse({
      recommendation_id: '',
      customer_id,
      scores: [],
      total_properties_evaluated: MOCK_PROPERTIES.length,
      ai_model: model,
      timestamp: new Date().toISOString()
    });
  }

  // Build prompt and call AI
  const prompt = buildRecommendationPrompt(customer, propertiesInBudget);
  let scores = await callAIRecommendation(prompt);

  if (!scores || scores.length === 0) {
    console.log('Using mock recommendations');
    scores = calculateRecommendationScores(customer, MOCK_PROPERTIES);
  }

  // Save to database
  const supabase = { from: () => ({ insert: () => ({ select: () => ({ single: async () => ({ data: { id: 'rec-123' }, error: null }) }) }) }) };
  const recommendationId = await saveRecommendation(supabase, customer_id, sales_agent_id, scores, model);

  return successResponse({
    recommendation_id: recommendationId,
    customer_id,
    scores,
    total_properties_evaluated: MOCK_PROPERTIES.length,
    ai_model: model,
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

    const body: RecommendationRequest = await req.json();
    return await generateRecommendations(body);
  } catch (error) {
    return errorResponse(error);
  }
});
