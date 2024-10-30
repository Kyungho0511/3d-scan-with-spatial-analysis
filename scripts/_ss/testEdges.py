
# requirements: pandas
# requirements: numpy
# requirements: cv2


import numpy as np
import locale
locale.setlocale(locale.LC_ALL, 'en_US')
import pandas as pd

import pyarrow.parquet as pq

def getPointsFromDF(df):
    x = df['x'].tolist()
    y = df['y'].tolist()
    z = df['z'].tolist()
    print(x)
    pts = []

    for i in range(len(x)):
        pt = rg.Point3d(x[i], y[i], z[i])
        pts.append(pt)
        i = i+1
    
    return pts



# Read the Parquet file
table = pq.read_table(file_path)

# Convert to a pandas DataFrame if needed
df = table.to_pandas()
df_sample = df.sample(n=globalFilt, random_state=1)


dfWalls = df_sample[df_sample['cat'] == 2]
dfFloor = df_sample[df_sample['cat'] == 1]
dfCeiling = df_sample[df_sample['cat'] == 0]
dfWindow =df_sample[df_sample['cat'] == 10]



df_sampleWalls = dfWalls.sample(n=filt, random_state=1)
df_sampleFloor = dfFloor.sample(n=filt, random_state=1)
df_sampleCeiling = dfCeiling.sample(n=filt, random_state=1)

wallPts = getPointsFromDF(df_sampleWalls)
floorPts = getPointsFromDF(df_sampleFloor)
ceilingPts = getPointsFromDF(df_sampleCeiling)
windowPts = getPointsFromDF(dfWindow)




volume = floorPts.delaunay_3d(alpha=2.)
shell = volume.extract_geometry()
shell.plot()