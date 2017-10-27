import { Response, Request, NextFunction } from 'express';
const requestPromise = require('request-promise');
const request = require('request');
import * as fs from 'fs';
import * as Promise from 'bluebird';

// reference: https://github.com/request/request-promise

export const getByServer = (url: string, form: any) => {
    const options = {
        url: url,
        method: 'GET',
        qs: form
    };
    return requestPromise(options);
};

export const postByServer = (url: string, body: any, type: PostRequestType) => {
    const options: any = {
        uri: url,
        method: 'POST'
    };
    if (type === PostRequestType.JSON) {
        // 后台信息都会存在req.body中
        options.body = body;
        // must add this line
        // encode the body to stringified json
        options.json = true;
        // Is set automatically
        options.headers = {
            'content-type': 'application/json'
        };
    } else if (type === PostRequestType.Form) {
        // 后台会全部放在req.body中。
        // 所以如果有文件的话，不能放在form中，headers不能为urlencoded
        options.form = body;
        // Is set automatically
        options.headers = {
            'content-type': 'application/x-www-form-urlencoded'
        };
    } else if (type === PostRequestType.File) {
        // 后台不在req.body, req.params, req.query中。
        // 所以如果在req.query中取值，要把那部分单独拿出来，插入到url中
        options.formData = body;
        // Is set automatically
        options.headers = {
            'content-type': 'multipart/form-data'
        };
    }
    return requestPromise(options);
};

// 通过管道请求转发 TODO fix hot
export const getByPipe = (req: Request, url: string) => {
    return new Promise((resolve, reject) => {
        req.pipe(
            request.get(url, (err, response, body) => {
                if (err) {
                    return reject(err);
                } else {
                    return resolve({
                        response: response,
                        body: body
                    });
                }
            })
        );
    });
};

export const postByPipe = (req: Request, url: string) => {
    return new Promise((resolve, reject) => {
        req.pipe(
            request
                .post(url)
                .then(response => {
                    return resolve(response);
                })
                .catch(error => {
                    return reject(error);
                })
        );
    });
};

export enum PostRequestType {
    // JSON REST API
    JSON = 1,
    // POST like a form
    Form = 2,
    // contains file
    File = 3
}
