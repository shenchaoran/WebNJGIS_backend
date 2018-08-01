import { setting } from '../config/setting';
module.exports = class ResponseModel {
    // private app: any = setting.app;                 // app base info
    // href: string;
    // token: string;                                  // 身份认证
    error: {
        code: string;                               // http状态码
        desc: string;                               // 可以放出错的详细信息
    };
    data: any;
    // username: string;

    constructor() {}
};