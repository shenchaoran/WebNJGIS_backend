import { setting } from '../config/setting'

export const initEnv = () => {
    if (setting.fiddler_proxy.use) {
        // process.env.https_proxy = `http://${setting.fiddler_proxy.host}:${setting.fiddler_proxy.port}`
        // process.env.http_proxy = `http://${setting.fiddler_proxy.host}:${setting.fiddler_proxy.port}`
        // process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
    }
}