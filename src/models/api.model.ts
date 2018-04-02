import * as _ from 'lodash';
import { APIS } from '../config/api.config';
import { setting } from '../config/setting';

const getAPIById = (id: string) => {
    return _.find(APIS.data, (api: any) => {
        return api.id === id;
    });
};

export const getAPIUrl = (id: string, params?: any) => {
    let path = getAPIById(id).pathname;
    if(params !== undefined) {
        for(const key in params) {
            path = _.replace(path, ':' + key, params[key]);
        }
    }
    return `http://${setting.calculation_server.host}:${setting.calculation_server.port}${path}`;
};