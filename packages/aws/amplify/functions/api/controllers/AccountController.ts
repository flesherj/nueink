import { Request, Response } from 'express';
import { serviceFactory } from '../handler';

class AccountController {
  /**
   * GET /account/:accountId
   * Get account by ID
   */
  public getAccount = async (
    req: Request<{ accountId: string }>,
    res: Response
  ) => {
    try {
      const accountService = serviceFactory.account();
      const account = await accountService.findById(req.params.accountId);

      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }

      res.json(account);
    } catch (error) {
      console.error('Error fetching account:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to fetch account'
      });
    }
  };

  /**
   * GET /account
   * List all accounts (development/admin only)
   */
  public listAccounts = async (_req: Request, res: Response) => {
    try {
      const accountService = serviceFactory.account();
      const accounts = await accountService.findAll();
      res.json(accounts);
    } catch (error) {
      console.error('Error listing accounts:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to list accounts'
      });
    }
  };
}

export default new AccountController();
