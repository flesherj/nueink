import { AwsAmplifyApiFactory, Account } from '../index';

export class AccountApi {
  public static create = () => new AccountApi();
  public getAccounts = async () => {
    const response =
      await AwsAmplifyApiFactory.getInstance().get('account').response;
    return (await response.body.json()) as unknown as Array<Account>;
  };
}
