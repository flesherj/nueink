/**
 * Test helpers and mock utilities for repository tests
 */

/**
 * Create a mock Amplify GraphQL client
 */
export const createMockDbClient = () => {
  return {
    models: {
      Account: {
        get: jest.fn(),
        list: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        listAccountByEmail: jest.fn(),
        listAccountByUsername: jest.fn(),
      },
      Organization: {
        get: jest.fn(),
        list: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        listOrganizationByParentOrgId: jest.fn(),
        listOrganizationByName: jest.fn(),
      },
      Membership: {
        get: jest.fn(),
        list: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        listMembershipByOrgId: jest.fn(),
      },
      Institution: {
        get: jest.fn(),
        list: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        listInstitutionByOrganizationId: jest.fn(),
        listInstitutionByExternalItemId: jest.fn(),
      },
      FinancialAccount: {
        get: jest.fn(),
        list: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        listFinancialAccountByOrganizationId: jest.fn(),
        listFinancialAccountByInstitutionId: jest.fn(),
        listFinancialAccountByExternalAccountId: jest.fn(),
      },
      Transaction: {
        get: jest.fn(),
        list: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        listTransactionByOrganizationIdAndDate: jest.fn(),
        listTransactionByFinancialAccountIdAndDate: jest.fn(),
        listTransactionByPersonIdAndDate: jest.fn(),
        listTransactionByExternalTransactionId: jest.fn(),
      },
      Comment: {
        get: jest.fn(),
        list: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        listCommentByTransactionIdAndCreatedAt: jest.fn(),
        listCommentByOrganizationIdAndCreatedAt: jest.fn(),
      },
      Person: {
        get: jest.fn(),
        list: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        listPersonByOrganizationId: jest.fn(),
      },
      Budget: {
        get: jest.fn(),
        list: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        listBudgetByOrganizationId: jest.fn(),
      },
      Debt: {
        get: jest.fn(),
        list: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        listDebtByOrganizationId: jest.fn(),
      },
    },
  };
};

/**
 * Create a mock Amplify response
 */
export const createMockResponse = <T>(data: T | null, nextToken?: string) => {
  return {
    data,
    errors: [],
    nextToken: nextToken || null,
  };
};

/**
 * Create a mock Amplify list response
 */
export const createMockListResponse = <T>(
  data: T[],
  nextToken?: string
) => {
  return {
    data,
    errors: [],
    nextToken: nextToken || null,
  };
};
