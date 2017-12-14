import { Response, Request, NextFunction } from 'express';

const MyRouter = require('./base.route');
import * as CmpSceneCtrl from '../controllers/cmp-scene.controller';
import { cmpSceneDB } from '../models/cmp-scene.model';
const db = cmpSceneDB;

const defaultRoutes = [
    'insert',
    'find',
    'remove',
    'update'
];

const router = new MyRouter(cmpSceneDB, defaultRoutes);
module.exports = router;

router.route('/')
    .get((req: Request, res: Response, next: NextFunction) => {
        db
            .find({})
            .then(docs => {
                return CmpSceneCtrl.convert2Tree(req.query.user, docs);
            })
            .then(docs => {
                res.locals.resData = docs;
                res.locals.template = {};
                res.locals.succeed = true;
                return next();
            })
            .catch(next);
    });