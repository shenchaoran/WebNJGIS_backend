import { setting } from '../config/setting';
module.exports = class ResponseModel {
    private version: string = setting.version;
    href: string;
    ticket: string;
    status: {
        code: string;
        desc: string;
    };
    data: any;
    template: any;
    userid: string;

    constructor() {}
};