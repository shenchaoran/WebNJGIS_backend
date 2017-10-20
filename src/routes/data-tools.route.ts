import { Response, Request, NextFunction } from "express";
const MyRouter = require('./base.route');

const router = new MyRouter();
module.exports = router;

router.route('/')
    .get((req: Request, res: Response, next: NextFunction) => {

        return next();
    });

router.route('/:id')
    .get((req: Request, res: Response, next: NextFunction) => {
        if(req.params.id === 'ping') {
            return next();
        }

        return next();
    });

router.route('/:id/input')
    .get((req: Request, res: Response, next: NextFunction) => {
        return next();
    });