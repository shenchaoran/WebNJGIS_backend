import { Response, Request, NextFunction } from "express";
const MyRouter = require('./base.route');

const router = new MyRouter();
module.exports = router;

// region auth
import { userAuthMid } from '../middlewares/user-auth.middleware';
userAuthMid(router);
// endregion

router.route('/')
    .get((req: Request, res: Response, next: NextFunction) => {

    });