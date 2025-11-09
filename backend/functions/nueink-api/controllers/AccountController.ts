import { Request, Response } from 'express';
import { NueInkRepositoryFactory } from '@nueink/aws';

export interface GetAccountRequestParams {
  accountId: string;
}

class AccountController {
  constructor(
    private readonly accountRepository = NueInkRepositoryFactory.getInstance().repository(
      'account'
    )
  ) {}

  public getAccounts = async (_req: Request, res: Response) => {
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
