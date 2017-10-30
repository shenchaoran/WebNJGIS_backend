import { setting } from '../config/setting';
module.exports = class ResponseModel {
    private version: string = setting.version;
    href: string;
    ticket: string;                                 // 身份认证
    status: {
        code: string;                               // http状态码
        desc: string;                               // 可以放出错的详细信息
    };
    data: any;
    template: any;                                  // 返回数据的结构
    userid: string;

    constructor() {}
};