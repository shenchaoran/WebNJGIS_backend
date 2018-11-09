import { Response, Request, NextFunction } from "express";
const express = require('express');
import ModelServiceCtrl from '../controllers/model-service.controller';
import { modelServiceDB as db } from '../models/model-service.model';
import { calcuTaskDB } from '../models/calcu-task.model';
import { RouterExtends } from './base.route';
const msCtrl = new ModelServiceCtrl();

const defaultRoutes = [
    'findAll',
    'insert',
    'find',
    'remove'
];

const router = express.Router();
module.exports = router;

// region auth
import { userAuthMid } from '../middlewares/user-auth.middleware';
userAuthMid(router);
// endregion

router.route('/')
    .get((req, res, next) => {
        let ids = req.query.ids;
        if (ids) {
            db.findByIds(ids)
                .then(msg => res.json({data: { docs: msg }}))
                .catch(next);
        }
        else {
            let pageSize = parseInt(req.query.pageSize) || 15,
                pageIndex = parseInt(req.query.pageIndex) || 1;
            msCtrl.findByPage({
                    pageSize,
                    pageIndex
                })
                .then(docs => res.json({ data: docs }))
                .catch(next);
        }
    });

router.route('/:id')
    .get((req, res, next) => {
        msCtrl.findOne(req.params.id)
            .then(msg => res.json({data: msg}))
            .catch(next);
    });

router.route('/:id/invoke')
    .post((req, res, next) => {
        const msInstance = req.body.msInstance;
        if (msInstance) {
            msCtrl.invoke(msInstance)
                .then(msg => res.json({ data: msg }))
                .catch(next)
        }
        else {
            return next('invalid request body!');
        }
    });


RouterExtends(router, db, defaultRoutes);