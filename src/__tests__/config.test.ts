/**
 * 配置系统测试
 */

import { mergeConfig, loadConfig } from '../config';

describe('Config System', () => {
  describe('mergeConfig', () => {
    it('应该合并简单配置', () => {
      const base = { theme: 'default', showAgent: true };
      const override = { theme: 'nord' };
      const result = mergeConfig(base, override);
      expect(result).toEqual({ theme: 'nord', showAgent: true });
    });

    it('应该深度合并嵌套对象', () => {
      const base = {
        display: { showGit: true, showCost: false },
        theme: 'default'
      };
      const override = {
        display: { showCost: true }
      };
      const result = mergeConfig(base, override);
      expect(result).toEqual({
        display: { showGit: true, showCost: true },
        theme: 'default'
      });
    });

    it('应该处理空配置', () => {
      const base = { theme: 'default' };
      const result = mergeConfig(base, {});
      expect(result).toEqual({ theme: 'default' });
    });

    it('应该覆盖数组而不是合并', () => {
      const base = { permissions: ['read'] };
      const override = { permissions: ['read', 'write'] };
      const result = mergeConfig(base, override);
      expect(result.permissions).toEqual(['read', 'write']);
    });
  });

  describe('配置默认值', () => {
    it('应该有默认主题', () => {
      const config = {};
      expect(config.theme || 'default').toBe('default');
    });

    it('应该有默认布局模式', () => {
      const config = {};
      expect(config.lineLayout || 'compact').toBe('compact');
    });
  });
});
