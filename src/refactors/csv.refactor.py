import pandas as pd
import sys
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

# argvStr = sys.argv[1].replace('\\s+', '\s+')

params = json.loads(sys.argv[1])
colNumber = len(params['colIndexs'])
if 'header' not in params.keys():
    params['header'] = None
if 'scales' not in params.keys():
    params['scales'] = np.ones((colNumber))
if 'offsets' not in params.keys():
    params['offsets'] = np.zeros((colNumber))
if 'step' not in params.keys():
    params['step'] = 1
if 'sep' not in params.keys():
    params['sep'] = '\s+'
if 'skiprows' not in params.keys():
    params['skiprows'] = 0

if params['header'] == 'None':
    params['header'] = None
if params['sep'] == 's+':
    params['sep'] = '\s+'

site = pd.read_csv(params['inputFilePath'], usecols=params['colIndexs'], \
    sep=params['sep'], header=params['header'], skiprows=params['skiprows'])

cols = np.array(site.values.T)

# TODO not step but average
result = []
for i in range(cols.shape[0]):
    result.append((cols[i]*params['scales'][i] + params['offsets'][i])[::params['step']])

formatted = []
for i,row in enumerate(np.array(result).tolist()):
    formatted.append([])
    for j,cell in enumerate(row):
        formatted[i].append(round(cell, 4))
print(json.dumps(formatted))