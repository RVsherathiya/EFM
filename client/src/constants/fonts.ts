/**
 * Typography & Font Family Constants
 * Excellent Web World - Enterprise Workforce & Appraisal Suite
 *
 * Single Source of Truth for all typography font stacks across the application.
 */

export const FONT_FAMILY = {
  primary: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  heading: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  brand: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
} as const;

export type FontFamilyKey = keyof typeof FONT_FAMILY;

/**
 * Dynamically injects typography CSS custom properties into document root
 * so that any CSS stylesheet can reference var(--font-primary), var(--font-heading), and var(--font-brand).
 */
export function injectTypographyVariables(): void {
  if (typeof document === 'undefined') return;

  // Set on documentElement directly
  const root = document.documentElement;
  root.style.setProperty('--font-primary', FONT_FAMILY.primary);
  root.style.setProperty('--font-heading', FONT_FAMILY.heading);
  root.style.setProperty('--font-brand', FONT_FAMILY.brand);

  // Also prepend style tag to head for maximum CSS engine compatibility
  if (typeof document.head !== 'undefined' && !document.getElementById('font-family-tokens')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'font-family-tokens';
    styleEl.textContent = `
:root {
  --font-primary: ${FONT_FAMILY.primary};
  --font-heading: ${FONT_FAMILY.heading};
  --font-brand: ${FONT_FAMILY.brand};
}
`;
    document.head.prepend(styleEl);
  }
}

// Auto-initialize immediately upon import
injectTypographyVariables();
