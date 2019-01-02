import sys, getopt
import numpy as np
from cmip import CMIP
import matplotlib.pyplot as plt
import matplotlib.cm as cm

def set_box_color(bp, color):
    plt.setp(bp['boxes'], color=color)
    plt.setp(bp['whiskers'], color=color)
    plt.setp(bp['caps'], color=color)
    plt.setp(bp['medians'], color=color)

if __name__ == '__main__':
    try:
        cmip = CMIP()
        seriesNum = cmip.ncCount
        regionNum = cmip.regionCount
        for i,_ in enumerate(range(cmip.ncCount)):
            seriesData = []
            for j, data in enumerate(cmip.getSubRegionData(i, allTime=True)):
                data = data.reshape(data.size)
                seriesData.append(data.compressed())
            positions = np.arange(0, regionNum)*seriesNum + i - (seriesNum/2) + 0.5
            box = plt.boxplot(seriesData, positions=positions, sym='', widths=0.3)
            percent = (i+1)/cmip.ncCount
            color = cm.jet(percent)
            set_box_color(box, color)
            plt.plot([], c=color, label=cmip.markerLabels[i])

            progress = (i+1)*100/cmip.ncCount
            print('-----Progress:%.2f%%-----' % progress)
        plt.legend()
        ticks = ['R' + str(i+1) for i in np.arange(0, regionNum)]
        plt.xticks(range(0, regionNum*seriesNum, seriesNum), ticks)
        plt.xlim(-seriesNum, regionNum*seriesNum)
        plt.tight_layout()
        # plt.show()
        plt.savefig(cmip.output, format='png', transparent=True)
        plt.close('all')
        print('******** CMIP-PY-START')
        print('******** CMIP-PY-END')
    except Exception as instance:
        print(instance)
        sys.exit(1)