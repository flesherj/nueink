export interface YNABBudget {
  id: string;
  name: string;
  last_modified_on: string;
  first_month: string;
  last_month: string;
  date_format: {
    format: string;
  };
  currency_format: {
    iso_code: string;
    example_format: string;
    decimal_digits: number;
    decimal_separator: string;
    symbol_first: boolean;
    group_separator: string;
    currency_symbol: string;
    display_symbol: boolean;
  };
}

export interface YNABAccount {
  id: string;
  name: string;
  type: string;
  on_budget: boolean;
  closed: boolean;
  note: string | null;
  balance: number; // in milliunits
  cleared_balance: number;
  uncleared_balance: number;
  transfer_payee_id: string;
  deleted: boolean;
}

export interface YNABTransaction {
  id: string;
  date: string;
  amount: number; // in milliunits
  memo: string | null;
  cleared: string;
  approved: boolean;
  flag_color: string | null;
  account_id: string;
  account_name: string;
  payee_id: string | null;
  payee_name: string | null;
  category_id: string | null;
  category_name: string | null;
  transfer_account_id: string | null;
  transfer_transaction_id: string | null;
  matched_transaction_id: string | null;
  import_id: string | null;
  deleted: boolean;
}

export interface YNABCategory {
  id: string;
  category_group_id: string;
  name: string;
  hidden: boolean;
  original_category_group_id: string | null;
  note: string | null;
  budgeted: number;
  activity: number;
  balance: number;
  goal_type: string | null;
  goal_creation_month: string | null;
  goal_target: number;
  goal_target_month: string | null;
  goal_percentage_complete: number | null;
  deleted: boolean;
}

export interface YNABCategoryGroup {
  id: string;
  name: string;
  hidden: boolean;
  deleted: boolean;
  categories: YNABCategory[];
}

export interface AccountSummary {
  name: string;
  balance: number; // in dollars
  type: string;
}
