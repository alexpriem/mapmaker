from shapely.geometry import Polygon
from shapely.wkb import loads
from osgeo import ogr, osr
import matplotlib as mp
from matplotlib import pyplot
from math import log, log10
from pylab import axes
from pylab import arange, randn, convolve, exp, plot
import argparse, sys, datetime, math

from time import strptime, strftime




def drawpolygon(p,graph,colorval):

    bordercolor=(80/255.0,80/255.0,80/255.0)
    borderwidth=0.5
    
    if not(hasattr(p,'geoms')):            
        xList,yList = p.exterior.xy
        h=graph.fill(xList,yList, color=colorval)
        graph.plot(xList,yList, 
                   color=bordercolor,
                   linewidth=borderwidth)
    else:
        for poly in p:
            xList,yList = poly.exterior.xy
            h=graph.fill(xList,yList,color=colorval)
            graph.plot(xList,yList,
                        color=bordercolor,
                        linewidth=borderwidth)


def draw_outline(p,graph):
            
        bordercolor=(40/255.0,40/255.0,40/255.0)
        borderwidth=1.5

        if not(hasattr(p,'geoms')):            
            xList,yList = p.xy
            l=graph.plot(xList,yList, 
                       color=bordercolor,
                       linewidth=borderwidth)
        else:
            for poly in p:
                xList,yList = poly.xy
                l=graph.plot(xList,yList,
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
    
    

def get_max_data(mapdata):

    v=list(mapdata.values())  
    maxval=max(v)    
    return maxval



def read_csvfile(args):
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
    return datadict, absmax





def save_map (args, mapdata):
   # print mapdata    


    shapefile=args['shapefile']
    shape_key=args['shape_key']
    outfile=args['outfile']
    resolution=args.get('resolution',300)

    sh = ogr.Open(shapefile)
    layer = sh.GetLayer()

    fig = pyplot.figure(figsize=(6.75, 8),dpi=resolution)
    
    
    #ax = fig.add_subplot(111)
    ax = axes([0.05, 0.2, 0.80, 0.80], axisbg='y')
    
    title=args["title"]
    
    date=args['dateselection']
    if date is not None:
        date_input_format=args['date_input_format']
        date_print_format=args['date_print_format']
    
        dt=strptime(date,date_input_format)
        movie_txt=strftime(date_print_format,dt)    
    
        movie_x=float(args['label_x'])
        movie_y=float(args['label_y'])
        fig.text (movie_x,movie_y,movie_txt)
    title_x=args.get('title_x',0.5-len(title)*0.0075)
    title_y=args.get('title_x',0.95)
    
    fig.text (title_x,title_y,title)
    ax.axis('off')



    
    #colormap toevoegen
    nonecounter=0
    maxdata=niceround(get_max_data(mapdata))    
    for feature in layer:
        regio=int(feature.GetField(shape_key))     
        #regio=feature.GetField(fieldID)        
        val=mapdata.get(regio,None)       
        if val is None:
            nonecounter+=1
        colorval=rescale_color (val, 0, maxdata)
        geom=feature.GetGeometryRef()
        if geom is not None:    
            geometryParcel = loads(geom.ExportToWkb())
            drawpolygon(geometryParcel , ax, colorval)
           # break


    outline_shapefile=args.get('outline_shapefile')
    print outline_shapefile
    if outline_shapefile is not None:
        outline_key=args['outline_key']
        outline_sh = ogr.Open(outline_shapefile)
        outline_layer = outline_sh.GetLayer()
        
        for feature in outline_layer:                    
            geom=feature.GetGeometryRef()
            if geom is not None:    
                geometryParcel = loads(geom.ExportToWkb())
                draw_outline(geometryParcel, ax)
   
    colorbar_x=args.get('colorbar_x',0.85)
    colorbar_y=args.get('colorbar_y',0.60)
    

# colorbar
    ax1 = axes([colorbar_x, colorbar_y, 0.05, 0.20], axisbg='y')
    colorsteps=20
    colorlist=[]
    logstep=math.log10(maxdata)/(colorsteps*1.0)
    for i in range (0,colorsteps):
        val=pow(10,i*logstep)    
        colorlist.append(rescale_color (val,0,maxdata))    
    cmap = mp.colors.ListedColormap(colorlist,'grad',colorsteps)
    norm = mp.colors.LogNorm(vmin=1, vmax=maxdata)


    ticks=args.get('ticks')    
    if ticks is None:        
        if maxdata==1000:
            ticks=[1,5,10,250,1000]
        if maxdata==5000:
            ticks=[1,5,50,500,5000]
        if maxdata==10000:
            ticks=[1,10,100,1000,10000]    
        if maxdata==50000:
            ticks=[1,5,50,500,5000,50000]    
        if maxdata==100000:
            ticks=[1,100,10000,100000]    
        if maxdata==500000:
            ticks=[1,50,5000,500000]    
        if maxdata==1000000:
            ticks=[1,100,10000,1000000]    
        if maxdata==5000000:
            ticks=[1,500,50000,5000000]    

    
    cb=mp.colorbar.ColorbarBase(ax1,
                                    cmap=cmap,
                                    norm=norm,
                                    ticks=ticks,
                                    format='%.0f',
                                    spacing='proportional',
                                    orientation='vertical')
    ticklabels=args.get('ticklabels')
   # cb.add_lines(ticks,
   #              ['#000000','#000000','#000000','#000000','#000000'],
   #              [1,1,1,1,1],erase=True)
                 
                 
    if ticklabels is not None:
        cb.set_ticklabels(ticklabels)
    #cb.update_ticks()


    plot_ts=args.get('plot_ts')
    if  plot_ts==True:
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
    pyplot.savefig(outfile+'.png', dpi=resolution)
    pyplot.close()
    






if len(sys.argv)>1:
    parser = argparse.ArgumentParser(description='generate calendar from repeating data')
    parser.add_argument('-s', '--shapefile', dest='shapefile',  help='esri intput shapefile', required=False)
    parser.add_argument('-s', dest='shapekey',  help='shapefile area key variabele', required=False, default=',')                               
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


def niceround(val):
    upper_lim=[0,5,10,50,100,500,1000,5000,10000,50000,100000,500000,1000000]
    prev=upper_lim[0]
    for v in upper_lim[1:]:
       # print v, prev
        if val>=prev and val<v:
            return v
        prev=v
        
    return None












def makemap(args):

#mp.rcParams['text.usetex'] = True
#mp.rcParams['ps.fonttype'] = 42
    driver = ogr.GetDriverByName('ESRI Shapefile')
    

    mapdata,absmax=read_csvfile(args)
    absmax=niceround(absmax)
    
    

    save_map (args, mapdata)

        

