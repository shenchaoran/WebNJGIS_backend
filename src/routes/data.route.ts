import { Response, Request, NextFunction } from "express";
import * as path from 'path';
import { RouterExtends } from './base.route';
import DataCtrl from '../controllers/data.controller';
import * as UDXPropParser from '../controllers/UDX.property.controller';
import * as UDXVisualParser from '../controllers/UDX.visualization.controller';
const express = require('express');
import { geoDataDB } from '../models';
const db = geoDataDB;
const defaultRoutes = [
    'findAll',
    'remove'
];

const router = express.Router();
module.exports = router;

// region auth
import { userAuthMid } from '../middlewares/user-auth.middleware';
userAuthMid(router);
// endregion

router.route('/')
    .post(DataCtrl.insert)

router.route('/download')
    .get((req, res, next) => {
        let msrId = req.query.msrId
        let eventId = req.query.eventId
        if(msrId && eventId) {
            DataCtrl.cacheData({msrId, eventId})
                .then(({stream, fname}) => {
                    // return res.download(msg.path, msg.fname)
                    res.set({
                        'Content-Type': 'file/*',
                        'Content-Disposition':
                            'attachment;filename=' +
                            (fname)
                    });
                    return (stream as any).pipe(res)
                })
                .catch(next);
        }
        else {
            return res.json({
                code: 400,
                desc: 'invalid query params'
            })
        }
    })
        
router.route('/:id')
    .get((req: Request, res: Response, next: NextFunction) => {
        DataCtrl.download(req.params.id)
            .then(msg => {
                return res.download(msg.path, msg.fname)
            })
            .catch(next);
    });

router.route('/:id/property')
    .get((req: Request, res: Response, next: NextFunction) => {
        UDXPropParser.parse(req.params.id)
            .then(prop => {
                res.locals = {
                    resData: prop,
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
                    succeed: true
                };
                return next();
            })
            .catch(next);
    });

    
RouterExtends(router, db, defaultRoutes);