import * as fs from 'fs/promises';
import * as path from 'path';
import { DESIGN_TOKENS } from './design-tokens';

/**
 * Design Lint Configuration
 */
interface LintConfig {
  /** Files to scan */
  include: string[];
  /** Patterns that are explicitly allowed (Whitelist) */
  allowedPatterns: RegExp[];
  /** Patterns that are explicitly forbidden (Blacklist) */
  forbiddenPatterns: RegExp[];
}

const CONFIG: LintConfig = {
  include: [
    'src/tasks/report-components.ts',
  ],
  allowedPatterns: [
    /297mm/, // A4 Width
    /210mm/, // A4 Height
    /10mm auto/, // Page margin
    /0 0 10px rgba\(0,0,0,0\.1\)/, // Box shadow
    /120mm/, // Circle box dimensions
    /0 var\(--spacing-base\)/,
    /0 var\(--spacing-s\)/,
    /0 8px/,
    /0 6px/,
    /0 2px/,
    /4px 12px/,
    /calc\(100% - 10px\)/,
    /3px 0/,
    /4px 0/,
    /0 4px/,
    /5px 4px/,
    /repeating-linear-gradient/,
    /12pt/, // Gradient spacing
    /13pt/, // Gradient spacing
  ],
  forbiddenPatterns: [
    /#[0-9a-fA-F]{3,6}/, // Hex colors
    /(?<!var\(--[a-z-]+\)\s*)\b[0-9]+(pt|px|mm|rem|em)\b/, // Physical units not inside var()
  ],
};

/**
 * Main Lint function
 */
export async function runDesignLint(): Promise<boolean> {
  // eslint-disable-next-line no-console
  console.log('🎨 Running Design Lint...');
  let hasError = false;

  const tokenValues = new Set(Object.values(DESIGN_TOKENS).map(v => String(v).toLowerCase()));

  for (const filePath of CONFIG.include) {
    const fullPath = path.resolve(process.cwd(), filePath);
    try {
      const content = await fs.readFile(fullPath, 'utf-8');

      // Simple scanner for forbidden patterns
      for (const pattern of CONFIG.forbiddenPatterns) {
        let match;
        const regex = new RegExp(pattern, 'g');
        while ((match = regex.exec(content)) !== null) {
          const matchedValue = match[0];

          // Check if it's a token value (allowed)
          if (tokenValues.has(matchedValue.toLowerCase())) {
            continue;
          }

          // Check if it's explicitly whitelisted
          const isWhitelisted = CONFIG.allowedPatterns.some(p => p.test(matchedValue));
          if (isWhitelisted) {
            continue;
          }

          // Check context for whitelist (e.g. "297mm" might be part of "width: 297mm")
          const contextStart = Math.max(0, match.index - 20);
          const contextEnd = Math.min(content.length, match.index + matchedValue.length + 20);
          const context = content.substring(contextStart, contextEnd);

          if (CONFIG.allowedPatterns.some(p => p.test(context))) {
            continue;
          }

          const line = content.substring(0, match.index).split('\n').length;
          // eslint-disable-next-line no-console
          console.error(`❌ Hardcoded value found in ${filePath}:${line} -> "${matchedValue}" (Context: ...${context.replace(/\n/g, ' ')}...)`);
          hasError = true;
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Error reading ${filePath}:`, error);
      hasError = true;
    }
  }

  if (!hasError) {
    // eslint-disable-next-line no-console
    console.log('✅ Design Lint passed!');
  }
  return !hasError;
}

// Run if called directly
if (require.main === module) {
  runDesignLint().then(success => {
    process.exit(success ? 0 : 1);
  });
}
