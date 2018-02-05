import { Response, Request, NextFunction } from 'express';
const MyRouter = require('./base.route');
import * as CmpSolutionCtrl from '../controllers/cmp-solution.controller';
import { cmpSolutionDB } from '../models/cmp-solution.model';
const db = cmpSolutionDB;

const defaultRoutes = [
    'insert',
    'find',
    'remove',
    'update'
];

const router = new MyRouter(cmpSolutionDB, defaultRoutes);
module.exports = router;

// region auth
import { userAuthMid } from '../middlewares/user-auth.middleware';
userAuthMid(router);
// endregion

// router.route('/:id').get(cmpSolutionDB.find);

router.route('/')
    .get((req: Request, res: Response, next: NextFunction) => {
        CmpSolutionCtrl.findAll()
            .then(docs => {
                res.locals.resData = {
                    docs: docs
                };
                res.locals.template = {};
                res.locals.succeed = true;
                return next();
            })
            .catch(next);
    });