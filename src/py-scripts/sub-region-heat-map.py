import sys, getopt
import numpy as np
from cmip import CMIP

if __name__ == '__main__':
    try:
        cmip = CMIP()
        modelStatRegion3D = []
        for i,_ in enumerate(range(cmip.ncCount)):
            meanValues = []
            biasValues = []
            stdValues = []
            coefValues = []
            rmseValues = []
            for j, data in enumerate(cmip.getSubRegionData(i, allTime=True)):
                data = data.reshape(data.size)
                meanValues.append(data.mean())
                biasValues.append(data.std())
                stdValues.append(biasValues[j])
                coefValues.append(biasValues[j])
                rmseValues.append(biasValues[j])
            modelStatRegion3D.append([meanValues, biasValues, stdValues, coefValues, rmseValues])
            progress = (i+1)*100/cmip.ncCount
            print('-----Progress:%.2f%%-----' % progress)
        result = np.array(modelStatRegion3D).transpose(1, 0, 2)
        print('******** CMIP-PY-START')
        print(result.tolist())
        print('******** CMIP-PY-END')
    except Exception as instance:
        print(instance)
        sys.exit(1)

