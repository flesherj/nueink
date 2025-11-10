import { Request, Response } from 'express';
import { NueInkRepositoryFactory } from '@nueink/aws';

export interface GetAccountRequestParams {
  accountId: string;
}

class AccountController {
  // Lazy-load repository to avoid initialization order issues
  private get accountRepository() {
    return NueInkRepositoryFactory.getInstance().repository('account');
  }

  public getAccounts = async (_req: Request, res: Response) => {
    console.log('getAccounts', {_req, res});
    const accounts = await this.accountRepository.findAll();
    res.status(200).send(accounts);
  };

  public getAccount = async (
    req: Request<GetAccountRequestParams>,
    res: Response
  ) => {
    const account = await this.accountRepository.findById(req.params.accountId);
    res.status(200).send(account);
  };
}

export default new AccountController();
