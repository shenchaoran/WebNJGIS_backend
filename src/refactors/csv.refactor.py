import pandas as pd
import sys
import json
import numpy as np
import pymongo
import math

# {
#     header: number | None,
#     inputFilePath: string,
#     colIndexs: number[],              列索引号，不一定对，因为观测数据的列顺序不固定，不推荐用
#     dfMetricNames: string[],          列名
#     sep: string,
#     skiprows: number,
#     scales: number[],
#     offsets: number[],
#     step: number,
#     min
#     max
#     missing_value
# }

argv = json.loads(sys.argv[1])

# connection = pymongo.MongoClient('223.2.35.73', 27017)
# cmpDB = connection['Comparison']
# metricTable = cmpDB['Metric']
# METRIC = metricTable.find_one({ "name" : argv['metricName']})

colNumber = len(argv['dfMetricNames'])
if 'header' not in argv.keys():
    argv['header'] = None
if 'scales' not in argv.keys():
    argv['scales'] = np.ones((colNumber))
if 'offsets' not in argv.keys():
    argv['offsets'] = np.zeros((colNumber))
if 'step' not in argv.keys():
    argv['step'] = 1
if 'sep' not in argv.keys():
    argv['sep'] = '\s+'
if 'skiprows' not in argv.keys():
    argv['skiprows'] = 0
if 'start' not in argv.keys():
    argv['start'] = 0
if 'min' not in argv.keys():
    argv['min'] = None
if 'max' not in argv.keys():
    argv['max'] = None
if 'missing_value' not in argv.keys():
    argv['missing_value'] = None

if argv['header'] == 'None':
    argv['header'] = None
if argv['sep'] == 's+':
    argv['sep'] = '\s+'

if argv['header'] == None:
    cols = argv['colIndexs']
else:
    cols = argv['dfMetricNames']

df = pd.read_csv(argv['inputFilePath'], usecols=cols, \
    sep=argv['sep'], header=argv['header'], skiprows=argv['skiprows'])

if 'end' not in argv.keys():
    argv['end'] = df.iloc[:,0].shape[0]
    
cols = df.values.T

result = []
for i in range(cols.shape[0]):
    scale = argv['scales'][i]
    offset = argv['offsets'][i]
    minV = argv['mins'][i]
    maxV = argv['maxs'][i]
    missingV = argv['missing_values'][i]

    if argv['header'] == None:
        currentCol = cols[i]
    else:
        currentCol = df[argv['dfMetricNames'][i]]

    col = np.resize(
        currentCol[argv['start']: argv['end']], 
        math.ceil((argv['end']-argv['start'])/argv['step'])*argv['step']        # 防止闰年出现，每年只当做有365天
    ).reshape(-1, argv['step'])                                                 # -1表示自己计算行数
    col = np.ma.array(col)
    if minV != None:
        col = np.ma.masked_where(col <= minV, col)
    if maxV != None:
        col = np.ma.masked_where(col >= maxV, col)
    if missingV != None:
        col = np.ma.masked_where(col == missingV, col)

    col = np.ma.masked_invalid(col)
    meaned = col.mean(axis=1)
    meaned = np.ma.filled(meaned, np.nan)
    meaned = np.array(meaned) * scale + offset
    result.append(meaned)
    # result.append((cols[i][start: end: step] * argv['scales'][i] + argv['offsets'][i]))

formatted = []
for i,row in enumerate(np.array(result).tolist()):
    formatted.append([])
    for j,cell in enumerate(row):
        formatted[i].append(round(cell, 4))
print(json.dumps(formatted).replace('NaN', 'null'))