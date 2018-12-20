from mpl_toolkits.basemap import Basemap
import matplotlib.pyplot as plt
import sys, getopt
from os import path,chmod, remove
import numpy as np
from math import ceil, floor
from pyproj import Proj, transform
import imageio
from cmip import CMIP
import matplotlib.cm as cm

GRID_LENGTH = 0.5
LON_START = -179.75
LON_END = 179.75 + GRID_LENGTH
LAT_START = -54.75
LAT_END = 82.25 + GRID_LENGTH

TIME_SPAN = 32 * 365
TIME_START = 1982
TIME_END = TIME_START + TIME_SPAN

if __name__ == '__main__':
    try:
        cmip = CMIP()

        dataList = []
        for i,_ in enumerate(range(cmip.ncCount)):
            data = cmip.getData(i, allTime=True)
            dataList.append(data)

        plotsNumber = len(cmip.ncPaths)
        # if plotsNumber <= 2:
        #     colNumber = plotsNumber
        # else:
        #     colNumber = 3
        colNumber = 1
        rowNumber = ceil(plotsNumber/colNumber)

        # TODO bias
        # TODO progress
        dpi = 100
        gifPath = cmip.output + '.gif'

        with imageio.get_writer(gifPath, mode='I', duration=1) as writer:
            for l, timeLabel in enumerate(cmip.timeLabels):
                figW = abs(cmip.longCount/dpi*8)
                # TODO 长宽比
                # figH =  abs(cmip.latCount * figW / cmip.longCount)
                figH = (560 * figW / 900 * 2)
                fig = plt.figure(figsize=(figW, figH), tight_layout=True, dpi=dpi)
                outputPath = cmip.output + '-' + timeLabel + '.png'
                # 太慢了，测试通过了就注释掉这里
                if l < 2:
                    for j in range(rowNumber):
                        for k in range(colNumber):
                            plotIndex = j*colNumber + k + 1
                            if plotIndex <= cmip.ncCount:
                                data = dataList[plotIndex-1][l, :, :]
                                ax = fig.add_subplot(rowNumber, colNumber, plotIndex)
                                ax.set_title(cmip.markerLabels[plotIndex-1] + '-' + timeLabel)
                                plt.sca(ax)
                                m = Basemap(epsg='3857', \
                                    llcrnrlon = LON_START, llcrnrlat = LAT_START, \
                                    urcrnrlon = LON_END, urcrnrlat = LAT_END, \
                                    resolution = 'l')
                                m.drawcoastlines(linewidth=0.5)
                                m.drawcountries(linewidth=0.25)
                                xx, yy = np.meshgrid(cmip.longVariable[:], cmip.latVariable[:])
                                cs = m.contourf(xx, yy, data, latlon=True, cmap=cm.jet)
                                m.colorbar(cs, location='bottom')

                    # TODO progress doesn't work, because of parallel compute
                    progress = (l+1)*100/ cmip.timeCount
                    print('-----Progress:%.2f%%-----' % progress)
                    fig.tight_layout()
                    plt.savefig(outputPath, format='png', transparent=True)
                    image = imageio.imread(outputPath)
                    writer.append_data(image)

        print('******** CMIP-PY-START')
        print('SUCCESS')
        print('******** CMIP-PY-END')
    except Exception as instance:
        print(instance)
        sys.exit(1)