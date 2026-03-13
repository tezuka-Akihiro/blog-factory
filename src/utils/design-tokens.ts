/**
 * Semantic Design Tokens for Reports
 */
export const DESIGN_TOKENS = {
  // Colors
  COLOR_PRIMARY: '#001f3f',
  COLOR_TEXT_BASE: '#333333',
  COLOR_TEXT_MUTED: '#666666',
  COLOR_TEXT_SUBTLE: '#999999',
  COLOR_BG_BASE: '#f3f4f6',
  COLOR_BG_WHITE: '#ffffff',
  COLOR_BG_HIGHLIGHT: '#f0f4ff',
  COLOR_BG_ALT: '#f8faff',
  COLOR_BORDER_DEFAULT: '#eeeeee',
  COLOR_BORDER_MUTED: '#cccccc',
  COLOR_BORDER_STRONG: '#aaaaaa',
  COLOR_BORDER_PRIMARY: '#001f3f',
  COLOR_ACCENT_BLUE_BASE: '#3b82f6',
  COLOR_ACCENT_BLUE_DARK: '#1d4ed8',

  // Font Sizes
  FONT_SIZE_MINI: '8pt',
  FONT_SIZE_TINY: '9pt',
  FONT_SIZE_TINY_PLUS: '9.5pt',
  FONT_SIZE_XS: '10pt',
  FONT_SIZE_SMALL: '11pt',
  FONT_SIZE_BASE: '12pt',
  FONT_SIZE_LARGE: '13pt',
  FONT_SIZE_MEDIUM: '14pt',
  FONT_SIZE_XL: '15pt',
  FONT_SIZE_TITLE_INNER: '16pt', // Used for some internal titles
  FONT_SIZE_XXL: '18pt',
  FONT_SIZE_XXXL: '24pt',
  FONT_SIZE_GIGA: '28pt',
  FONT_SIZE_MEGA: '30pt',

  // Spacing & Dimensions
  SPACING_PAGE_PADDING_V: '10mm',
  SPACING_PAGE_PADDING_H: '15mm',
  SPACING_GAP_DEFAULT: '20px',
  SPACING_GAP_SMALL: '10px',
  SPACING_GAP_TINY: '4px',
  SPACING_BASE: '8px',
  SPACING_S: '4px',
  SPACING_M: '12px',
  SPACING_L: '16px',

  // Border Widths
  BORDER_WIDTH_THIN: '1px',
  BORDER_WIDTH_MEDIUM: '2px',
  BORDER_WIDTH_THICK: '3px',

  // Specific dimensions
  RADIUS_SMALL: '20px',
  RADIUS_MEDIUM: '30px',

  // Remaining specific values
  SPACING_CONTENT_TOP: '5px',
  SPACING_MEMO_GAP: '150px',
  SPACING_FOOTER_BOTTOM: '5mm',
  SPACING_PAGE_GAP: '25px',
  SPACING_GRID_GAP: '30px',

  // Misc
  SPACING_STAGE_GAP: '6px',
  SPACING_STAGE_TITLE_LEFT: '10px',
  SPACING_SECTION_TITLE_LEFT: '15px',
  SPACING_BOX_PADDING: '10px',
  SPACING_BADGE_PADDING_H: '12px',
  SPACING_BADGE_PADDING_V: '4px',
  SPACING_MEMO_MARGIN_TOP: '10px',
  SPACING_ITEM_MIN_HEIGHT: '40px',
  SPACING_PAGE_BOTTOM_MARGIN: '8mm',
  SPACING_LAYOUT_TOP_PADDING: '14px',
} as const;

export type DesignTokenKey = keyof typeof DESIGN_TOKENS;

/**
 * Converts token keys to CSS variable names
 * e.g. COLOR_PRIMARY -> --color-primary
 */
export function toCssVariableName(key: string): string {
  return `--${key.toLowerCase().replace(/_/g, '-')}`;
}
