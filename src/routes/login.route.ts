import { Response, Request, NextFunction } from "express";
const MyRouter = require('./base.route');

const router = new MyRouter();
module.exports = router;

router.route('/login')
    .get((req: Request, res: Response, next: NextFunction) => {
        res.end('login');
    });