import { CmpState } from './cmp-state.enum';

export class CmpResult {
    image?: [{
      extent: any,
      path: string,                 // data/:id/:entry 此处返回一个图片的文件路径，不要把base64塞进去，不然太大
      title: string,
      progress: number
    }];
    chart?: {
        show: any,
        prop: any
        // progress: number,
        // path: string,               // data/:id/:entrance 同样的，这里也放一个文件路径，前台解析为二位数组，做成 chart
        // row: any[]
    };
    GIF?: {
        progress: number
    };
    statistic?: {
        progress: number,
        path: string
    };
}