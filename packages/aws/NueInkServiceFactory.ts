import {
  NueInkDataClientBuilder,
  AmplifyAccountRepository,
  AmplifyMembershipRepository,
  AmplifyOrganizationRepository,
} from './index';

export class NueInkServiceFactory {
  private static _instance: NueInkServiceFactory;
  private _dataClient: any;

  private constructor() {
    this._dataClient = NueInkDataClientBuilder.builder().build();
  }

  public static getInstance() {
    if (!this._instance) {
      this._instance = new NueInkServiceFactory();
    }
    return this._instance;
  }

  public accountRepository() {
    return new AmplifyAccountRepository(this._dataClient);
  }

  public organizationRepository() {
    return new AmplifyOrganizationRepository(this._dataClient);
  }

  public membershipRepository() {
    return new AmplifyMembershipRepository(this._dataClient);
  }
}

