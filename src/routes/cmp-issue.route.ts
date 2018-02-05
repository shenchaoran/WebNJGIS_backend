import { Response, Request, NextFunction } from 'express';
const MyRouter = require('./base.route');
import CmpIssueCtrl from '../controllers/cmp-issue.controller';
import { cmpIssueDB } from '../models';
const db = cmpIssueDB;

const defaultRoutes = [
    'insert',
    'find',
    'remove',
    'update'
];

const router = new MyRouter(cmpIssueDB, defaultRoutes);
module.exports = router;

// region auth
import { userAuthMid } from '../middlewares/user-auth.middleware';
userAuthMid(router);
// endregion

router.route('/')
    .get((req: Request, res: Response, next: NextFunction) => {
        CmpIssueCtrl.findAll()
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