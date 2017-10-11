import { Response, Request, NextFunction } from "express";
const MyRouter = require('./base.route');
const LoginRouter = require('./login.route');

const router = new MyRouter();
module.exports = router;

router.route('/')
    .get((req: Request, res: Response, next: NextFunction) => {
        res.end('111');
    });

router.use('/', LoginRouter);