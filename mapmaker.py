from shapely.geometry import Polygon
from shapely.wkb import loads
from osgeo import ogr, osr
from matplotlib import pyplot
from math import log, log10
import sys, argparse

import xml.etree.ElementTree as ET
from StringIO import StringIO






def drawpolygon(p,graph,colorval,regio_id):

    # returns a list of dom-id's for every polygon drawn
    # (multipolygons get
    # dom-id format:  r%regioid_%counter
    # 
    bordercolor=(80/255.0,80/255.0,80/255.0)
    borderwidth=0.5
    
    if not(hasattr(p,'geoms')):            
        xList,yList = p.exterior.xy
        h=graph.fill(xList,yList, color=colorval)
        graph.plot(xList,yList, 
                   color=bordercolor,
                   linewidth=borderwidth)
        for il, element in enumerate(h):
            element.set_gid ("r%d_1" % regio_id)                        
        return ["r%d_1" % regio_id]
    else:
        j=1
        regs=[]
        for poly in p:
            xList,yList = poly.exterior.xy
            h=graph.fill(xList,yList,color=colorval)
            graph.plot(xList,yList,
                        color=bordercolor,
                        linewidth=borderwidth)            
            for il, element in enumerate(h):
                element.set_gid ("r%d_%d" % (regio_id,j) )   # polylines gaan niet goed            
            regs.append("r%d_%d" % (regio_id, j))
            j+=1            
        return regs


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
    colorval=(1,1-val,1-val)
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


def read_simple_frame(f, varnames):
    datadict={}

    for line in f.readlines():
        cols=line.strip().split(',')
        datadict[int(cols[0])]=int(cols[-1])
        if len(cols)<=1:
            return datadict
    return datadict



def save_map (args, mapdata, layer):

    fieldID=args['fieldID']
    outfile=args['outfile']
   # print mapdata
    fig = pyplot.figure(figsize=(7, 8),dpi=300)    
    ax = fig.add_subplot(1,1,1)
    print ax, type(ax)
    nonecounter=0
    j=0
    regios=[]
    for feature in layer:
       # print feature.GetFieldCount()        
        regio=int(feature.GetField(fieldID))        
        val=mapdata.get(regio,None)
        if val is None:
            nonecounter+=1
        else:
            j+=1
        colorval=rescale_color (val, 0, maxdata)
       # print feature.DumpReadable()
        #if val is not None:
        #    print regio, val, colorval, val/(1.0*maxdata)
      #  continue
        geom=feature.GetGeometryRef()
        if geom is not None:    
            geometryParcel = loads(geom.ExportToWkb())
            regios=regios+ drawpolygon(geometryParcel , ax, colorval, regio)
        if j==5:
            break
    print 'saving img:%s (nones:%d)' % (outfile, nonecounter)

    # add classes to DOM-objects
    f = StringIO()
    pyplot.savefig(f, format="svg")
    tree, xmlid = ET.XMLID(f.getvalue())    
    
    
    for r in regios:        
        el = xmlid[r]  # lookup regio_id  in xml
#        el.set('cursor', 'pointer')
#        el.set('onclick', "toggle_hist(this)")
        el.set('class', "outline")
    ET.ElementTree(tree).write(outfile+'.svg')


    
# Apparently, the `register_namespace` method works only with 
# python 2.7 and up and is necessary to avoid garbling the XML name
# space with ns0.
ET.register_namespace("","http://www.w3.org/2000/svg")    


parser = argparse.ArgumentParser(description='generate calendar from repeating data')

parser.add_argument('-s', '--shapefile', dest='shapefile',  help='esri intput shapefile', required=False)
parser.add_argument('-f', dest='fieldID',  help='shapefile area key variabele', required=False, default=',')                               
parser.add_argument('-c', '--csv', dest='csv',  help='csv input file name', required=False)
parser.add_argument('-d', dest='sep',  help='delimiter of csv infile', required=False, default=',')
parser.add_argument('-o', dest='outfile',  help='output basename for .svg/.js', required=False, default='')
args=vars(parser.parse_args())



shapefile=args["shapefile"]
csvfile=args["csv"]


print 'reading data'

driver = ogr.GetDriverByName('ESRI Shapefile')


f=open ('data\\'+csvfile)
varnames=f.readline().strip().split(',')
maxdata=get_max_data(csvfile)

line=f.readline()
mapdata, datum, line=read_frame(f,varnames,line)
mapdata=read_simple_frame(f,varnames)
#print mapdata.items()
sh = ogr.Open("f:\\data\\maps\\shapefiles\\"+shapefile)
layer = sh.GetLayer()
save_map (args, mapdata, layer)
mapdata, datum, line=read_frame(f,varnames, line)

        
