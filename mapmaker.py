from shapely.geometry import Polygon
from shapely.wkb import loads
from osgeo import ogr, osr
from matplotlib import pyplot
import sys






def drawpolygon(p,graph):
    #print type(p)
    
    bordercolor=(80/255.0,80/255.0,80/255.0)
    borderwidth=0.5
    color=(0,1,0)
    if not(hasattr(p,'geoms')):            
        xList,yList = p.exterior.xy
        graph.fill(xList,yList, color=color)
        graph.plot(xList,yList, 
                   color=bordercolor,
                   linewidth=borderwidth)
        return
    else:
        for poly in p:
            xList,yList = poly.exterior.xy
            graph.fill(xList,yList,color=color)
            graph.plot(xList,yList,
                        color=bordercolor,
                        linewidth=borderwidth)


filename="wp_2012s.shp"
data="polen_2013.csv"
fig = pyplot.figure(figsize=(7, 8),dpi=300)
ax = fig.add_subplot(111)


print 'reading data'
sh = ogr.Open("f:\\data\\maps\\shapefiles\\"+filename)
driver = ogr.GetDriverByName('ESRI Shapefile')
layer = sh.GetLayer()

for feature in layer:
    print feature.GetFieldCount()
    print feature.GetField("GM_NAAM")
    print feature.DumpReadable()
    sys.exit()
    geom=feature.GetGeometryRef()
    if geom is not None:    
        geometryParcel = loads(geom.ExportToWkb())
        drawpolygon(geometryParcel , ax)
print 'saving img'
pyplot.savefig('datafile.png')



