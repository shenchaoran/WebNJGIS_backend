import { Response, Request, NextFunction } from "express";
const MyRouter = require('./base.route');
const LoginRouter = require('./login.route');

const router = new MyRouter();
module.exports = router;

router.route('/')
    .get((req: Request, res: Response, next: NextFunction) => {
        res.locals.successed = true;
        res.locals.resData = [{
            data: '111',
        }];
        res.locals.template = [{
            data: 'string'
        }];
        return next();
    });

router.use('/', LoginRouter);