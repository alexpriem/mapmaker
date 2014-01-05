from shapely.geometry import Polygon
from shapely.wkb import loads
from osgeo import ogr, osr
from matplotlib import pyplot
from math import log, log10
import argparse, sys





def drawpolygon(p,graph,colorval, regio_id):

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
    return colorval
    
    

def get_max_data(filename):

    f=open(filename)
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


def read_simple_frame(args):
    datadict={}

    csvfile=args['csvfile']
    recordinfo=args['recordinfo']
    f=open (csvfile)
    f.readline()
    
    recs=recordinfo.strip().split(',')
    regiocol=recs.index('regio')
    datacol=recs.index('data')
    
    for line in f.readlines():
        cols=line.strip().split(',')
        datadict[int(cols[regiocol])]=int(cols[datacol])
        if len(cols)<=1:
            return datadict
    return datadict





def save_map (args, mapdata, layer):
   # print mapdata

    fieldID=args['fieldID']
    outfile=args['outfile']    
    fig = pyplot.figure(figsize=(7, 8),dpi=300)
    ax = fig.add_subplot(111)
    title=args["title"]
    pyplot.title(title)
    movie_txt=args['label']
    movie_x=int(args['label_x'])
    movie_y=int(args['label_y'])
    pyplot.text (movie_x,movie_y,movie_txt)
    ax.axis('off')
    

    nonecounter=0
    for feature in layer:
        regio=int(feature.GetField(fieldID))     
        #regio=feature.GetField(fieldID)        
        val=mapdata.get(regio,None)       
        if val is None:
            nonecounter+=1
        colorval=rescale_color (val, 0, maxdata)
        geom=feature.GetGeometryRef()
        if geom is not None:    
            geometryParcel = loads(geom.ExportToWkb())
            drawpolygon(geometryParcel , ax, colorval, regio)    
    print 'saving img:%s (nones:%d)' % (outfile, nonecounter)
    pyplot.savefig(outfile+'.png')
    pyplot.close()
    

parser = argparse.ArgumentParser(description='generate calendar from repeating data')

parser.add_argument('-s', '--shapefile', dest='shapefile',  help='esri intput shapefile', required=False)
parser.add_argument('-f', dest='fieldID',  help='shapefile area key variabele', required=False, default=',')                               
parser.add_argument('-c', '--csvfile', dest='csvfile',  help='csv input file name', required=False)
parser.add_argument('-d', dest='sep',  help='delimiter of csv infile', required=False, default=',')
parser.add_argument('-o', dest='outfile',  help='output basename for pngs', required=False, default='')
parser.add_argument('-title', dest='title',  help='title', required=False, default='')
parser.add_argument('-label_x', dest='label_x',  help='title', required=False, default=220000)
parser.add_argument('-label_y', dest='label_y',  help='title', required=False, default=630000)
parser.add_argument('-label', dest='label',  help='title', required=False, default='label')
parser.add_argument('-verbose', dest='verbose',  help='verbose debuginfo', required=False, default=False, action='store_true')
parser.add_argument('-r', '--record', dest='recordinfo',  help='recordbeschrijving: regiokey, data, regiolabel, dummy, key, keylabel', required=True)
args=vars(parser.parse_args())

print 'reading data'

driver = ogr.GetDriverByName('ESRI Shapefile')


csvfile=args['csvfile']
shapefile=args['shapefile']
f=open (csvfile)
maxdata=get_max_data(csvfile)

mapdata=read_simple_frame(args)
j=1
sh = ogr.Open("f:\\data\\maps\\shapefiles\\"+shapefile)
layer = sh.GetLayer()
save_map (args, mapdata, layer)

        
