/* eslint-disable no-console */
export const Logger = {
  info: (message: string) => console.log(`🔍 ${message}`),
  extract: (message: string) => console.log(`📄 ${message}`),
  success: (message: string) => console.log(`✅ ${message}`),
  warn: (message: string) => console.warn(`⚠️ ${message}`),
  error: (message: string) => console.error(`💥 ${message}`),
};
