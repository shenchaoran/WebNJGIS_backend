import { Response, Request, NextFunction } from "express";
import * as path from 'path';

import DataCtrl from '../controllers/data.controller';
import * as UDXPropParser from '../controllers/UDX.property.controller';
import * as UDXVisualParser from '../controllers/UDX.visualization.controller';
const MyRouter = require('./base.route');
import { geoDataDB, STD_DATA } from '../models';
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
        // if(req.params.id === 'std') {
        //     res.locals.resData = STD_DATA;
        //     res.locals.template = {},
        //     res.locals.succeed = true;
        //     return next();
        // }
        // else {
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
        // }
    });
    

/**
 * 一个数据包里可以有多条数据，此处为 按条目下载，只下载其中一个
 */
router.route('/:id/:entry')
    .get((req: Request, res: Response, next: NextFunction) => {
        const fpath = path.join(__dirname, '../upload/geo-data', req.params.id, req.params.entry);
        return res.download(fpath, req.params.entry, err => {
            if(err) {
                return next(err);
            }
        });
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