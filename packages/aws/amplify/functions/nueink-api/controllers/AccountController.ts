import {Request, Response} from 'express';
import {NueInkServiceFactory} from "../../../../index";

export interface GetAccountRequestParams {
    accountId: string;
}

class AccountController {
    constructor(private readonly accountService = NueInkServiceFactory.getInstance().accountService()) {}

    public getAccounts = async (_req: Request, res: Response) => {
        const accounts = await this.accountService.getAccounts();
        res.status(200).send(accounts);
    }

    public getAccount = async (req: Request<GetAccountRequestParams>, res: Response) => {
        const account = await this.accountService.getAccount(req.params.accountId);
        res.status(200).send(account);
    }
}

export default new AccountController();
