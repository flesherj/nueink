import {Request, Response} from 'express';
import {generateClient} from "aws-amplify/api";
import type {Schema} from "../../../data/resource";
import {AccountService} from "../../../../services";

const AccountController = () => {
    const getAccounts = async (req: Request, res: Response) => {
        const client = generateClient<Schema>();
        const accountService = new AccountService(client);

        console.log('AccountController.getAccounts');
        const accounts = await accountService.getAccounts();
        console.log('THe accounts', accounts);
        res.status(200).send(accounts);
    }

    return {
        getAccounts
    };
};

export default AccountController();
