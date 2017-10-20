import { Response, Request, NextFunction } from "express";
const request = require('request-promise');
import * as fs from 'fs';
// refre: https://github.com/request/request-promise

export const getByServer = (url: string, form: any) => {
    const options = {
        url:url,
        method:'GET',
        qs:form
    };
    return request(options);
};

export const postByServer = (url: string, body: any, type: PostRequestType) => {
    const options: any = {
        uri: url,
        method: 'POST'
    };
    if(type === PostRequestType.JSON) {
        // 后台信息都会存在req.body中
        options.body = body;
        // must add this line
        // encode the body to stringified json
        options.json = true;
        // Is set automatically
        options.headers = {
            'content-type': 'application/json'
        }
    }
    else if(type === PostRequestType.Form) {
        // 后台会全部放在req.body中。
        // 所以如果有文件的话，不能放在form中，headers不能为urlencoded
        options.form = body;
        // Is set automatically
        options.headers = {
            'content-type': 'application/x-www-form-urlencoded'
        }
    }
    else if(type === PostRequestType.File) {
        // 后台不在req.body, req.params, req.query中。
        // 所以如果在req.query中取值，要把那部分单独拿出来，插入到url中
        options.formData = body;
        // Is set automatically
        options.headers = {
            'content-type': 'multipart/form-data'
        }
    }
    return request(options);
};

export enum PostRequestType {
    // JSON REST API
    JSON = 1,
    // POST like a form
    Form = 2,
    // contains file
    File = 3
}