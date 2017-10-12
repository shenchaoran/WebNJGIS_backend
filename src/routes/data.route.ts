import { Response, Request, NextFunction } from "express";
const MyRouter = require('./base.route');

const router = new MyRouter();
module.exports = router;

router.route('/')
    .get((req: Request, res: Response, next: NextFunction) => {

    })
    .post((req: Request, res: Response, next: NextFunction) => {
        
    });