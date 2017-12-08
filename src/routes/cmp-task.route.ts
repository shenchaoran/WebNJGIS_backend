import { Response, Request, NextFunction } from 'express';

const MyRouter = require('./base.route');
import * as CmpTaskCtrl from '../controllers/cmp-task.controller';
import { cmpTaskDB } from '../models/cmp-task.model';
const db = cmpTaskDB;

const defaultRoutes = [
    'insert',
    'find',
    'remove',
    'update'
];

const router = new MyRouter(cmpTaskDB, defaultRoutes);
module.exports = router;

router.route('/')
    .get((req: Request, res: Response, next: NextFunction) => {
        db
            .find({})
            .then(docs => {
                return CmpTaskCtrl.convert2Tree(req.query.user, docs);
            })
            .then(docs => {
                res.locals.resData = docs;
                res.locals.template = {};
                res.locals.succeed = true;
                return next();
            })
            .catch(next);
    });