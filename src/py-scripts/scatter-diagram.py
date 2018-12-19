import matplotlib.pyplot as plt
import numpy as np
import skill_metrics as sm
import sys, getopt
from os import path
from functools import reduce
from matplotlib.ticker import NullFormatter
from cmip import CMIP


if __name__ == '__main__':
    try:
        cmip = CMIP()
        if len(cmip.ncPaths) != 2:
            raise Exception('Invalid input netcef file number')
        
        # TODO 这里取的是第一年的数据，应该每年都做一份散点图
        xDataset = cmip.getData(0, allTime=False, timeIndex=0)
        xDataset = xDataset.reshape(xDataset.size)
        yDataset = cmip.getData(1, allTime=False, timeIndex=0)
        yDataset = yDataset.reshape(yDataset.size)
        
        nullfmt = NullFormatter()

        left, width = 0.1, 0.65
        bottom, height = 0.1, 0.65
        bottom_h = left_h = left + width + 0.02
        rect_scatter = [left, bottom, width, height]
        rect_histx = [left, bottom_h, width, 0.2]
        rect_histy = [left_h, bottom, 0.2, height]

        plt.figure(1, figsize=(8, 8))

        axScatter = plt.axes(rect_scatter)
        axHistx = plt.axes(rect_histx)
        axHisty = plt.axes(rect_histy)

        axHistx.xaxis.set_major_formatter(nullfmt)
        axHisty.yaxis.set_major_formatter(nullfmt)
        
        axScatter.set_xlabel(cmip.markerLabels[0])
        axScatter.set_ylabel(cmip.markerLabels[1])

        axScatter.scatter(xDataset, yDataset, alpha=0.4)
        axHistx.hist(xDataset.compressed(), bins = 50)
        axHisty.hist(yDataset.compressed(), bins = 50, orientation='horizontal')
        
        z1 = np.polyfit(xDataset, yDataset, 1)
        p1 = np.poly1d(z1)
        if abs(z1[0]) > 0.2:
            x = np.linspace(xDataset.min(), xDataset.max(), 20)
            y = np.polyval(p1, x)
            axScatter.plot(x, y, '-', color='#ff7f0e')

        # plt.show()
        plt.savefig(cmip.output, format='png', transparent=True)
        print('******** CMIP-PY-START')
        print('SUCCESS')
        print('******** CMIP-PY-END')
    except Exception as instance:
        print(instance)
        sys.exit(1)
        