import { Response, Request, NextFunction } from "express";

import DataCtrl from '../controllers/data.controller';
import * as UDXPropParser from '../controllers/UDX.property.controller';
import * as UDXVisualParser from '../controllers/UDX.visualization.controller';
const MyRouter = require('./base.route');
import { geoDataDB, STD_DATA } from '../models/UDX-data.model';
const db = geoDataDB;

const router = new MyRouter();
module.exports = router;

// region auth
import { userAuthMid } from '../middlewares/user-auth.middleware';
userAuthMid(router);
// endregion

router.route('/')
    .post(DataCtrl.insert)
    .get((req: Request, res: Response, next: NextFunction) => {
        db
            .find({})
            .then(docs => {
                return DataCtrl.convert2Tree(req.query.user, docs);
            })
            .then(docs => {
                res.locals.resData = docs;
                res.locals.template = {};
                res.locals.succeed = true;
                return next();
            })
            .catch(next);
    });
    
router.route('/:id')
    .delete(DataCtrl.remove)
    .get((req: Request, res: Response, next: NextFunction) => {
        if(req.params.id === 'std') {
            res.locals.resData = STD_DATA;
            res.locals.template = {},
            res.locals.succeed = true;
            return next();
        }
        else {
            DataCtrl.download(req.params.id)
                .then(rst => {
                    res.set({
                        'Content-Type': 'file/*',
                        'Content-Length': rst.length,
                        'Content-Disposition':
                            'attachment;filename=' +
                            encodeURIComponent(rst.filename)
                    });
                    return res.end(rst.data);
                });
        }
    });

router.route('/:id/property')
    .get((req: Request, res: Response, next: NextFunction) => {
        UDXPropParser.parse(req.params.id)
            .then(prop => {
                res.locals = {
                    resData: prop,
                    template: {},
                    succeed: true
                };
                return next();
            })
            .catch(next);
    });

router.route('/:id/show')
    .get((req: Request, res: Response, next: NextFunction) => {
        UDXVisualParser.parse(req.params.id)
            .then(visual => {
                res.locals = {
                    resData: visual,
                    template: {},
                    succeed: true
                };
                return next();
            })
            .catch(next);
    });

// router.route('/compare/:left/2/:right')
//     .get(DataCtrl.compareUDX);
