import { setting } from '../config/setting';
module.exports = class ResponseModel {
    // 后台处理出错，存放错误信息
    error: {
        code: string;                               // http状态码
        desc: string;                               // 可以放出错的详细信息
    };
    // 后台处理成功，返回的数据
    data: any;

    constructor() {}
};