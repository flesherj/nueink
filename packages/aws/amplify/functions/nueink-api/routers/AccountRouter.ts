import {Router} from "express";
import AccountController from "../controllers/AccountController";

const router = Router();

router.get("/account", AccountController.getAccounts);

export default router;
