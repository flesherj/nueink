import {Router} from "express";
import AccountController from "../controllers/AccountController";

const router = Router();

router.get("/account/:accountId", AccountController.getAccount);
router.get("/account/list", AccountController.getAccounts);

export default router;
