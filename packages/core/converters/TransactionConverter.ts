import { Converter } from './Converter';
import { Transaction } from '../models';
import { TransactionEntity } from '@nueink/aws';

/**
 * Converter for Transaction domain model and TransactionEntity
 */
export class TransactionConverter implements Converter<TransactionEntity, Transaction> {
  toEntity(domain: Transaction): TransactionEntity {
    return {
      transactionId: domain.transactionId,
      financialAccountId: domain.financialAccountId,
      organizationId: domain.organizationId,
      provider: domain.provider,
      externalTransactionId: domain.externalTransactionId,
      amount: domain.amount,
      currency: domain.currency,
      date: domain.date?.toISOString(),
      authorizedDate: domain.authorizedDate?.toISOString(),
      merchantName: domain.merchantName,
      name: domain.name,
      category: domain.category,
      primaryCategory: domain.primaryCategory,
      pending: domain.pending,
      personId: domain.personId,
      receiptUrls: domain.receiptUrls,
      rawData: domain.rawData ? JSON.stringify(domain.rawData) : undefined,  // AWSJSON requires string
      syncedAt: domain.syncedAt?.toISOString(),
      createdAt: domain.createdAt?.toISOString(),
      updatedAt: domain.updatedAt?.toISOString(),
      profileOwner: domain.profileOwner,
    };
  }

  toDomain(entity: TransactionEntity): Transaction {
    return {
      transactionId: entity.transactionId,
      financialAccountId: entity.financialAccountId,
      organizationId: entity.organizationId,
      provider: entity.provider,
      externalTransactionId: entity.externalTransactionId,
      amount: entity.amount,
      currency: entity.currency,
      date: new Date(entity.date),
      authorizedDate: entity.authorizedDate ? new Date(entity.authorizedDate) : undefined,
      merchantName: entity.merchantName,
      name: entity.name,
      category: entity.category,
      primaryCategory: entity.primaryCategory,
      pending: entity.pending,
      personId: entity.personId,
      receiptUrls: entity.receiptUrls,
      rawData: entity.rawData ? JSON.parse(entity.rawData) : undefined,  // Parse AWSJSON string back to object
      syncedAt: entity.syncedAt ? new Date(entity.syncedAt) : undefined,
      createdAt: new Date(entity.createdAt),
      updatedAt: new Date(entity.updatedAt),
      profileOwner: entity.profileOwner!,
    };
  }
}
