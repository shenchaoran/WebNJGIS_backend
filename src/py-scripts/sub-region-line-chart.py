import sys, getopt
import numpy as np
from cmip import CMIP

if __name__ == '__main__':
    try:
        cmip = CMIP()
        # region, model, time
        modelRegionTime3D = []
        for i,_ in enumerate(range(cmip.ncCount)):
            regionTime2D = []
            for j, data in enumerate(cmip.getSubRegionData(i, allTime=True)):
                data = data.reshape(data.shape[0], data.shape[1]*data.shape[2])
                regionTime2D.append(data.mean(1))
            modelRegionTime3D.append(regionTime2D)
            progress = (i+1)*100/cmip.ncCount
            print('-----Progress:%.2f%%-----' % progress)
        result = np.array(modelRegionTime3D).transpose(1, 0, 2)
        print('******** CMIP-PY-START')
        print(result.tolist())
        print('******** CMIP-PY-END')
    except Exception as instance:
        print(instance)
        sys.exit(1) 