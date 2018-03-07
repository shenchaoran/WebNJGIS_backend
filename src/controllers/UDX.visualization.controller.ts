import * as _ from 'lodash';
const xpath = require('xpath');
const dom = require('xmldom').DOMParser;
import * as Promise from 'bluebird';
import * as path from 'path';
import { ObjectID } from 'mongodb';
import * as fs from 'fs';
const request = require('request');
const debug = require('debug');
const visualDebug = debug('WebNJGIS: Visualization');
import * as Canvas from 'canvas';
// const Canvas = require('canvas');
import * as proj4x from 'proj4';
import { setting } from '../config/setting';
const proj4 = (proj4x as any).proj4;

import { UDXTableXML, geoDataDB, CmpMethodEnum, CmpState } from '../models';
import * as StringUtils from '../utils/string.utils';
import { UDXCfg } from '../models/UDX-cfg.class';
import { SchemaName } from '../models/UDX-schema.class';

export const parse = (dataId: string, method?: string): Promise<any> => {
	return new Promise((resolve, reject) => {
		geoDataDB
			.find({ _id: dataId })
			.then(rsts => {
				if (rsts.length) {
					const doc = rsts[0];
					return Promise.resolve(doc);
				} else {
					return reject(new Error("can't find geo-data!"));
				}
			})
			.then(doc => {
				let promiseFunc = undefined;
				switch (doc.udxcfg.schema$.type) {
					case SchemaName[SchemaName.TABLE_RAW]:
						if (
							method === undefined ||
							method === CmpMethodEnum[CmpMethodEnum.TABLE_CHART]
						) {
							promiseFunc = showRAWTable(doc);
						}
						break;
					case SchemaName[SchemaName.ASCII_GRID_RAW]:
						if (
							method === undefined ||
							method ===
								CmpMethodEnum[
									CmpMethodEnum.ASCII_GRID_VISUALIZATION
								]
						) {
							promiseFunc = showRAWAsciiBatch(doc);
						} else if (
							method === CmpMethodEnum[CmpMethodEnum.GIF]
						) {
							reject(new Error('TODO'));
						}
						break;
					case SchemaName[SchemaName.SHAPEFILE_RAW]:
						if (
							method === undefined ||
							method ===
								CmpMethodEnum[
									CmpMethodEnum.SHAPEFILE_VISUALIZATION
								]
						) {
							promiseFunc = showRAWShp(doc);
						}
						break;
					default:
						return reject(new Error('TODO'));
				}

				promiseFunc
					.then(parsed => {
						return resolve({
							type: doc.udxcfg.schema$.id,
							parsed: parsed
						});
					})
					.catch(reject);
			})
			.catch(reject);
	});
};

// deprecated
export const showXMLTable = (udxStr): Promise<UDXTableXML> => {
	return new Promise((resolve, reject) => {
		try {
			const doc = new dom().parseFromString(udxStr);
			const colNodes = xpath.select(
				"/dataset/XDO[@name='table']/XDO",
				doc
			);
			const table = new UDXTableXML();
			const rowsData: Array<any> = [];
			_.chain(colNodes)
				.map((colNode, colIndex) => {
					const nameNode = xpath.select1('@name', colNode);
					const kernelTypeNode = xpath.select1(
						'@kernelType',
						colNode
					);
					const valueNode = xpath.select1('@value', colNode);
					let name = undefined;
					let kernelType = undefined;
					let value = undefined;

					let column = undefined;
					if (nameNode) {
						name = nameNode.value;
						column = {
							data: name,
							title: StringUtils.upper1st(name),
							readOnly: true
						};
					}
					if (kernelTypeNode) {
						let type = kernelTypeNode.value;
						type = type.split('_')[0];
						kernelType = type;
						// column.type = type;
					}
					table.columns.push(column);

					if (valueNode) {
						value = valueNode.value;
						value = _.split(value, ';');
						value = _.map(value, _.trim);
						switch (kernelType) {
							case 'string_array':
								break;
							case 'int_array':
								value = _.map(value, parseInt);
								break;
							case 'real_array':
								value = _.map(value, parseFloat);
								break;
						}
						_.map(value, (td, rowIndex) => {
							if (rowsData.length <= rowIndex) {
								rowsData.push({});
							}
							_.set(rowsData[rowIndex], name, td);
						});
					}
				})
				.value();

			table.data = rowsData;
			return resolve(table);
		} catch (e) {
			return reject(e);
		}
	});
};

