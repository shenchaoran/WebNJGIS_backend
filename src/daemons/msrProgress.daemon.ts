import { CalcuTaskModel, GeoDataModel, ICalcuTaskDocument } from '../models'
import { Observable, interval, from, of, forkJoin } from 'rxjs'
import { startWith, map, flatMap, switchMap, filter, mergeMap } from 'rxjs/operators'
import { setting } from '../config/setting';
import { OGMSState } from '../models';
import * as _ from 'lodash'
import * as Bluebird from 'bluebird';

export default class MSRProgressDaemon {

    constructor(public msrId) { }

    public async start() {
        let msr$ = interval(setting.daemon.msr_progress).pipe(
            switchMap(i => from(CalcuTaskModel.findOne({ _id: this.msrId }) as any))
        );
        return new Bluebird((resolve, reject) => {
            let subscription = msr$.subscribe((msr: ICalcuTaskDocument) => {
                if (msr.state === OGMSState.FINISHED_SUCCEED) {
                    subscription.unsubscribe();
                    return resolve({
                        code: 200
                    });
                }
                else if (msr.state === OGMSState.FINISHED_FAILED) {
                    subscription.unsubscribe();
                    return resolve({
                        code: 500,
                        error: `********  model run failed! ${this.msrId}`
                    });
                }
                else if(msr.state === OGMSState.COULD_START) {

                }
                else if (msr.state !== OGMSState.RUNNING) {
                    subscription.unsubscribe();
                    return resolve({
                        code: 501,
                        error: `********  invalid model run state! ${this.msrId}`
                    });
                }
            });
        });
    }
}


process.on('message', function (m) {
    if (m.code == 'start') {
        let daemon = new MSRProgressDaemon(m.msrId)
        daemon.start()
            .then(msg => {
                process.send(msg);
            })
            .catch(e => {
                console.error(e);
                process.send({
                    code: 500,
                    desc: 'daemon msr progress failed!'
                });
            })
    }
});