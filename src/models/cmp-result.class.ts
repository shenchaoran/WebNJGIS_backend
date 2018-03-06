import { CmpState } from './cmp-state.enum';

export class CmpResult {
    state: CmpState;                // undefined/INIT, RUNNING, FINISHED
    image?: [{
      extent: any,
      path: string,                 // data/:id/:entry 此处返回一个图片的文件路径，不要把base64塞进去，不然太大
      title: string,
      state: CmpState               // FINISHED_SUCCEED, FINISHED_FAILED
    }];
    chart?: {
        state: CmpState,
        path: string,               // data/:id/:entrance 同样的，这里也放一个文件路径，前台解析为二位数组，做成 chart
        row: any[]
    };
    GIF?: {
        state: CmpState
    };
    statistic?: {
        state: CmpState,
        path: string
    };
}