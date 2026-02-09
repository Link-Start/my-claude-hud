/**
 * 成本估算测试
 */

import { calculateCost } from '../cost-estimator';

describe('Cost Estimator', () => {
  describe('calculateCost', () => {
    const pricing = {
      input: 3.0,  // $3 per million tokens
      output: 15.0 // $15 per million tokens
    };

    it('应该计算零成本', () => {
      const cost = calculateCost(0, 0, pricing);
      expect(cost).toBe(0);
    });

    it('应该计算输入成本', () => {
      const cost = calculateCost(1000000, 0, pricing);
      expect(cost).toBe(3.0);
    });

    it('应该计算输出成本', () => {
      const cost = calculateCost(0, 1000000, pricing);
      expect(cost).toBe(15.0);
    });

    it('应该计算总成本', () => {
      const cost = calculateCost(1000000, 1000000, pricing);
      expect(cost).toBe(18.0);
    });

    it('应该处理小数token数', () => {
      const cost = calculateCost(500000, 500000, pricing);
      expect(cost).toBe(9.0);
    });

    it('应该格式化成本显示', () => {
      const cost1 = calculateCost(1000000, 0, pricing);
      expect(cost1).toBe('$3.00');

      const cost2 = calculateCost(100000, 50000, pricing);
      expect(cost2).toBeLessThan(1.5);
      expect(cost2).toBeGreaterThan(0);
    });
  });
});
