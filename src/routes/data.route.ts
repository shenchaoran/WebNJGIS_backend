import { Response, Request, NextFunction } from "express";

import * as DataCtrl from '../controllers/data.controller';
import * as UDXParser from '../controllers/UDX.parser.controller';
const MyRouter = require('./base.route');
import { geoDataDB, STD_DATA } from '../models/UDX-data.model';
const db = geoDataDB;

const router = new MyRouter();
module.exports = router;

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
    .get(UDXParser.parseUDXProp);

router.route('/:id/show')
    .get(UDXParser.parseUDXVisual);

// router.route('/compare/:left/2/:right')
//     .get(DataCtrl.compareUDX);