export const showRAWTable = (doc: any): Promise<any> => {
	const udxcfg = doc.udxcfg;
	return new Promise((resolve, reject) => {
        const fPath = path.join(
            setting.uploadPath,
            'geo-data',
            doc.meta.path,
            udxcfg.elements.entrance
        );
        fs.readFile(fPath, (err, buf) => {
            if(err) {
                return reject(err);
            }
            else {
                const dataStr = buf.toString();
                const rowsStr = dataStr.split('\n');
                const rows = [];
                const rowsObj = [];
                const cols = [];
                _.map(rowsStr, (rowStr, i) => {
                    if (rowStr.trim() !== '') {
                        rows.push(rowStr.split(','));
                    }
                });
                
                // 列名
                _.map(rows[0], (th, i) => {
                    // if (rows[1][i].trim() !== '') {
                    //     rows[0][i] = `${th} (${rows[i][i]})`;
                    // }
                    cols.push({
                        data: rows[0][i],
                        title: StringUtils.upper1st(rows[0][i]),
                        readOnly: true
                    });
                });
                
                const ths = _.remove(rows, (row, i) => i === 0);


                // _.map(rows, (row, i) => {
                //     if (i !== 0) {
                //         const obj: {
                //             [key: string]: any
                //         } = {};
                //         _.map(rows[0], (th, j) => {
                //             _.set(obj, th as any, _.get(row, j));
                //             // obj[th] = _.get(row, j);
                //         });
                //         rowsObj.push(obj);
                //     }
                // });
                
                return resolve({
                    chart: {
                        tableSrc: {
                            data: rows,
                            columns: cols
                        },
                        state: CmpState.FINISHED_SUCCEED
                    }
                });
            }
        });
	});
};

export const showRAWAscii = (doc: any): Promise<any> => {
	return new Promise((resolve, reject) => {
		if (doc.udxcfg.elements.entrance === undefined) {
			return reject(new Error('invalid geo-data config!'));
		}
		const asciiPath = path.join(
			setting.uploadPath,
			'geo-data',
			doc.meta.path,
			doc.udxcfg.elements.entrance
		);
		fs.readFile(asciiPath, (err, buf) => {
			const gridStr = buf.toString();
			const spatial = doc.udxcfg.meta.spatial;
			const folderName = doc.meta.path;
			const entryName = doc.udxcfg.elements.entrance;
			drawAscii(gridStr, spatial, folderName, entryName)
				.then(img => {
					return resolve({
						image: [img]
					});
				})
				.catch(reject);
		});
	});
};

export const showRAWAsciiBatch = (doc: any): Promise<any> => {
	return new Promise((resolve, reject) => {
		const fpath = path.join(setting.uploadPath, 'geo-data', doc.meta.path);
		Promise.all(
			_.map(doc.udxcfg.elements.entries, entry => {
				return new Promise((resolve, reject) => {
					const asciiPath = path.join(
						setting.uploadPath,
						'geo-data',
						doc.meta.path,
						entry as any
					);
					fs.readFile(asciiPath, (err, buf) => {
						const gridStr = buf.toString();
						const spatial = doc.udxcfg.meta.spatial;
						const folderName = doc.meta.path;
						drawAscii(gridStr, spatial, folderName, entry as any)
							.then(resolve)
							.catch(reject);
					});
				});
			})
		)
			.then(rsts => {
				resolve({
					image: rsts
				});
			})
			.catch(reject);
	});
};

export const showRAWShp = (doc: any): Promise<any> => {
	return;
};

export const showRAWShp_INTERPOLATION = (doc: any): Promise<any> => {
	return;
};

