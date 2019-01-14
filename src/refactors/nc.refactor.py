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
#     dfMetricNames: string[],
#     lat: number,
#     long: number,
#     scales: number[],
#     offsets: number[],
#     step: number
# }

argv = json.loads(sys.argv[1])
variableNumber = len(argv['dfMetricNames'])
if 'scales' not in argv.keys():
    argv['scales'] = np.ones((variableNumber))
if 'offsets' not in argv.keys():
    argv['offsets'] = np.zeros((variableNumber))
if 'step' not in argv.keys():
    argv['step'] = 1


dataset = Dataset(argv['inputFilePath'], 'r', format='NETCDF4')
result = []
for i, variableName in enumerate(argv['dfMetricNames']):
    variable = dataset.variables[variableName]
    latIndex = (float(argv['lat']) - LAT_START) // GRID_LENGTH
    longIndex = (float(argv['long']) - LON_START) // GRID_LENGTH
    scale = argv['scales'][i]
    offset = argv['offsets'][i]
    step = argv['step']
    start = argv['start']
    end = argv['end']
    
    col = variable[:, latIndex, longIndex]
    compressedCol = []
    for j in range(start, end, step):
        compressedCol.append(col[j:j+step].mean())
    result.append(np.array(compressedCol) * scale + offset)

dataset.close()

formatted = []
for i,row in enumerate(np.array(result).tolist()):
    formatted.append([])
    for j,cell in enumerate(row):
        formatted[i].append(round(cell, 4))

print(json.dumps(formatted))