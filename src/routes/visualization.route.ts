import { Response, Request, NextFunction } from "express";
const express = require('express');

const router = express.Router();
module.exports = router;

// region auth
import { userAuthMid } from '../middlewares/user-auth.middleware';
userAuthMid(router);
// endregion

router.route('/')
    .get((req: Request, res: Response, next: NextFunction) => {

    });

//  RouterExtends(router, OgmsModel, defaultRoutes);