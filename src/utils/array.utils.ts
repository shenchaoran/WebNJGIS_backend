import * as _ from 'lodash'

export const stdDev = (arr: Array<any>): any => {
    const mean = _.mean(arr);
    return Math.sqrt(
        _
            .chain(arr)
            .map(item => item - mean)
            .map(x => x * x)
            .reduce((sum, x) => {
                return sum + x;
            }, 0)
            .value()/(arr.length - 1)
    );
}