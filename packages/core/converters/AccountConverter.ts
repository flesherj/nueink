import { Converter } from './Converter';
import { Account } from '../models';
import { AccountEntity } from '@nueink/aws';

/**
 * Converter for Account domain model and AccountEntity
 */
export class AccountConverter implements Converter<AccountEntity, Account> {
  public toEntity = (domain: Account): AccountEntity => {
    return {
      accountId: domain.accountId,
      defaultOrgId: domain.defaultOrgId,
      email: domain.email,
      username: domain.username,
      firstName: domain.firstName,
      middleName: domain.middleName,
      lastName: domain.lastName,
      provider: domain.provider,
      createdAt: domain.createdAt?.toISOString(),
      status: domain.status,
      meta: domain.meta,
      profileOwner: domain.profileOwner,
    };
  };

  public toDomain = (entity: AccountEntity): Account => {
    return {
      accountId: entity.accountId,
      defaultOrgId: entity.defaultOrgId,
      email: entity.email,
      username: entity.username,
      firstName: entity.firstName,
      middleName: entity.middleName,
      lastName: entity.lastName,
      provider: entity.provider,
      createdAt: new Date(entity.createdAt),
      status: entity.status,
      meta: entity.meta,
      profileOwner: entity.profileOwner!,
    };
  };
}
