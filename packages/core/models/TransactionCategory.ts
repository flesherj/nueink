/**
 * Standard Transaction Categories
 *
 * Comprehensive category system for financial transactions.
 * Designed for automatic AI categorization and budget insights.
 */

export type TransactionCategory =
  // Housing
  | 'Housing: Mortgage/Rent'
  | 'Housing: Utilities'
  | 'Housing: Insurance'
  | 'Housing: Maintenance'
  | 'Housing: Property Tax'

  // Transportation
  | 'Transportation: Car Payment'
  | 'Transportation: Gas/Fuel'
  | 'Transportation: Insurance'
  | 'Transportation: Maintenance'
  | 'Transportation: Public Transit'
  | 'Transportation: Parking'

  // Food
  | 'Food: Groceries'
  | 'Food: Restaurants'
  | 'Food: Coffee/Snacks'
  | 'Food: Delivery'

  // Healthcare
  | 'Healthcare: Insurance'
  | 'Healthcare: Doctor/Dentist'
  | 'Healthcare: Pharmacy'
  | 'Healthcare: Vision'

  // Personal
  | 'Personal: Clothing'
  | 'Personal: Hair/Beauty'
  | 'Personal: Fitness'
  | 'Personal: Subscriptions'

  // Entertainment
  | 'Entertainment: Streaming'
  | 'Entertainment: Movies/Events'
  | 'Entertainment: Hobbies'
  | 'Entertainment: Travel'

  // Shopping
  | 'Shopping: General'
  | 'Shopping: Electronics'
  | 'Shopping: Home Goods'
  | 'Shopping: Gifts'

  // Bills & Services
  | 'Bills: Phone'
  | 'Bills: Internet'
  | 'Bills: Credit Card Payment'
  | 'Bills: Loan Payment'
  | 'Bills: Insurance (Other)'

  // Kids & Pets
  | 'Kids: Childcare'
  | 'Kids: School'
  | 'Kids: Activities'
  | 'Pets: Food'
  | 'Pets: Veterinary'

  // Other
  | 'Fees: Bank/ATM'
  | 'Fees: Service'
  | 'Charity: Donations'
  | 'Business: Expenses'

  // Special Categories
  | 'Transfer: Between Accounts'
  | 'Income: Salary'
  | 'Income: Other'
  | 'Uncategorized';

/**
 * Category metadata for display and grouping
 */
export interface CategoryMetadata {
  category: TransactionCategory;
  group: string;
  emoji: string;
  color: string;
  description: string;
}

/**
 * All category definitions with metadata
 */
