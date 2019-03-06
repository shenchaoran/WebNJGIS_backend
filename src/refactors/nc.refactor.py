import sys
import json
import numpy as np
from netCDF4 import Dataset
import math

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
#     argv['step']: number
# }

argv = json.loads(sys.argv[1])
variableNumber = len(argv['dfMetricNames'])
if 'scales' not in argv.keys():
    argv['scales'] = np.ones((variableNumber))
if 'offsets' not in argv.keys():
    argv['offsets'] = np.zeros((variableNumber))
if 'step' not in argv.keys():
    argv['step'] = 1
if 'mins' not in argv.keys():
    argv['mins'] = None
if 'maxs' not in argv.keys():
    argv['maxs'] = None
if 'missing_values' not in argv.keys():
    argv['missing_values'] = None

dataset = Dataset(argv['inputFilePath'], 'r', format='NETCDF4')
result = []
for i, variableName in enumerate(argv['dfMetricNames']):
    variable = dataset.variables[variableName]
    latIndex = (float(argv['lat']) - LAT_START) // GRID_LENGTH
    longIndex = (float(argv['long']) - LON_START) // GRID_LENGTH
    scale = argv['scales'][i]
    offset = argv['offsets'][i]
    minV = argv['mins'][i]
    maxV = argv['maxs'][i]
    missingV = argv['missing_values'][i]
    
    col = variable[:, latIndex, longIndex].data
    subcol = np.resize(
        col[argv['start']: argv['end']], 
        math.ceil((argv['end']-argv['start'])/argv['step'])*argv['step']
    ).reshape(-1, argv['step'])
    subcol = np.ma.array(subcol)
    if minV != None:
        subcol = np.ma.masked_where(subcol <= minV, subcol)
    if maxV != None:
        subcol = np.ma.masked_where(subcol >= maxV, subcol)
    if missingV != None:
        subcol = np.ma.masked_where(subcol == missingV, subcol)
        # subcol[subcol==missingV]= -999999
    subcol = np.ma.masked_invalid(subcol)
    meaned = subcol.mean(axis=1)
    meaned = np.ma.filled(meaned, np.nan)
    meaned = np.array(meaned) * scale + offset
    result.append(meaned)

dataset.close()

formatted = []
for i,row in enumerate(np.array(result).tolist()):
    formatted.append([])
    for j,cell in enumerate(row):
        formatted[i].append(round(cell, 4))

print(json.dumps(formatted))