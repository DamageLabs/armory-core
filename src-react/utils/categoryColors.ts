/**
 * Generate a consistent color for a category name using HSL color space
 * This ensures categories always get the same color and works well in both light and dark themes
 */
export function getCategoryColor(categoryName: string, isDark = false): string {
  if (!categoryName) return isDark ? '#6b7280' : '#9ca3af'; // gray for empty categories

  // Simple hash function for consistent color generation
  let hash = 0;
  for (let i = 0; i < categoryName.length; i++) {
    const char = categoryName.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Generate HSL values
  const hue = Math.abs(hash) % 360; // Full color spectrum
  const saturation = isDark ? 60 : 70; // Slightly muted in dark mode for readability
  const lightness = isDark ? 55 : 45; // Lighter in dark mode, darker in light mode

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Get a lighter version of the category color for badges/backgrounds
 */
export function getCategoryColorLight(categoryName: string, isDark = false): string {
  if (!categoryName) return isDark ? '#374151' : '#f3f4f6'; // gray for empty categories

  // Simple hash function for consistent color generation
  let hash = 0;
  for (let i = 0; i < categoryName.length; i++) {
    const char = categoryName.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Generate HSL values for background
  const hue = Math.abs(hash) % 360;
  const saturation = isDark ? 30 : 40; // More muted for backgrounds
  const lightness = isDark ? 25 : 85; // Very dark in dark mode, very light in light mode

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}