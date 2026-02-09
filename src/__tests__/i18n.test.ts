/**
 * i18n 测试
 */

import { t, setLanguage } from '../i18n';

describe('i18n', () => {
  beforeEach(() => {
    // 每次测试前重置为中文
    setLanguage('简体中文');
  });

  describe('中文翻译', () => {
    it('应该翻译基本术语', () => {
      expect(t('Model')).toBe('模型');
      expect(t('Context')).toBe('上下文');
      expect(t('Tools')).toBe('工具');
      expect(t('Agents')).toBe('代理');
      expect(t('Todos')).toBe('待办');
    });

    it('应该翻译状态信息', () => {
      expect(t('Running')).toBe('运行中');
      expect(t('Completed')).toBe('已完成');
      expect(t('Failed')).toBe('失败');
    });
  });

  describe('英文翻译', () => {
    it('应该切换到英文', () => {
      setLanguage('English');
      expect(t('Model')).toBe('Model');
      expect(t('Context')).toBe('Context');
      expect(t('Tools')).toBe('Tools');
    });

    it('应该翻译英文状态', () => {
      setLanguage('English');
      expect(t('Running')).toBe('Running');
      expect(t('Completed')).toBe('Completed');
      expect(t('Failed')).toBe('Failed');
    });
  });

  describe('回退机制', () => {
    it('未知翻译键应该返回原文', () => {
      const unknown = t('UnknownKey');
      expect(unknown).toBe('UnknownKey');
    });
  });
});
