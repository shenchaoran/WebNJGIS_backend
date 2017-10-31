import { Response, Request, NextFunction } from 'express';
import * as formidable from 'formidable';
import * as Promise from 'bluebird';
import * as _ from 'lodash';
import * as path from 'path';
import { ObjectID } from 'mongodb';
import * as fs from 'fs';
const request = require('request');

import { setting } from '../config/setting';
import { DataModelInstance, GeoDataType, GeoDataClass } from '../models/data.model';
import * as APIModel from '../models/api.model';
import * as RequestCtrl from './request.controller';
const dataDebug = debug('WebNJGIS: data');

export const uploadFiles = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const form = new formidable.IncomingForm();
    form.encoding = 'utf-8';
    form.uploadDir = path.join(setting.uploadPath, 'geo_data');
    form.keepExtensions = true;
    form.maxFieldsSize = 500 * 1024 * 1024;
    form.parse(req, (err, fields, files) => {
        if (files.geo_data) {
            const file = files.geo_data;
            const filename = file.name;
            const ext = filename.substr(filename.lastIndexOf('.'));
            const newName = new ObjectID() + ext;
            const geoData = new GeoDataClass(
                filename,
                newName,
                fields.type,
                fields.tag
            );

            fs.stat(file.path, (err, stats) => {
                if (err) {
                    return next(err);
                } else {
                    const newPath = path.join(
                        setting.uploadPath,
                        'geo_data',
                        newName
                    );
                    fs.rename(file.path, newPath, () => {
                        res.locals.resData = geoData;
                        return next();
                    });
                }
            });
        }
    });
};
export const post2Server = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const geoData = res.locals.resData;
    const fpath = path.join(
        setting.uploadPath,
        'geo_data',
        geoData.path
    );
    let url = APIModel.getAPIUrl('upload-geo-data');
    url += `?type=file&gd_tag=${geoData.tag}`;
    const form = {
        myfile: fs.createReadStream(fpath)
    };
    RequestCtrl.postByServer(url, form, RequestCtrl.PostRequestType.File)
        .then(response => {
            response = JSON.parse(response);
            if(response.res === 'suc') {
                geoData.gdid = response.gd_id;
                const newPath = path.join(
                    setting.uploadPath,
                    'geo_data',
                    geoData.gdid + fpath.substr(fpath.lastIndexOf('.'))
                );
                fs.rename(fpath, newPath, () => {
                    res.locals.resData = geoData;
                    res.locals.template = {};
                    res.locals.succeed = true;
                    return next();
                });
            }
            else {
                const err: any = new Error('post into server failed!');
                err.code = '500';
                return next(err);
            }
        })
        .catch(err => {
            return next(err);
        });
};

export const downloadData = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    dataDebug(req.params);
    const url = APIModel.getAPIUrl('download-geo-data', req.params);
    RequestCtrl.getByServer(url, undefined)
        .then((response) => {
            res.set({
                'Content-Type': 'file/xml',
                'Content-Length': response.length,
                'Content-Disposition': 'attachment;filename=' + encodeURIComponent(req.query.filename)
            });
            return res.end(response);
        })
        .catch(next);
}

export const visualization = (
    req: Request,
    res: Response,
    next: NextFunction
) => {

};