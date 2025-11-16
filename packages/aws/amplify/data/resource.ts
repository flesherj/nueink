import {type ClientSchema, a, defineData} from '@aws-amplify/backend';
import {postConfirmation} from '../auth/post-confirmation/resource';
import {financialConnect} from '../functions/financial/connect/resource';
import {financialSync} from '../functions/financial/sync/resource';
import {nueInkApi} from '../functions/api/resource';

const schema = a.schema({
        Account: a.model({
            accountId: a.id().required(),             // PK
            defaultOrgId: a.string().required(),
            email: a.string().required(),          // GSI(1)
            username: a.string().required(),       // GSI(2)
            firstName: a.string(),
            middleName: a.string(),
            lastName: a.string(),
            provider: a.string().required(),       // Tracks Account Auth Origin
            createdAt: a.datetime().required(),    // Date / Time the account was created
            status: a.string().required(),
            contact: a.ref('Contact'),
            profileOwner: a.string(),
            meta: a.customType({
                onboardCompleted: a.boolean()
            }),
        })
            .identifier(['accountId'])
            .authorization((allow) => [
                allow.ownerDefinedIn("profileOwner"),
                allow.publicApiKey().to(['create'])
            ])
            .secondaryIndexes(index => [index('email'), index('username')]),
        Organization: a.model({
            orgId: a.id().required(),
            name: a.string().required(),
            type: a.string().required(),
            parentOrgId: a.string(),
            createdByAccountId: a.string().required(),
            createdAt: a.datetime().required(),
            status: a.string().required(),
            profileOwner: a.string(),
            contact: a.ref('Contact'),
        })
            .identifier(['orgId'])
            .authorization((allow) => [
                allow.ownerDefinedIn("profileOwner"),
                allow.publicApiKey().to(['create'])
            ])
            .secondaryIndexes(index => [index('parentOrgId'), index('name')]),

        Membership: a.model({
            accountId: a.id().required(),
            orgId: a.id().required(),
            role: a.string().required(),
            status: a.string().required(),
            joinedAt: a.datetime().required(),
            profileOwner: a.string(),
        })
            .identifier(['accountId', 'orgId'])
            .authorization((allow) => [
                allow.ownerDefinedIn("profileOwner"),
                allow.publicApiKey().to(['create'])
            ])
            .secondaryIndexes(index => [index('orgId')]),
        Contact: a.customType({
            addresses: a.ref('Address').array(),
            phones: a.ref('Phone').array(),
            emails: a.ref('Email').array(),
            websites: a.ref('Website').array(),
        }),
        Address: a.customType({
            type: a.string(),
            line1: a.string(),
            line2: a.string(),
            city: a.string(),
            state: a.string(),
            zip: a.string(),
            country: a.string(),
        }),
        Phone: a.customType({
            type: a.string(),
            number: a.string(),
        }),
        Email: a.customType({
            type: a.string(),
            address: a.string(),
        }),
        Website: a.customType({
            type: a.string(),
            url: a.string(),
        }),

        // Financial Models
        Institution: a.model({
            institutionId: a.id().required(),
            organizationId: a.string().required(),      // FK to Organization
            provider: a.string().required(),            // plaid|ynab|manual
            externalId: a.string(),                     // Provider's institution ID
            externalItemId: a.string(),                 // Provider's item/connection ID
            name: a.string().required(),                // Institution name (e.g., "Chase")
            logo: a.string(),                           // Institution logo URL
            status: a.string().required(),              // active|disconnected|error
            lastSyncedAt: a.datetime(),                 // Last successful sync
            createdAt: a.datetime().required(),
            profileOwner: a.string(),
        })
            .identifier(['institutionId'])
            .authorization((allow) => [
                allow.ownerDefinedIn("profileOwner"),
                allow.publicApiKey()
            ])
            .secondaryIndexes(index => [
                index('organizationId'),
                index('externalItemId')
            ]),

        FinancialAccount: a.model({
            financialAccountId: a.id().required(),
            institutionId: a.string().required(),       // FK to Institution
            organizationId: a.string().required(),      // FK to Organization
            provider: a.string().required(),            // plaid|ynab|manual
            externalAccountId: a.string(),              // Provider's account ID
            name: a.string().required(),                // Account name (e.g., "Chase Freedom")
            officialName: a.string(),                   // Official account name from bank
            mask: a.string(),                           // Last 4 digits (e.g., "1234")
            type: a.string().required(),                // checking|savings|credit_card|mortgage|etc (granular types)
            currentBalance: a.float(),                  // Current balance in cents
            availableBalance: a.float(),                // Available balance in cents
            currency: a.string().required(),            // USD|EUR|etc
            personId: a.string(),                       // FK to Person (for auto-assignment)
            status: a.string().required(),              // active|inactive|closed
            rawData: a.json(),                          // Complete provider response (YNAB/Plaid/etc)
            syncedAt: a.datetime(),                     // Last sync timestamp from provider
            createdAt: a.datetime().required(),
            updatedAt: a.datetime().required(),
            profileOwner: a.string(),
        })
            .identifier(['financialAccountId'])
            .authorization((allow) => [
                allow.ownerDefinedIn("profileOwner"),
                allow.publicApiKey()
            ])
            .secondaryIndexes(index => [
                index('organizationId'),
                index('institutionId'),
                index('externalAccountId')
            ]),

        Transaction: a.model({
            transactionId: a.id().required(),
            financialAccountId: a.string().required(),  // FK to FinancialAccount
            organizationId: a.string().required(),      // FK to Organization
            provider: a.string().required(),            // plaid|ynab|manual
            externalTransactionId: a.string(),          // Provider's transaction ID
            amount: a.float().required(),               // Transaction amount
            currency: a.string().required(),            // USD|EUR|GBP|CAD|AUD|JPY
            date: a.datetime().required(),              // Transaction date (for sorting)
            authorizedDate: a.datetime(),               // Authorization date
            merchantName: a.string(),                   // Merchant name
            name: a.string().required(),                // Transaction name/description
            status: a.string().required(),              // pending|posted|reconciled
            pending: a.boolean().required(),            // Convenience: true if status === 'pending'
            personId: a.string(),                       // FK to Person (auto-assigned)
            receiptUrls: a.string().array(),            // S3 keys for receipts (Phase 2)
            rawData: a.json(),                          // Complete provider response (YNAB/Plaid/etc)
            syncedAt: a.datetime(),                     // Last sync timestamp from provider
            createdAt: a.datetime().required(),
            updatedAt: a.datetime().required(),
            profileOwner: a.string(),
        })
            .identifier(['transactionId'])
            .authorization((allow) => [
                allow.ownerDefinedIn("profileOwner"),
                allow.publicApiKey()
            ])
            .secondaryIndexes(index => [
                index('organizationId').sortKeys(['date']),
                index('financialAccountId').sortKeys(['date']),
                index('personId').sortKeys(['date']),
                index('externalTransactionId')
            ]),

        TransactionSplit: a.model({
            splitId: a.id().required(),
            transactionId: a.string().required(),       // FK to Transaction
            organizationId: a.string().required(),      // FK to Organization
            category: a.string().required(),            // Category for this split
            amount: a.float().required(),               // Portion of transaction amount (in cents)
            percentage: a.float(),                      // Optional: Percentage of total transaction
            notes: a.string(),                          // Optional: Notes specific to this split
            createdAt: a.datetime().required(),
            updatedAt: a.datetime().required(),
            profileOwner: a.string(),
        })
            .identifier(['splitId'])
            .authorization((allow) => [
                allow.ownerDefinedIn("profileOwner"),
                allow.publicApiKey()
            ])
            .secondaryIndexes(index => [
                index('transactionId'),
                index('organizationId').sortKeys(['category']),
                index('category')
            ]),

        Comment: a.model({
            commentId: a.id().required(),
            transactionId: a.string().required(),       // FK to Transaction
            accountId: a.string().required(),           // FK to Account (who commented)
            organizationId: a.string().required(),      // FK to Organization
            text: a.string().required(),                // Comment text
            createdAt: a.datetime().required(),
            updatedAt: a.datetime().required(),
            profileOwner: a.string(),
        })
            .identifier(['commentId'])
            .authorization((allow) => [allow.ownerDefinedIn("profileOwner")])
            .secondaryIndexes(index => [
                index('transactionId').sortKeys(['createdAt']),
                index('organizationId').sortKeys(['createdAt'])
            ]),

        Person: a.model({
            personId: a.id().required(),
            organizationId: a.string().required(),      // FK to Organization
            name: a.string().required(),                // Person name (e.g., "Sarah", "James", "Shared")
            color: a.string(),                          // Hex color for UI (e.g., "#FF5733")
            avatarUrl: a.string(),                      // S3 URL for avatar
            sortOrder: a.integer(),                     // Display order
            createdAt: a.datetime().required(),
            profileOwner: a.string(),
        })
            .identifier(['personId'])
            .authorization((allow) => [allow.ownerDefinedIn("profileOwner")])
            .secondaryIndexes(index => [index('organizationId')]),

        Budget: a.model({
            budgetId: a.id().required(),
            organizationId: a.string().required(),      // FK to Organization
            category: a.string().required(),            // Budget category
            amount: a.float().required(),               // Budgeted amount
            period: a.string().required(),              // monthly|weekly|yearly
            startDate: a.datetime().required(),         // Budget period start
            endDate: a.datetime(),                      // Budget period end (optional for ongoing budgets)
            spent: a.float(),                           // Auto-calculated spent amount
            remaining: a.float(),                       // Auto-calculated remaining
            status: a.string().required(),              // active|inactive
            syncedAt: a.datetime(),                     // Last sync timestamp from provider
            createdAt: a.datetime().required(),
            updatedAt: a.datetime().required(),
            profileOwner: a.string(),
        })
            .identifier(['budgetId'])
            .authorization((allow) => [allow.ownerDefinedIn("profileOwner")])
            .secondaryIndexes(index => [index('organizationId')]),

        Debt: a.model({
            debtId: a.id().required(),
            organizationId: a.string().required(),      // FK to Organization
            financialAccountId: a.string(),             // FK to FinancialAccount (if linked)
            name: a.string().required(),                // Debt name (e.g., "Student Loan")
            type: a.string().required(),                // credit_card|loan|mortgage|other
            originalBalance: a.float().required(),      // Original debt amount
            currentBalance: a.float().required(),       // Current balance
            interestRate: a.float(),                    // APR as decimal (e.g., 0.0499 for 4.99%)
            minimumPayment: a.float(),                  // Minimum monthly payment
            dueDate: a.integer(),                       // Day of month (1-31)
            status: a.string().required(),              // active|paid_off|closed
            createdAt: a.datetime().required(),
            updatedAt: a.datetime().required(),
            profileOwner: a.string(),
        })
            .identifier(['debtId'])
            .authorization((allow) => [allow.ownerDefinedIn("profileOwner")])
            .secondaryIndexes(index => [index('organizationId')]),

        // IntegrationConfig: OAuth token refs stored in Secrets Manager
        // Secret name computed: nueink/integration/{accountId}/{provider}
        IntegrationConfig: a.model({
            integrationId: a.id().required(),
            accountId: a.string().required(),           // FK to Account
            organizationId: a.string().required(),      // FK to Organization
            provider: a.string().required(),            // ynab|plaid|manual
            expiresAt: a.datetime(),                    // Token expiration (cached)
            status: a.string().required(),              // active|disabled|error|expired
            syncedAt: a.datetime(),                     // Last successful sync timestamp
            lastSyncError: a.string(),                  // Last error message (if any)
            syncEnabled: a.boolean().required(),        // User can disable sync temporarily
            createdAt: a.datetime().required(),
            updatedAt: a.datetime().required(),
            profileOwner: a.string(),
        })
            .identifier(['integrationId'])
            .authorization((allow) => [
                allow.ownerDefinedIn("profileOwner"),
                allow.publicApiKey()
            ])
            .secondaryIndexes(index => [
                index('accountId'),
                index('organizationId'),
                index('provider')
            ]),
    })
        .authorization((allow) => [
            allow.resource(postConfirmation),
            allow.resource(financialConnect),
            allow.resource(financialSync),
            allow.resource(nueInkApi),
        ])
;

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
    schema,
    authorizationModes: {
        defaultAuthorizationMode: "apiKey",
        apiKeyAuthorizationMode: {
            expiresInDays: 30,
        },
    },
});
