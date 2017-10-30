export enum UDXType {
    UNKNOWN,
    TABLE,
    SHAPEFILE,
    ASCII_GRID,
    GRID,
    GEOTIFF,
    SPC,
    TIN
}

// 为方便前台处理，table以二维矩阵的形式存储，header存放表头
export class UDXTable {
    columns: Array<{
        data: string;
        title: string;
        type?: string;
        readOnly: boolean;
    }>;
    data: Array<any>;
    constructor() {
        this.columns = [];
        this.data = [];
    }
}