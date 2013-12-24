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

fig = pyplot.figure(figsize=(7, 8),dpi=300)
ax = fig.add_subplot(111)

#EPSG:28992
#epsg:3857 


source = osr.SpatialReference()
source.ImportFromEPSG(28992)

target = osr.SpatialReference()
target.ImportFromEPSG(3857)
transform = osr.CoordinateTransformation(source, target)

print 'reading data'
sh = ogr.Open("f:\\data\\maps\\shapefiles\\gm_2012.shp")
driver = ogr.GetDriverByName('ESRI Shapefile')
layer = sh.GetLayer()
print layer.GetName()
defn=layer.GetLayerDefn()
print defn.GetName()



for feature in layer:
    print feature.GetFieldCount()
    print feature.GetField("GM_NAAM")
    print feature.DumpReadable()
   # print feature.GetFieldDefnRef(1)
    sys.exit()
    #geom = feature.GetGeometryRef()
    #print geom.Centroid().ExportToWkt()    
    geom=feature.GetGeometryRef()
    if geom is not None:    
        geometryParcel = loads(geom.ExportToWkb())
       # newgeo=ogr.CreateGeometryFromWkt(geometryParcel)
      #  newgeo.Transform(transform)
        drawpolygon(geometryParcel , ax)
print 'saving img'
pyplot.savefig('datafile.png')
pyplot.savefig('datafile.svg')    



