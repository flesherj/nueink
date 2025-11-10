import { AccountEntity } from '../index';
import { AwsAmplifyApiFactory } from './AwsAmplifyApiFactory';

export class AccountApi {
  public static create = () => new AccountApi();

  public getAccounts = async () => {
    const response =
      await AwsAmplifyApiFactory.getInstance().get('account').response;
    return (await response.body.json()) as unknown as Array<AccountEntity>;
  };

  public getAccount = async (id: string) => {
    const response = await AwsAmplifyApiFactory.getInstance().get(
      `account/${id}`
    ).response;
    return (await response.body.json()) as unknown as AccountEntity;
  };
}
