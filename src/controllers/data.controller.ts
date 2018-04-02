import { Response, Request, NextFunction } from 'express';
import * as formidable from 'formidable';
import * as Promise from 'bluebird';
import * as _ from 'lodash';
import * as path from 'path';
import { ObjectID } from 'mongodb';
import * as fs from 'fs';
const request = require('request');
import * as unzip from 'unzip';

import { setting } from '../config/setting';
import { geoDataDB, GeoDataClass, STD_DATA } from '../models/UDX-data.model';
import * as APIModel from '../models/api.model';
import * as RequestCtrl from './request.controller';
const debug = require('debug');
const dataDebug = debug('WebNJGIS: Data');
import * as UDXComparators from './UDX.compare.controller';
import { UDXCfg } from '../models/UDX-cfg.class';
import { UDXSchema } from '../models/UDX-schema.class';
import { ResourceSrc } from '../models/resource.enum';

export default class DataCtrl {
    constructor() {}
	static find = (req: Request, res: Response, next: NextFunction) => {
		geoDataDB
			.find({})
			.then(docs => {
				res.locals.resData = docs;
				res.locals.template = {};
				res.locals.succeed = true;
				return next();
			})
			.catch(next);
	};

	static remove = (req: Request, res: Response, next: NextFunction) => {
		if (req.params.id != undefined) {
			geoDataDB
				.remove({ _id: req.params.id })
				.then(docs => {
					res.locals.resData = docs;
					res.locals.template = {};
					res.locals.succeed = true;
					return next();
				})
				.catch(next);
		} else {
			return next(
				new Error("can't find related resource in the database!")
			);
		}
	};

	/**
	 * 条目保存到数据库，文件移动到upload/geo-data中
	 * 如果数据为zip则解压
	 */
	static insert = (req: Request, res: Response, next: NextFunction) => {
		const form = new formidable.IncomingForm();
		form.encoding = 'utf-8';
		form.uploadDir = path.join(setting.uploadPath, 'geo-data');
		form.keepExtensions = true;
		form.maxFieldsSize = 500 * 1024 * 1024;
		form.parse(req, (err, fields, files) => {
			if (err) {
				return next(err);
			}
			if (files['geo-data']) {
				const file = files['geo-data'];
				const filename = file.name;
				const ext = filename.substr(filename.lastIndexOf('.'));
				const oid = new ObjectID();
				const newName = oid + ext;

				const newPath = path.join(
					setting.uploadPath,
					'geo-data',
					newName
				);
				fs.rename(file.path, newPath, err => {
					if (err) {
						return next(err);
					}
					if (ext === '.zip') {
						const unzipPath = path.join(
							setting.uploadPath,
							'geo-data',
							oid.toHexString()
						);
						try {
                            // console.log(newPath);
                            // console.log(unzipPath);
							fs
								.createReadStream(newPath)
								.pipe(unzip.Extract({ path: unzipPath }))
								.on('error', err => next(err))
								.on('close', () => {
                                    // TODO 为什么这里会崩？？？
									const cfgPath = path.join(
										unzipPath,
										'index.json'
                                    );
									DataCtrl.parseUDXCfg(cfgPath).then(udxcfg => {
										const newItem = {
											_id: oid,
											meta: {
												name: filename,
												path: oid.toHexString(),
												desc: fields.desc
											},
											auth: {
												userId: fields.userId,
												src: fields.src
											},
											udxcfg: udxcfg
										};
										geoDataDB
											.insert(newItem)
											.then(doc => {
												// console.log(doc);
												res.locals.resData = {
													doc: doc
												};
												res.locals.template = {};
												res.locals.succeed = true;
												return next();
											})
											.catch(next);
									});
								});
						} catch (e) {
							console.log(e);
							return next(e);
						}
					} else {
						dataDebug('Upload data type error!');
						return next(new Error('Upload data type error!'));
					}
				});
			}
		});
	};

	static download = (id: string): Promise<any> => {
		return new Promise((resolve, reject) => {
			geoDataDB
				.find({ _id: id })
				.then(docs => {
					if (docs.length) {
                        const doc = docs[0];
                        const fname = doc.meta.name;    
				        const ext = fname.substr(fname.lastIndexOf('.'));
						const fpath = path.join(
							setting.uploadPath,
							'geo-data',
                            doc.meta.path + ext,
						);
						fs.stat(fpath, (err, stats) => {
							if (err) {
								if (err.code === 'ENOENT') {
									return reject(
										new Error("can't find data file!")
									);
								}
								return reject(err);
							} else {
								fs.readFile(fpath, (err, data) => {
									if (err) {
										return reject(err);
									} else {
										return resolve({
											length: data.length,
											filename: doc.meta.name,
											data: data
										});
									}
								});
							}
						});
					} else {
						return reject(new Error("can't find data file!"));
					}
				})
				.catch(reject);
		});
	};

	static visualization = (req: Request, res: Response, next: NextFunction) => {};

	static parseUDXCfg = (cfgPath: string): Promise<UDXCfg> => {
		const folderPath = cfgPath.substring(
			0,
			cfgPath.lastIndexOf('index.json')
		);
		return new Promise((resolve, reject) => {
			fs.readFile(cfgPath, (err, dataBuf) => {
				if (err) {
					return reject(err);
				}
				try {
					// const udxcfg = new UDXCfg();
					const cfgStr = dataBuf.toString();
					const udxcfg = JSON.parse(cfgStr);
					return resolve(udxcfg);
				} catch (e) {
					return reject(e);
				}
			});
		});
	};
}