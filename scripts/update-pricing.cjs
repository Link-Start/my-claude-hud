/**
 * 定价更新脚本 - 自动获取最新 Claude API 定价
 * 用法: node scripts/update-pricing.cjs [--check-only] [--dry-run]
 * 
 * --check-only: 只检查定价是否有更新，不写入文件
 * --dry-run: 模拟运行，显示会做什么但不实际修改
 */

const { readFileSync, writeFileSync, existsSync } = require('fs');
const { join } = require('path');
const path = process.cwd();
const ROOT_DIR = path;
const COST_ESTIMATOR_PATH = join(ROOT_DIR, 'src/cost-estimator.ts');

// Anthropic 定价页面
const PRICING_URL = 'https://docs.anthropic.com/en/docs/about-claude/pricing';

/**
 * 从 Anthropic 网站获取定价
 * 注意：由于网页解析可能不稳定，这里使用已知的最新定价作为后备
 */
async function fetchPricing() {
  console.log('📡 正在从 Anthropic 获取最新定价...');
  
  try {
    const response = await fetch(PRICING_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch pricing: ${response.status}`);
    }
    
    const html = await response.text();
    
    // 尝试从页面提取定价信息
    // Claude API 定价格式: $X.XX per 1M input/output tokens
    
    // 查找 Opus 定价
    const opusMatch = html.match(/Opus.*?\$([\d.]+).*?\$([\d.]+)/i);
    // 查找 Sonnet 定价  
    const sonnetMatch = html.match(/Sonnet.*?\$([\d.]+).*?\$([\d.]+)/i);
    // 查找 Haiku 定价
    const haikuMatch = html.match(/Haiku.*?\$([\d.]+).*?\$([\d.]+)/i);
    
    const pricing = {
      opus: { inputPricePer1k: 0, outputPricePer1k: 0 },
      sonnet: { inputPricePer1k: 0, outputPricePer1k: 0 },
      haiku: { inputPricePer1k: 0, outputPricePer1k: 0 },
    };
    
    if (opusMatch) {
      pricing.opus.inputPricePer1k = parseFloat(opusMatch[1]) / 1000;
      pricing.opus.outputPricePer1k = parseFloat(opusMatch[2]) / 1000;
    }
    if (sonnetMatch) {
      pricing.sonnet.inputPricePer1k = parseFloat(sonnetMatch[1]) / 1000;
      pricing.sonnet.outputPricePer1k = parseFloat(sonnetMatch[2]) / 1000;
    }
    if (haikuMatch) {
      pricing.haiku.inputPricePer1k = parseFloat(haikuMatch[1]) / 1000;
      pricing.haiku.outputPricePer1k = parseFloat(haikuMatch[2]) / 1000;
    }
    
    // 如果解析成功，返回定价
    if (pricing.opus.inputPricePer1k > 0) {
      console.log('✅ 成功从网页解析定价');
      return pricing;
    }
    
    throw new Error('无法解析定价');
    
  } catch (error) {
    console.log('⚠️ 无法从网页获取定价，使用内置最新定价作为后备');
    console.log('   错误:', error.message);
    
    // 使用已知的 2026 年最新定价
    return {
      opus: { inputPricePer1k: 0.005, outputPricePer1k: 0.025 },
      sonnet: { inputPricePer1k: 0.003, outputPricePer1k: 0.015 },
      haiku: { inputPricePer1k: 0.001, outputPricePer1k: 0.005 },
    };
  }
}

/**
 * 读取当前的定价配置
 */
function readCurrentPricing() {
  if (!existsSync(COST_ESTIMATOR_PATH)) {
    throw new Error(`File not found: ${COST_ESTIMATOR_PATH}`);
  }
  return readFileSync(COST_ESTIMATOR_PATH, 'utf-8');
}

/**
 * 生成新的定价配置
 */
function generatePricingConfig(pricing) {
  const date = new Date().toISOString().split('T')[0];
  return `// 定价数据（自动更新于 ${date}）
// 来源: ${PRICING_URL}

const PRICING: Record<string, ModelPricing> = {
  // Claude 4.6 系列 (最新)
  'claude-opus-4-6-20251120': {
    inputPricePer1k: ${pricing.opus.inputPricePer1k},
    outputPricePer1k: ${pricing.opus.outputPricePer1k},
  },
  'claude-opus-4-6': {
    inputPricePer1k: ${pricing.opus.inputPricePer1k},
    outputPricePer1k: ${pricing.opus.outputPricePer1k},
  },
  'claude-opus-4': {
    inputPricePer1k: ${pricing.opus.inputPricePer1k},
    outputPricePer1k: ${pricing.opus.outputPricePer1k},
  },

  // Claude Sonnet 4.6
  'claude-sonnet-4-6-20251120': {
    inputPricePer1k: ${pricing.sonnet.inputPricePer1k},
    outputPricePer1k: ${pricing.sonnet.outputPricePer1k},
  },
  'claude-sonnet-4-6': {
    inputPricePer1k: ${pricing.sonnet.inputPricePer1k},
    outputPricePer1k: ${pricing.sonnet.outputPricePer1k},
  },
  'claude-sonnet-4': {
    inputPricePer1k: ${pricing.sonnet.inputPricePer1k},
    outputPricePer1k: ${pricing.sonnet.outputPricePer1k},
  },

  // Claude Haiku 4.5
  'claude-haiku-4-5-20250514': {
    inputPricePer1k: ${pricing.haiku.inputPricePer1k},
    outputPricePer1k: ${pricing.haiku.outputPricePer1k},
  },
  'claude-haiku-4-5': {
    inputPricePer1k: ${pricing.haiku.inputPricePer1k},
    outputPricePer1k: ${pricing.haiku.outputPricePer1k},
  },
  'claude-haiku-4': {
    inputPricePer1k: ${pricing.haiku.inputPricePer1k},
    outputPricePer1k: ${pricing.haiku.outputPricePer1k},
  },

  // Claude 3.5 系列 (旧版)
  'claude-3-5-sonnet-20241022': {
    inputPricePer1k: 0.003,
    outputPricePer1k: 0.015,
  },
  'claude-3-5-haiku-20250514': {
    inputPricePer1k: 0.0008,
    outputPricePer1k: 0.004,
  },
};`;
}

/**
 * 检查定价是否有变化
 */
function checkPricingChanges(currentContent, newContent) {
  // 提取当前文件中的定价数值
  const opusMatch = currentContent.match(/claude-opus-4-6['"]:\s*\{[^}]*inputPricePer1k:\s*([\d.]+)/);
  const sonnetMatch = currentContent.match(/claude-sonnet-4-6['"]:\s*\{[^}]*inputPricePer1k:\s*([\d.]+)/);
  const haikuMatch = currentContent.match(/claude-haiku-4-5['"]:\s*\{[^}]*inputPricePer1k:\s*([\d.]+)/);
  
  const newPricingMatch = newContent.match(/'claude-opus-4-6['"]:\s*\{[^}]*inputPricePer1k:\s*([\d.]+)/);
  
  if (!opusMatch || !sonnetMatch || !haikuMatch || !newPricingMatch) {
    console.log('⚠️ 无法解析定价数据');
    return false;
  }
  
  // 比较数值是否相同
  const currentOpus = opusMatch[1];
  const newOpus = newPricingMatch[1];
  
  return currentOpus !== newOpus;
}

/**
 * 更新定价文件
 */
function updatePricingFile(newConfig) {
  const content = readCurrentPricing();
  
  const newContent = content.replace(
    /\/\/ 定价[^\n]*\n[\s\S]*?const PRICING: Record<string, ModelPricing> = \{[\s\S]*?\};/,
    newConfig
  );
  
  writeFileSync(COST_ESTIMATOR_PATH, newContent, 'utf-8');
  console.log('✅ 定价已更新');
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  const checkOnly = args.includes('--check-only');
  const dryRun = args.includes('--dry-run');
  
  console.log('🔍 Claude API 定价检查工具');
  console.log('==========================\n');
  
  try {
    const newPricing = await fetchPricing();
    
    console.log('\n📊 获取到的定价:');
    console.log(`  Opus:   $${newPricing.opus.inputPricePer1k} / $${newPricing.opus.outputPricePer1k} (per 1k tokens)`);
    console.log(`  Sonnet: $${newPricing.sonnet.inputPricePer1k} / $${newPricing.sonnet.outputPricePer1k} (per 1k tokens)`);
    console.log(`  Haiku:  $${newPricing.haiku.inputPricePer1k} / $${newPricing.haiku.outputPricePer1k} (per 1k tokens)`);
    
    if (checkOnly) {
      console.log('\n🔍 --check-only 模式: 只检查不写入');
      const currentContent = readCurrentPricing();
      const newConfig = generatePricingConfig(newPricing);
      const hasChanges = checkPricingChanges(currentContent, newConfig);
      
      if (hasChanges) {
        console.log('⚠️ 定价有变化！需要更新。');
        process.exit(1);
      } else {
        console.log('✅ 定价已是最新');
        process.exit(0);
      }
    }
    
    if (dryRun) {
      console.log('\n🔍 --dry-run 模式: 模拟运行不实际修改');
      const currentContent = readCurrentPricing();
      const newConfig = generatePricingConfig(newPricing);
      const hasChanges = checkPricingChanges(currentContent, newConfig);
      
      if (hasChanges) {
        console.log('\n📝 会进行以下更改:');
        console.log(newConfig);
      } else {
        console.log('✅ 定价已是最新，无需更改');
      }
      return;
    }
    
    const currentContent = readCurrentPricing();
    const newConfig = generatePricingConfig(newPricing);
    const hasChanges = checkPricingChanges(currentContent, newConfig);
    
    if (hasChanges) {
      console.log('\n📝 定价有变化，正在更新...');
      updatePricingFile(newConfig);
    } else {
      console.log('\n✅ 定价已是最新，无需更新');
    }
    
  } catch (error) {
    console.error('❌ 错误:', error);
    process.exit(1);
  }
}

main();