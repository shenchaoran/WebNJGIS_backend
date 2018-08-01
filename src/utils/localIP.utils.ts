let os = require('os')

export const getLocalIP = () => {
    let interfaces = os.networkInterfaces()
    let ipv4
    for(let key in interfaces) {
        if(ipv4) 
            break
        for(let item of interfaces[key]) {
            if(!item.internal && item.family === 'IPv4') {
                (global as any).ipv4 = item.address
                // console.log(item.address)
                ipv4 = item.address
                break
            }
        }
    }
    return ipv4
}