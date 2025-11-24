import { Converter } from './Converter';
import { Transaction } from '../models';
import { TransactionEntity } from '@nueink/aws';
import { parseTransactionDate, parseTimestamp } from '../utils/dateUtils';

/**
 * Converter for Transaction domain model and TransactionEntity
 */
export class TransactionConverter implements Converter<TransactionEntity, Transaction> {
  public toEntity = (domain: Transaction): TransactionEntity => {
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
      status: domain.status,
      pending: domain.pending,
      personId: domain.personId,
      receiptUrls: domain.receiptUrls,
      rawData: domain.rawData ? JSON.stringify(domain.rawData) : undefined,  // AWSJSON requires string
      syncedAt: domain.syncedAt?.toISOString(),
      createdAt: domain.createdAt?.toISOString(),
      updatedAt: domain.updatedAt?.toISOString(),
      profileOwner: domain.profileOwner,
    };
  };

  public toDomain = (entity: TransactionEntity): Transaction => {
    return {
      transactionId: entity.transactionId,
      financialAccountId: entity.financialAccountId,
      organizationId: entity.organizationId,
      provider: entity.provider,
      externalTransactionId: entity.externalTransactionId,
      amount: entity.amount,
      currency: entity.currency,
      date: parseTransactionDate(entity.date)!,
      authorizedDate: parseTransactionDate(entity.authorizedDate),
      merchantName: entity.merchantName,
      name: entity.name,
      status: entity.status as 'pending' | 'posted' | 'reconciled',
      pending: entity.pending,
      personId: entity.personId,
      receiptUrls: entity.receiptUrls,
      rawData: entity.rawData ? JSON.parse(entity.rawData) : undefined,  // Parse AWSJSON string back to object
      syncedAt: parseTimestamp(entity.syncedAt),
      createdAt: parseTimestamp(entity.createdAt)!,
      updatedAt: parseTimestamp(entity.updatedAt)!,
      profileOwner: entity.profileOwner!,
    };
  };
}
