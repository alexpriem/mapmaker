from shapely.geometry import Polygon
from shapely.wkb import loads
from osgeo import ogr, osr
from matplotlib import pyplot
from math import log, log10
from pylab import axes
from pylab import arange, randn, convolve, exp, plot
import argparse, sys, datetime, math
import matplotlib
from time import strptime, strftime




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
    return maxval



def read_simple_frame(args):
    datadict={}
    ts_dict={}
    csvfile=args['csvfile']
    recordinfo=args['recordinfo']
    f=open (csvfile)
    f.readline()
    absmax=None
    
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
        if val>absmax:
            absmax=val
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
    return datadict, ts_dict, absmax





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
    date_input_format=args['date_input_format']
    date_print_format=args['date_print_format']
    
    dt=strptime(date,date_input_format)
    movie_txt=strftime(date_print_format,dt)    
    
    movie_x=float(args['label_x'])
    movie_y=float(args['label_y'])
    fig.text (movie_x,movie_y,movie_txt)
    fig.text (0.5-len(title)*0.01,0.95,title)
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
   

# colorbar
    ax1 = axes([0.85, 0.60, 0.05, 0.20], axisbg='y')
    
    colorsteps=20
    colorlist=[]
    logstep=math.log10(maxdata)/(colorsteps*1.0)
    for i in range (0,colorsteps):
        val=pow(10,i*logstep)    
        colorlist.append(rescale_color (val,0,maxdata))    
    cmap = colors.ListedColormap(colorlist,'grad',colorsteps)
    norm = matplotlib.colors.LogNorm(vmin=1, vmax=maxdata)

    if maxdata==1000:
        levels=[1,5,10,250,1000]
    if maxdata==5000:
        levels=[1,5,50,500,5000]
    if maxdata==10000:
        levels=[1,10,100,1000,10000]    
    if maxdata==50000:
        levels=[1,50,500,5000,50000]    
    if maxdata==100000:
        levels=[1,100,1000,10000,100000]    
    if maxdata==500000:
        levels=[1,500,5000,50000,500000]    

    
    matplotlib.colorbar.ColorbarBase(ax1,
                                     cmap=cmap,
                                   norm=norm,
                                     ticks=levels,
                                    format='%.0f',
                                     spacing='proportional',
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
    currentdate=args['dateselection']
    pointx=[dt]
    pointy=[ts[currentdate]]
    pyplot.plot(pointx, pointy, color='red', marker='o',fillstyle='full', markersize=5)

    if args['movie']==True:
        outfile+='_'+currentdate
    print 'save:',outfile, maxdata
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
parser.add_argument('-movie', dest='movie',  help='make movie over all dates', required=False, default=False, action='store_true')
parser.add_argument('-r', '--record', dest='recordinfo',  help='recordbeschrijving: date, regiokey, data, regiolabel, dummy, key, keylabel', required=True)
parser.add_argument('-dateselection',dest='dateselection',  help='dagselectie',required=False)
parser.add_argument('-date_input_format',dest='date_input_format',  help='datumformat',required=False,default='%Y-%m-%d %H:%M:%S')
parser.add_argument('-date_print_format',dest='date_print_format',  help='datumformat',required=False,default='%d %b %Y')
args=vars(parser.parse_args())

print 'reading data'

driver = ogr.GetDriverByName('ESRI Shapefile')


csvfile=args['csvfile']
shapefile=args['shapefile']
movie=args['movie']
f=open (csvfile)

def niceround(val):
    upper_lim=[0,5,10,50,100,500,1000,5000,10000,50000,100000,500000,1000000]
    prev=upper_lim[0]
    for v in upper_lim[1:]:
       # print v, prev
        if val>=prev and val<v:
            return v
        prev=v
        
    return None



mapdata,ts_data, absmax=read_simple_frame(args)
print absmax
absmax=niceround(absmax)
print absmax
if movie:
    maxdata=absmax
    for date in sorted(ts_data.keys()):        
        args['dateselection']=date
        mapdata,ts_data, dummy=read_simple_frame(args)
        
        sh = ogr.Open(shapefile)
        layer = sh.GetLayer()
        save_map (args, mapdata, ts_data, layer)
    sys.exit(0)

        
maxdata=niceround(get_max_data(mapdata))

sh = ogr.Open(shapefile)
layer = sh.GetLayer()
save_map (args, mapdata, ts_data, layer)

        

