import {
  NueInkDataClientBuilder,
  AccountService,
  MembershipService,
  OrganizationService,
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

  public accountService() {
    return new AccountService(this._dataClient);
  }

  public organizationService() {
    return new OrganizationService(this._dataClient);
  }

  public membershipService() {
    return new MembershipService(this._dataClient);
  }
}