export const CATEGORY_METADATA: CategoryMetadata[] = [
  // Housing
  { category: 'Housing: Mortgage/Rent', group: 'Housing', emoji: '🏠', color: '#4CAF50', description: 'Mortgage or rent payments' },
  { category: 'Housing: Utilities', group: 'Housing', emoji: '💡', color: '#4CAF50', description: 'Electric, water, gas, trash' },
  { category: 'Housing: Insurance', group: 'Housing', emoji: '🛡️', color: '#4CAF50', description: 'Home or renters insurance' },
  { category: 'Housing: Maintenance', group: 'Housing', emoji: '🔧', color: '#4CAF50', description: 'Repairs, lawn care, cleaning' },
  { category: 'Housing: Property Tax', group: 'Housing', emoji: '🏛️', color: '#4CAF50', description: 'Property taxes' },

  // Transportation
  { category: 'Transportation: Car Payment', group: 'Transportation', emoji: '🚗', color: '#2196F3', description: 'Auto loan or lease' },
  { category: 'Transportation: Gas/Fuel', group: 'Transportation', emoji: '⛽', color: '#2196F3', description: 'Gas station purchases' },
  { category: 'Transportation: Insurance', group: 'Transportation', emoji: '🛡️', color: '#2196F3', description: 'Auto insurance' },
  { category: 'Transportation: Maintenance', group: 'Transportation', emoji: '🔧', color: '#2196F3', description: 'Oil changes, repairs, tires' },
  { category: 'Transportation: Public Transit', group: 'Transportation', emoji: '🚌', color: '#2196F3', description: 'Bus, train, subway, Uber, Lyft' },
  { category: 'Transportation: Parking', group: 'Transportation', emoji: '🅿️', color: '#2196F3', description: 'Parking fees and meters' },

  // Food
  { category: 'Food: Groceries', group: 'Food', emoji: '🛒', color: '#FF9800', description: 'Supermarket shopping' },
  { category: 'Food: Restaurants', group: 'Food', emoji: '🍽️', color: '#FF9800', description: 'Dining out' },
  { category: 'Food: Coffee/Snacks', group: 'Food', emoji: '☕', color: '#FF9800', description: 'Coffee shops, quick snacks' },
  { category: 'Food: Delivery', group: 'Food', emoji: '🚚', color: '#FF9800', description: 'Food delivery services' },

  // Healthcare
  { category: 'Healthcare: Insurance', group: 'Healthcare', emoji: '🏥', color: '#E91E63', description: 'Health insurance premiums' },
  { category: 'Healthcare: Doctor/Dentist', group: 'Healthcare', emoji: '⚕️', color: '#E91E63', description: 'Medical and dental visits' },
  { category: 'Healthcare: Pharmacy', group: 'Healthcare', emoji: '💊', color: '#E91E63', description: 'Prescriptions and medications' },
  { category: 'Healthcare: Vision', group: 'Healthcare', emoji: '👓', color: '#E91E63', description: 'Eye exams, glasses, contacts' },

  // Personal
  { category: 'Personal: Clothing', group: 'Personal', emoji: '👔', color: '#9C27B0', description: 'Clothes and shoes' },
  { category: 'Personal: Hair/Beauty', group: 'Personal', emoji: '💇', color: '#9C27B0', description: 'Haircuts, salon, cosmetics' },
  { category: 'Personal: Fitness', group: 'Personal', emoji: '💪', color: '#9C27B0', description: 'Gym, sports, fitness' },
  { category: 'Personal: Subscriptions', group: 'Personal', emoji: '📱', color: '#9C27B0', description: 'Personal subscriptions' },

  // Entertainment
  { category: 'Entertainment: Streaming', group: 'Entertainment', emoji: '📺', color: '#F44336', description: 'Netflix, Spotify, etc.' },
  { category: 'Entertainment: Movies/Events', group: 'Entertainment', emoji: '🎬', color: '#F44336', description: 'Movies, concerts, events' },
  { category: 'Entertainment: Hobbies', group: 'Entertainment', emoji: '🎨', color: '#F44336', description: 'Hobby supplies and activities' },
  { category: 'Entertainment: Travel', group: 'Entertainment', emoji: '✈️', color: '#F44336', description: 'Vacations and trips' },

  // Shopping
  { category: 'Shopping: General', group: 'Shopping', emoji: '🛍️', color: '#00BCD4', description: 'General retail' },
  { category: 'Shopping: Electronics', group: 'Shopping', emoji: '💻', color: '#00BCD4', description: 'Computers, phones, gadgets' },
  { category: 'Shopping: Home Goods', group: 'Shopping', emoji: '🏡', color: '#00BCD4', description: 'Furniture, decor, supplies' },
  { category: 'Shopping: Gifts', group: 'Shopping', emoji: '🎁', color: '#00BCD4', description: 'Presents for others' },

  // Bills
  { category: 'Bills: Phone', group: 'Bills', emoji: '📞', color: '#607D8B', description: 'Cell phone bill' },
  { category: 'Bills: Internet', group: 'Bills', emoji: '🌐', color: '#607D8B', description: 'Internet service' },
  { category: 'Bills: Credit Card Payment', group: 'Bills', emoji: '💳', color: '#607D8B', description: 'Credit card payments' },
  { category: 'Bills: Loan Payment', group: 'Bills', emoji: '🏦', color: '#607D8B', description: 'Personal or student loans' },
  { category: 'Bills: Insurance (Other)', group: 'Bills', emoji: '🛡️', color: '#607D8B', description: 'Life, disability, etc.' },

  // Kids & Pets
  { category: 'Kids: Childcare', group: 'Kids', emoji: '👶', color: '#FFEB3B', description: 'Daycare, babysitting' },
  { category: 'Kids: School', group: 'Kids', emoji: '🎒', color: '#FFEB3B', description: 'Tuition, supplies, lunch' },
  { category: 'Kids: Activities', group: 'Kids', emoji: '⚽', color: '#FFEB3B', description: 'Sports, lessons, activities' },
  { category: 'Pets: Food', group: 'Pets', emoji: '🐾', color: '#795548', description: 'Pet food and treats' },
  { category: 'Pets: Veterinary', group: 'Pets', emoji: '🐕', color: '#795548', description: 'Vet visits and care' },

  // Other
  { category: 'Fees: Bank/ATM', group: 'Fees', emoji: '🏧', color: '#9E9E9E', description: 'Bank and ATM fees' },
  { category: 'Fees: Service', group: 'Fees', emoji: '💰', color: '#9E9E9E', description: 'Service charges' },
  { category: 'Charity: Donations', group: 'Charity', emoji: '❤️', color: '#FF5722', description: 'Charitable giving' },
  { category: 'Business: Expenses', group: 'Business', emoji: '💼', color: '#3F51B5', description: 'Business-related expenses' },

  // Special Categories
  { category: 'Transfer: Between Accounts', group: 'Transfer', emoji: '🔄', color: '#9C27B0', description: 'Transfers between your accounts' },
  { category: 'Income: Salary', group: 'Income', emoji: '💵', color: '#4CAF50', description: 'Salary and wages' },
  { category: 'Income: Other', group: 'Income', emoji: '💰', color: '#4CAF50', description: 'Other income sources' },
  { category: 'Uncategorized', group: 'Other', emoji: '❓', color: '#757575', description: 'Uncategorized transactions' },
];

/**
 * Get category metadata by category name
 */
export const getCategoryMetadata = (category: TransactionCategory): CategoryMetadata => {
  return CATEGORY_METADATA.find(m => m.category === category) || CATEGORY_METADATA[CATEGORY_METADATA.length - 1];
};

/**
 * Get all categories in a group
 */
export const getCategoriesByGroup = (group: string): CategoryMetadata[] => {
  return CATEGORY_METADATA.filter(m => m.group === group);
};

/**
 * Get all unique groups
 */
export const getAllGroups = (): string[] => {
  return Array.from(new Set(CATEGORY_METADATA.map(m => m.group)));
};
