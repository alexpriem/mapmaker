from shapely.geometry import Polygon
from shapely.wkb import loads
from osgeo import ogr, osr
from matplotlib import pyplot
from math import log, log10
from pylab import axes
from pylab import arange, randn, convolve, exp, plot
import argparse, sys, datetime
import matplotlib





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
    
    

def get_max_data(mapdata):

    v=list(mapdata.values())  
    maxval=max(v)
    print maxval
    return maxval



def read_simple_frame(args):
    datadict={}
    ts_dict={}
    csvfile=args['csvfile']
    recordinfo=args['recordinfo']
    f=open (csvfile)
    f.readline()
    
    recs=recordinfo.strip().split(',')
    regiocol=recs.index('regio')
    datacol=recs.index('data')
    datecol=None
    if 'date' in recs:
        datecol=recs.index('date')
    datesel=args.get('dateselection',None)    
    
    for line in f.readlines():        
        cols=line.strip().split(',')
        val=int(cols[datacol])
        if datecol is not None:
            date=cols[datecol]
            prev_val=ts_dict.get(date,0)        # bouw totaal op            
            ts_dict[date]=prev_val+val
            if cols[datecol]!=datesel:                
                continue
        regio=int(cols[regiocol])          
        prev_val=datadict.get(regio,0)        # bouw totaal op 
        datadict[regio]=prev_val+val
        if len(cols)<=1:
            return datadict
    return datadict, ts_dict





def save_map (args, mapdata, ts, layer):
   # print mapdata
    import matplotlib.colors as colors

    fieldID=args['fieldID']
    outfile=args['outfile']    
    fig = pyplot.figure(figsize=(7, 8),dpi=300)
    
    
    #ax = fig.add_subplot(111)
    ax = axes([0.05, 0.2, 0.80, 0.80], axisbg='y')
    
    title=args["title"]
    pyplot.title(title)
    date=args['dateselection']
    y=int(date[:4])
    m=int(date[4:6])
    d=int(date[6:8])
    dt=datetime.date(y,m,d)
    movie_txt=dt.strftime('%d %b %Y')
    
    movie_x=float(args['label_x'])
    movie_y=float(args['label_y'])

    #pyplot.text (movie_x,movie_y,title)
    #pyplot.text (movie_x,movie_y,movie_txt)
    fig.text (movie_x,movie_y,movie_txt)

    ax.axis('off')

    #colormap toevoegen
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
           # break
    print 'saving img:%s (nones:%d)' % (outfile, nonecounter)

    ax1 = axes([0.85, 0.60, 0.05, 0.20], axisbg='y')
    
    colorsteps=20
    colorlist=[]
    for i in range (0,colorsteps):
        val=(1.0*maxdata)/colorsteps*i        
        colorlist.append(rescale_color (val,0,maxdata))    
    cmap = colors.ListedColormap(colorlist,'grad',colorsteps)
    
    norm = matplotlib.colors.Normalize(vmin=0, vmax=maxdata)
    matplotlib.colorbar.ColorbarBase(ax1, cmap=cmap,
                                   norm=norm,
                                   orientation='vertical')

    ax2 = axes([0.1, 0.05, 0.80, 0.15], axisbg='white', frameon=0)
#http://matplotlib.org/users/recipes.html     voor datess

    t_axis=[]
    y_axis=[]
    for date in sorted(ts.iterkeys()):
        y=int(date[:4])
        m=int(date[4:6])
        d=int(date[6:8])
        t_axis.append(datetime.date(y,m,d))
        y_axis.append(ts[date])
    pyplot.locator_params(axis = 'y', nbins = 4)
    pyplot.plot(t_axis, y_axis, color='blue')

    # highlight current date point in ts
    pointx=[dt]
    pointy=[ts[date]]
    pyplot.plot(pointx, pointy, color='red', marker='o',fillstyle='full', markersize=5)

    pyplot.savefig(outfile+'.png')
    pyplot.close()
    

parser = argparse.ArgumentParser(description='generate calendar from repeating data')

parser.add_argument('-s', '--shapefile', dest='shapefile',  help='esri intput shapefile', required=False)
parser.add_argument('-f', dest='fieldID',  help='shapefile area key variabele', required=False, default=',')                               
parser.add_argument('-c', '--csvfile', dest='csvfile',  help='csv input file name', required=False)
parser.add_argument('-d', dest='sep',  help='delimiter of csv infile', required=False, default=',')
parser.add_argument('-o', dest='outfile',  help='output basename for pngs', required=False, default='')
parser.add_argument('-title', dest='title',  help='title', required=False, default='')
parser.add_argument('-label_x', dest='label_x',  help='title', required=False, default=0.1)
parser.add_argument('-label_y', dest='label_y',  help='title', required=False, default=0.9)
parser.add_argument('-label', dest='label',  help='title', required=False, default='label')
parser.add_argument('-verbose', dest='verbose',  help='verbose debuginfo', required=False, default=False, action='store_true')
parser.add_argument('-r', '--record', dest='recordinfo',  help='recordbeschrijving: date, regiokey, data, regiolabel, dummy, key, keylabel', required=True)
parser.add_argument('-date',dest='dateselection',  help='dagselectie',required=False)
args=vars(parser.parse_args())

print 'reading data'

driver = ogr.GetDriverByName('ESRI Shapefile')


csvfile=args['csvfile']
shapefile=args['shapefile']
f=open (csvfile)



mapdata,ts_data=read_simple_frame(args)

maxdata=get_max_data(mapdata)
j=1
sh = ogr.Open("f:\\data\\maps\\shapefiles\\"+shapefile)
layer = sh.GetLayer()
save_map (args, mapdata, ts_data, layer)

        

