/**
 * オブジェクト内のプレースホルダー（{{KEY}}）を指定された値で置換する
 */
export function replacePlaceholders<T>(obj: T, replacements: Record<string, string>): T {
  if (typeof obj === 'string') {
    let result = obj;
    for (const [key, value] of Object.entries(replacements)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return result as any;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => replacePlaceholders(item, replacements)) as any;
  }
  if (typeof obj === 'object' && obj !== null) {
    const newObj: Record<string, unknown> = {};
    const record = obj as Record<string, unknown>;
    for (const key in record) {
      newObj[key] = replacePlaceholders(record[key], replacements);
    }
    return newObj as any;
  }
  return obj;
}
