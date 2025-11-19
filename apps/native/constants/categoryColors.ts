import { getCategoryMetadata, type TransactionCategory } from '@nueink/core';

/**
 * Category color schemes for visual consistency across the app
 * Each category has a unique color identity with:
 * - handleColor: Inner fill of the drag handle and progress ring
 * - handleStrokeColor: Outer stroke of the drag handle
 */

export interface CategoryColorScheme {
  handleColor: string;
  handleStrokeColor: string;
  progressColor: string;
}

/**
 * Group-level color schemes
 * Each group has a primary and accent color for visual consistency
 */
const GROUP_COLOR_SCHEMES: Record<string, CategoryColorScheme> = {
  // Housing - Green tones
  'Housing': {
    handleColor: '#10B981', // Emerald
    handleStrokeColor: '#D1FAE5', // Mint
    progressColor: '#10B981',
  },

  // Transportation - Blue tones
  'Transportation': {
    handleColor: '#06B6D4', // Cyan
    handleStrokeColor: '#FFFFFF', // White
    progressColor: '#06B6D4',
  },

  // Food - Orange tones
  'Food': {
    handleColor: '#FB923C', // Orange
    handleStrokeColor: '#FED7AA', // Light peach
    progressColor: '#FB923C',
  },

  // Healthcare - Pink/Red tones
  'Healthcare': {
    handleColor: '#EC4899', // Pink
    handleStrokeColor: '#FFFFFF', // White
    progressColor: '#EC4899',
  },

  // Personal - Purple tones
  'Personal': {
    handleColor: '#A855F7', // Purple
    handleStrokeColor: '#E9D5FF', // Light purple
    progressColor: '#A855F7',
  },

  // Entertainment - Red tones
  'Entertainment': {
    handleColor: '#EF4444', // Red
    handleStrokeColor: '#FECACA', // Light red
    progressColor: '#EF4444',
  },

  // Shopping - Cyan tones
  'Shopping': {
    handleColor: '#14B8A6', // Teal
    handleStrokeColor: '#99F6E4', // Light teal
    progressColor: '#14B8A6',
  },

  // Bills - Gray/Blue tones
  'Bills': {
    handleColor: '#67E8F9', // Light cyan
    handleStrokeColor: '#0E7490', // Dark cyan
    progressColor: '#67E8F9',
  },

  // Kids - Yellow tones
  'Kids': {
    handleColor: '#F59E0B', // Amber
    handleStrokeColor: '#FEF3C7', // Light yellow
    progressColor: '#F59E0B',
  },

  // Pets - Brown tones
  'Pets': {
    handleColor: '#92400E', // Brown
    handleStrokeColor: '#FEF3C7', // Light yellow
    progressColor: '#92400E',
  },

  // Fees - Gray tones
  'Fees': {
    handleColor: '#6B7280', // Gray
    handleStrokeColor: '#E5E7EB', // Light gray
    progressColor: '#6B7280',
  },

  // Charity - Warm red
  'Charity': {
    handleColor: '#DC2626', // Red
    handleStrokeColor: '#FEE2E2', // Light red
    progressColor: '#DC2626',
  },

  // Business - Blue
  'Business': {
    handleColor: '#3B82F6', // Blue
    handleStrokeColor: '#DBEAFE', // Light blue
    progressColor: '#3B82F6',
  },

  // Transfer - Purple
  'Transfer': {
    handleColor: '#8B5CF6', // Violet
    handleStrokeColor: '#EDE9FE', // Light violet
    progressColor: '#8B5CF6',
  },

  // Income - Green (positive)
  'Income': {
    handleColor: '#22C55E', // Green
    handleStrokeColor: '#FFFFFF', // White
    progressColor: '#22C55E',
  },

  // Other/Default
  'Other': {
    handleColor: '#9CA3AF', // Medium gray
    handleStrokeColor: '#F3F4F6', // Very light gray
    progressColor: '#9CA3AF',
  },
};

/**
 * Get color scheme for a category
 * Uses the group-level color scheme from CATEGORY_METADATA
 */
export const getCategoryColorScheme = (category: string): CategoryColorScheme => {
  // Default fallback
  const defaultScheme: CategoryColorScheme = {
    handleColor: '#6750A4',
    handleStrokeColor: '#FFFFFF',
    progressColor: '#6750A4',
  };

  // Try to get metadata from core package
  try {
    const metadata = getCategoryMetadata(category as TransactionCategory);
    if (metadata) {
      // Use group-level color scheme
      return GROUP_COLOR_SCHEMES[metadata.group] || defaultScheme;
    }
  } catch (error) {
    // Category not found in metadata, fall through to default
  }

  // Special handling for 'Uncategorized'
  if (category === 'Uncategorized') {
    return GROUP_COLOR_SCHEMES['Other'];
  }

  return defaultScheme;
};

/**
 * Get emoji for a category (uses metadata from core package)
 */
export const getCategoryEmoji = (category: string): string => {
  // Try to get emoji from core metadata
  try {
    const metadata = getCategoryMetadata(category as TransactionCategory);
    if (metadata && metadata.emoji) {
      return metadata.emoji;
    }
  } catch (error) {
    // Category not found, use default
  }

  // Fallback for Uncategorized
  if (category === 'Uncategorized') {
    return '❓';
  }

  return '📌'; // Default fallback
};
