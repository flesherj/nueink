import {Request, Response} from 'express';
import {NueInkServiceFactory} from "../../../../index";

class AccountController {
    constructor(private readonly accountService = NueInkServiceFactory.getInstance().accountService()) {}

    public getAccounts = async (_req: Request, res: Response) => {
        const accounts = await this.accountService.getAccounts();
        res.status(200).send(accounts);
    }
}

export default new AccountController();
