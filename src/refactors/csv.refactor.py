import pandas as pd
import sys
import json
import numpy as np
import pymongo

# {
#     header: number | None,
#     inputFilePath: string,
#     colIndexs: number[],
#     dfMetricNames: string[],
#     sep: string,
#     skiprows: number,
#     scales: number[],
#     offsets: number[],
#     step: number
# }

argv = json.loads(sys.argv[1])

# connection = pymongo.MongoClient('223.2.35.73', 27017)
# cmpDB = connection['Comparison']
# metricTable = cmpDB['Metric']
# METRIC = metricTable.find_one({ "name" : argv['metricName']})

colNumber = len(argv['colIndexs'])
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

if argv['header'] == 'None':
    argv['header'] = None
if argv['sep'] == 's+':
    argv['sep'] = '\s+'

site = pd.read_csv(argv['inputFilePath'], usecols=argv['colIndexs'], \
    sep=argv['sep'], header=argv['header'], skiprows=argv['skiprows'])

cols = np.array(site.values.T)

if 'end' not in argv.keys():
    argv['end'] = site.iloc[:,0].shape[0]
# TODO not step but average
result = []
for i in range(cols.shape[0]):
    col = []
    for j in range(argv['start'], argv['end'], argv['step']):
        col.append(cols[i][j:j+argv['step']].mean())
    # result.append((cols[i][argv['start']: argv['end']: argv['step']] * argv['scales'][i] + argv['offsets'][i]))
    result.append(np.array(col) * argv['scales'][i] + argv['offsets'][i])

formatted = []
for i,row in enumerate(np.array(result).tolist()):
    formatted.append([])
    for j,cell in enumerate(row):
        formatted[i].append(round(cell, 4))
print(json.dumps(formatted))