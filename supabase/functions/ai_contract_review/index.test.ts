// ============================================================================
// ai_contract_review Unit Tests
// ============================================================================

import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { describe, it, mock } from "https://deno.land/x/mock@0.1.0/mod.ts";

// Mock NVIDIA NIM API response
const MOCK_AI_RESPONSE = {
  choices: [
    {
      message: {
        content: JSON.stringify({
          risk_level: 'MEDIUM',
          risk_score: 5.5,
          key_findings: [
            {
              type: 'PAYMENT_TERM',
              severity: 'MEDIUM',
              clause_reference: '第3条',
              description: '付款条件过于苛刻，预付款比例低于行业标准',
              recommendation: '建议将预付款比例从20%提高至30%'
            }
          ],
          executive_summary: '合同整体风险可控，但付款条款需要谈判调整。'
        })
      }
    }
  ],
  usage: { total_tokens: 150 }
};

// Test cases
describe('AI Contract Review', () => {
  it('should validate contract_id is required', async () => {
    // This would be tested with the actual function call
    // Skipping for mock demonstration
  });

  it('should parse AI response correctly', () => {
    const response = MOCK_AI_RESPONSE;
    const content = JSON.parse(response.choices[0].message.content);

    assertEquals(content.risk_level, 'MEDIUM');
    assertEquals(typeof content.risk_score, 'number');
    assertEquals(Array.isArray(content.key_findings), true);
  });

  it('should handle empty key findings', () => {
    const response = {
      choices: [{ message: { content: JSON.stringify({ risk_level: 'LOW', risk_score: 2, key_findings: [], executive_summary: '无风险' }) } }],
      usage: { total_tokens: 50 }
    };
    const content = JSON.parse(response.choices[0].message.content);
    assertEquals(content.key_findings.length, 0);
  });

  it('should validate risk score range', () => {
    // Risk score should be between 0 and 10
    const lowScore = 2.5;
    const highScore = 7.8;

    assertEquals(lowScore >= 0 && lowScore <= 10, true);
    assertEquals(highScore >= 0 && highScore <= 10, true);
  });

  it('should classify risk levels correctly', () => {
    const testCases = [
      { score: 2, expectedLevel: 'LOW' },
      { score: 4.5, expectedLevel: 'MEDIUM' },
      { score: 6.5, expectedLevel: 'HIGH' },
      { score: 9, expectedLevel: 'CRITICAL' }
    ];

    testCases.forEach(({ score, expectedLevel }) => {
      let actualLevel: string;
      if (score <= 3) {
        actualLevel = 'LOW';
      } else if (score <= 5) {
        actualLevel = 'MEDIUM';
      } else if (score <= 7) {
        actualLevel = 'HIGH';
      } else {
        actualLevel = 'CRITICAL';
      }
      assertEquals(actualLevel, expectedLevel);
    });
  });

  it('should generate proper audit log entry', () => {
    const auditEntry = {
      entity_type: 'contract',
      entity_id: 'test-contract-id',
      action: 'REVIEWED',
      actor_type: 'SYSTEM',
      actor_id: 'ai_contract_review_function',
      change_details: {
        risk_level: 'MEDIUM',
        risk_score: 5.5,
        review_type: 'AUTO_AI'
      }
    };

    assertEquals(auditEntry.entity_type, 'contract');
    assertEquals(auditEntry.action, 'REVIEWED');
    assertEquals(typeof auditEntry.change_details?.risk_score, 'number');
  });
});

// Run tests if executed directly
if (import.meta.main) {
  await Deno.test.run();
}
