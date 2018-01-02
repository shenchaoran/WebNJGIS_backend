import { Response, Request, NextFunction } from 'express';

const MyRouter = require('./base.route');
import * as CmpTaskCtrl from '../controllers/cmp-task.controller';
import { cmpTaskDB } from '../models/cmp-task.model';
const db = cmpTaskDB;

const defaultRoutes = [
    'find',
    'remove',
    'update'
];

const router = new MyRouter(cmpTaskDB, defaultRoutes);
module.exports = router;

// region auth
import { userAuthMid } from '../middlewares/user-auth.middleware';
userAuthMid(router);
// endregion

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
    })
    .post((req: Request, res: Response, next: NextFunction) => {
        if(req.body.doc) {
            CmpTaskCtrl.insert(req.body.doc)
                .then(_doc => {
                    res.locals.resData = {
                        doc: _doc
                    };
                    res.locals.template = {};
                    res.locals.succeed = true;
                    return next();
                })
                .catch(next);
        }
        else {
            return next(new Error('invalid request body!'));
        }
    });

router.route('/:id/start')
    .post((req: Request, res: Response, next: NextFunction) => {
        return CmpTaskCtrl.start(req.params.id)
            .then(data => {
                res.locals.resData = {succeed: true};
                res.locals.template = {};
                res.locals.succeed = true;
                return next();
            })
            .catch(next);
    });