export const showGIF = (doc: any): Promise<any> => {
	return;
};

/**
 * 画图并保存
 * @param gridStr
 * @param spatial 空间参考信息
 */
const drawAscii = (
	gridStr: string,
	spatial: any,
	folderName: string,
	entryName: string
): Promise<any> => {
    const end = entryName.lastIndexOf('.');
    if(end) {
        entryName = entryName.substring(0, end);
    }
    
	return new Promise((resolve, reject) => {
		try {
            const rowsStr = _.chain(gridStr)
                .split('\n')
                .reverse()
                .value();
            const cells = _.chain(rowsStr)
                .join(' ')
                .split(' ')
                .map(parseFloat)
                .value();
			const max = _.max(cells);
			const min = _.min(cells);

			const canvasH = spatial.nrows;
			const canvasW = spatial.ncols;
			const canvas = new Canvas(canvasW, canvasH);
            const ctx = canvas.getContext('2d');
            const imgData = ctx.getImageData(0, 0, canvasW, canvasH);
            for(let i=0; i<cells.length; i++) {
                if(cells[i] === spatial.NODATA_value) {
                    imgData.data[i] = imgData.data[i + 1] = imgData.data[i + 2] = 0;
                    imgData.data[i + 4] = 255;
                }
                else {
                    const v = Math.floor((cells[i] - min) / (max - min) * 255);
                    imgData.data[i*4] = v;
                    imgData.data[i*4 + 1] = v;
                    imgData.data[i*4 + 2] = v;
                    imgData.data[i*4 + 3] = 255;    
                }
            }

            // imgData.data = _.reduce(cells, (arr, pixelV) => {
            //     if(pixelV === spatial.NODATA_value) {
            //         return _.concat(arr, [0, 0, 0, 1]);
            //     }
            //     const v = Math.floor((pixelV - min) / (max - min) * 255);
            //     return _.concat(arr, [v, v, v, 1]);
            // }, []);

            // console.log(imgData.data.length);

            ctx.putImageData(imgData, 0, 0);

			// for (let i = 0; i < canvasH; i++) {
			// 	for (let j = 0; j < canvasW; j++) {
			// 		let pixelV = cells[i * canvasH + j];
			// 		if (pixelV === spatial.NODATA_value) {
			// 			ctx.fillStyle = 'rgba(0,0,0,1)';
			// 			ctx.fillRect(j, i, 1, 1);
			// 			continue;
			// 		}
			// 		pixelV = Math.floor((pixelV - min) / (max - min) * 255);
			// 		ctx.fillStyle =
			// 			'rgba(' + pixelV + ',' + pixelV + ',' + pixelV + ',1)';
			// 		ctx.fillRect(j, i, 1, 1);
			// 	}
			// }

            const imgUrl = canvas.toDataURL('imag/png', 1);
            // console.log(imgUrl);
			// TODO  coordinate
			// xll: x low left
			const WSCorner = [spatial.xllcorner, spatial.yllcorner];
			const ENCorner = [
				spatial.xllcorner + spatial.xsize * canvasW,
				spatial.yllcorner + spatial.ysize * canvasH
			];
			// WSCorner = proj4('EPSG:3857').inverse(WSCorner);
			// ENCorner = proj4('EPSG:3857').inverse(ENCorner);
			const base64Data = imgUrl.replace(/^data:image\/\w+;base64,/, '');
            const dataBuf = new Buffer(base64Data, 'base64');
            const imgPath = path.join(folderName, entryName + '.png');

			const dstPath = path.join(
				__dirname,
				'/../upload/geo-data',
				folderName,
				entryName + '.png'
			);
			fs.writeFile(dstPath, dataBuf, err => {
				if (err) {
					return reject(err);
				} else {
					return resolve({
						title: entryName,
						path: imgPath,
						extent: [
							WSCorner[0],
							WSCorner[1],
							ENCorner[0],
							ENCorner[1]
						],
						state: CmpState.FINISHED_SUCCEED
					});
				}
			});
		} catch (e) {
			console.log(e);
			reject(e);
		}
	});
};
