import { Response, Request, NextFunction } from "express";
import * as path from 'path';
import { setting } from '../config/setting';
import { RouterExtends } from './base.route';
import DataCtrl from '../controllers/data.controller';
import * as UDXPropParser from '../controllers/UDX.property.controller';
import * as UDXVisualParser from '../controllers/UDX.visualization.controller';
import { geoDataDB as db } from '../models';
import * as formidable from 'formidable';
const express = require('express');
const dataCtrl = new DataCtrl();

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
    .post((req, res, next) => {
        const form = new formidable.IncomingForm();
        form.encoding = 'utf-8';
        form.uploadDir = setting.geo_data.path;
        form.keepExtensions = true;
        form.maxFieldsSize = 500 * 1024 * 1024;
        form.parse(req, (err, fields, files) => {
            if (err) {
                return next(err);
            }
            else if(files['geo-data']) {
                dataCtrl.insert(fields, files).then(msg => res.json({data: msg})).catch(next)
            }
            else {
                return next('invalid file key name!')
            }
        })
    })

router.route('/download')
    .get((req, res, next) => {
        let msrId = req.query.msrId
        let eventId = req.query.eventId
        if(msrId && eventId) {
            dataCtrl.cacheData({msrId, eventId})
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
        dataCtrl.download(req.params.id)
            .then(({fpath, fname}) => {
                return res.download(fpath, fname)
            })
            .catch(next);
    });

router.route('/:id/property')
    .get((req: Request, res: Response, next: NextFunction) => {
        UDXPropParser.parse(req.params.id)
            .then(prop => {
                return res.json({
                    data: prop
                });
            })
            .catch(next);
    });

router.route('/:id/show')
    .get((req: Request, res: Response, next: NextFunction) => {
        UDXVisualParser.parse(req.params.id)
            .then(visual => {
                return res.json({
                    data: visual
                });
            })
            .catch(next);
    });

    
RouterExtends(router, db, defaultRoutes);