from shapely.geometry import Polygon
from shapely.wkb import loads
from osgeo import ogr, osr
from matplotlib import pyplot
from math import log, log10
import sys






def drawpolygon(p,graph,colorval):
    #print type(p)
  #  print colorval
    bordercolor=(80/255.0,80/255.0,80/255.0)
    borderwidth=0.5    
    if not(hasattr(p,'geoms')):            
        xList,yList = p.exterior.xy
        graph.fill(xList,yList, color=colorval)
        graph.plot(xList,yList, 
                   color=bordercolor,
                   linewidth=borderwidth)
        return
    else:
        for poly in p:
            xList,yList = poly.exterior.xy
            graph.fill(xList,yList,color=colorval)
            graph.plot(xList,yList,
                        color=bordercolor,
                        linewidth=borderwidth)


def rescale_color (val, minval, maxval):

    minval=0;
    maxval=log(maxval)    
    if val is None:
        return (1.0,1.0,1.0)
    if val!=0:
        val=log(val)
        
    if val<minval:
        val=minval
    if val>maxval:
        val=maxval
    val=(val-minval)/(1.0*(maxval-minval))   # range van 0 tot 1
    
  #  print 'ranged val:', val

    colorval=(1-val,1-val,1)
    return colorval
    
    

def get_max_data(filename):

    f=open("data\\"+filename)
    f.readline()
    cols=f.readline().strip().split(',')
    maxdata=int(cols[-1])
    for line in f.readlines():
        cols=line.strip().split(',')
        val=int(cols[-1])
        if val>maxdata:
            maxdata=val
    return maxdata

def read_frame(f,varnames, prevline=None):
    
    datadict={}
    
    cols=prevline.strip().split(',')
    prevcol=None
    while prevcol is None or prevcol==cols[0]:        
        prevcol=cols[0]
        datadict[cols[1]]=int(cols[-1])
        line=f.readline()
        cols=line.strip().split(',')      
        if len(cols)<=1:
            return None, None, None
  #  print datadict.items()
    return datadict, prevcol, line






def save_map (mapdata, filename, layer):
   # print mapdata
    fig = pyplot.figure(figsize=(7, 8),dpi=300)
    ax = fig.add_subplot(111)

    nonecounter=0
    for feature in layer:
       # print feature.GetFieldCount()
        regio=feature.GetField("BAG")        
        val=mapdata.get(regio,None)
        if val is None:
            nonecounter+=1
        colorval=rescale_color (val, 0, maxdata)
       # print feature.DumpReadable()
        #if val is not None:
        #    print regio, val, colorval, val/(1.0*maxdata)
      #  continue
        geom=feature.GetGeometryRef()
        if geom is not None:    
            geometryParcel = loads(geom.ExportToWkb())
            drawpolygon(geometryParcel , ax, colorval)    
    print 'saving img:%s (nones:%d)' % (filename, nonecounter)
    pyplot.savefig(filename+'.png')
    pyplot.close()
    


filename="wp_2012s.shp"
data="polen_2013.csv"


print 'reading data'

driver = ogr.GetDriverByName('ESRI Shapefile')


f=open ('data\\'+data)
varnames=f.readline().strip().split(',')
maxdata=get_max_data(data)

line=f.readline()
mapdata, datum, line=read_frame(f,varnames,line)
j=0
while mapdata is not None:
    outfile='polen_'+datum
    sh = ogr.Open("f:\\data\\maps\\shapefiles\\"+filename)
    layer = sh.GetLayer()
    save_map (mapdata, outfile, layer)
    mapdata, datum, line=read_frame(f,varnames, line)
    j+=1
        
