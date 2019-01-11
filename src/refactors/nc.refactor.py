import sys
import json
import numpy as np
from netCDF4 import Dataset

GRID_LENGTH = 0.5
LON_START = -179.75
LON_END = 179.75 + GRID_LENGTH
LAT_START = -54.75
LAT_END = 82.25 + GRID_LENGTH

# {
#     inputFilePath: string,
#     fields: string[],
#     lat: number,
#     long: number,
#     scales: number[],
#     offsets: number[],
#     step: number
# }

params = json.loads(sys.argv[1])
variableNumber = len(params['fields'])
if 'scales' not in params.keys():
    params['scales'] = np.ones((variableNumber))
if 'offsets' not in params.keys():
    params['offsets'] = np.zeros((variableNumber))
if 'step' not in params.keys():
    params['step'] = 1


dataset = Dataset(params['inputFilePath'], 'r', format='NETCDF4')
result = []
for i, variableName in enumerate(params['fields']):
    variable = dataset.variables[variableName]
    latIndex = (params['lat'] - LAT_START) // GRID_LENGTH
    longIndex = (params['long'] - LON_START) // GRID_LENGTH
    scale = params['scales'][i]
    offset = params['offsets'][i]
    step = params['step']
    result.append(variable[:, latIndex, longIndex][::step] * scale + offset)

dataset.close()

formatted = []
for i,row in enumerate(np.array(result).tolist()):
    formatted.append([])
    for j,cell in enumerate(row):
        formatted[i].append(round(cell, 4))

print(json.dumps(formatted))