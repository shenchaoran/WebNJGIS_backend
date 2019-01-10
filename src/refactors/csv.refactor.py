import csv
import pandas
import sys, getopt
import json
import numpy as np

# {
#     header: number | None,
#     inputFilePath: string,
#     colIndexs: number[],
#     sep: string,
#     skiprows: number,
#     scales: number[],
#     offsets: number[],
#     step: number
# }

# TODO \ 转义
# argvStr = sys.argv[1].replace('\\s+', '\s+')
params = json.loads(sys.argv[1])
if params['header'] == 'None':
    params['header'] = None
if params['sep'] == 's+':
    params['sep'] = '\s+'

site = pandas.read_csv(params['inputFilePath'], usecols=params['colIndexs'], \
    sep=params['sep'], header=params['header'], skiprows=params['skiprows'])

cols = np.array(site.values.T)
colNumber = len(params['colIndexs'])
if 'scales' not in params.keys():
    params['scales'] = np.ones((colNumber))
if 'offsets' not in params.keys():
    params['offsets'] = np.zeros((colNumber))
if 'step' not in params.keys():
    params['step'] = 1

# TODO not step but average
result = []
for i in range(cols.shape[0]):
    result.append((cols[i]*params['scales'][i] + params['offsets'][i])[::params['step']])

# print('******** Refactor-START')
print(np.array(result).tolist())
# print('******** Refactor-END')