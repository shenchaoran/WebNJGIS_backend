import * as path from 'path'
import * as child_process from 'child_process'
import * as Promise from 'bluebird';
import * as shell from 'shelljs'
let exec = child_process.exec

export const initCopyFiles = () => {
    // let fpath = path.join(__dirname, './copyStaticAssets.js')
    return new Promise((resolve, reject) => {

        // shell.cp('-R', 'src/public/js/lib', 'dist/public/js/');
        shell.cp('-R', path.join(__dirname, '../public/css'), path.join(__dirname, '../../dist/public/'));
        shell.cp('-R', path.join(__dirname, '../public/images'), path.join(__dirname, '../../dist/public/'));
        shell.cp('-R', path.join(__dirname, '../child-process'), path.join(__dirname, '../../dist/'));
        // shell.cp('-R', 'src/resources', 'dist/resources');
        resolve()

        // exec(fpath, (err, stdout, stderr) => {
        //     if(err) {
        //         console.log(err)
        //         return reject(err)
        //     }
        //     else if(stderr) {
        //         return reject(stderr)
        //     }
        //     else 
        //         return resolve()
        // })
    });
}