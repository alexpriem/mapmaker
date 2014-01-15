from shapely.geometry import Polygon
from shapely.wkb import loads
from osgeo import ogr, osr
from matplotlib import pyplot
from math import log, log10
import sys, argparse, json

import xml.etree.ElementTree as ET
from StringIO import StringIO






def drawpolygon(p,graph,colorval,regio_id):

    # returns a list of dom-id's for every polygon drawn
    # (multipolygons get
    # dom-id format:  r%regioid_%counter
    # 
    bordercolor=(120/255.0,120/255.0,120/255.0)
    borderwidth=0.5
    
    if not(hasattr(p,'geoms')):            
        xList,yList = p.exterior.xy
        h=graph.fill(xList,yList, color=colorval)
        l=graph.plot(xList,yList, 
                   color=bordercolor,
                   linewidth=borderwidth)
        for il, element in enumerate(h):
            element.set_gid ("r%d_1" % regio_id)
        for il, element in enumerate(l):
            element.set_gid ("l%d_1" % regio_id )
        return ["r%d_1" % regio_id]
    else:
        j=1
        regs=[]
        for poly in p:
            xList,yList = poly.exterior.xy
            h=graph.fill(xList,yList,color=colorval)
            l=graph.plot(xList,yList,
                        color=bordercolor,
                        linewidth=borderwidth)            
            for il, element in enumerate(h):
                element.set_gid ("r%d_%d" % (regio_id,j) )   # polylines gaan niet goed
            
            for il, element in enumerate(l):
                element.set_gid ("l%d_%d" % (regio_id,j) )                
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


def read_simple_frame(f, varnames):
    datadict={}

    for line in f.readlines():
        cols=line.strip().split(',')
        datadict[int(cols[0])]=int(cols[-1])
        if len(cols)<=1:
            return datadict
    return datadict


def prep_js (args):

    csvfile=args['csvfile']
    sep=args['sep']
    outfile=args['outfile']
    recordinfo=args['recordinfo']
    recs=recordinfo.strip().split(',')
    regiocol=recs.index('regio')
    datecol=None
    if 'date' in recs:
        datecol=recs.index('date')
    datacols = [i for i, x in enumerate(recs) if x == "data"]
    
    f=open (csvfile)

    g=open("js/data.js",'w')    

    varnames=f.readline().strip().split(sep)
    s='var varnames=['
    if datecol is not None:        
        s+='"'+varnames[datecol]+'",'
    s+='"'+varnames[regiocol]+'",'
    s+=','.join(['"'+varnames[col]+'"' for col in datacols])+'];\n\n'
    if datecol is not None:
        s+='var has_date=true;\n'
    s+='var data=[\n'
    line_out=''
    g.write(s)
    
    
    # build js-object: [date], regio:{data1,data2, data3}],  ...
    #
    var_min=[None]*len(datacols)
    var_max=[None]*len(datacols)
    mindate=None
    maxdate=None
    line_out='\n'
    for line in f.readlines():        
        g.write(line_out)
        cols=line.strip().split(sep)
        line_out='['    
        if (datecol is not None):
            date=cols[datecol]
            if mindate is None or date<mindate:
                mindate=date
            if maxdate is None or date>maxdate:
                maxdate=date
            line_out+=date+','            
        line_out+=cols[regiocol]+','
        line_out+=','.join([cols[col] for col in datacols])
        line_out+='],\n'
        #print line_out
        for i,col in enumerate(datacols):
            val=float(cols[col])
            if var_min[i] is None or val<var_min[i]:
                var_min[i]=val
            if var_max[i] is None or val>var_max[i]:
                var_max[i]=val
            
    var_min.insert(0,0)
    var_max.insert(0,0)
    if datecol is not None:
        var_min.insert(0,int(mindate))         # min /max datum invoegen?
        var_max.insert(0,int(maxdate))        
    line_out=line_out[:-2]
    g.write(line_out+'];\n')
    f.close()

    s=json.dumps(var_min)    
    g.write('\n\nvar var_min='+s+';\n')
    s=json.dumps(var_max)        
    g.write('\n\nvar var_max='+s+';\n')
    g.close()    





def save_map (args, mapdata, layer):

    fieldID=args['fieldID']
    outfile=args['outfile']
    labelID=args['labelID']
   # print mapdata
    fig = pyplot.figure(figsize=(7, 8),dpi=300)    
    ax = fig.add_subplot(1,1,1)    
    nonecounter=0
    regios=[]
    regio_ids={}
    labels={}
    for feature in layer:
       # print feature.GetFieldCount()        
        regio=int(feature.GetField(fieldID))
        if labelID is not None:
            label=feature.GetField(labelID)
            labels[regio]=label
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
            ids= drawpolygon(geometryParcel , ax, colorval, regio)    
            regios=regios+ids;
            regio_ids[regio]=ids
    print 'saving img:%s (nones:%d)' % (outfile, nonecounter)
    # add classes to DOM-objects
    f = StringIO()
    pyplot.savefig(f, format="svg")
    tree, xmlid = ET.XMLID(f.getvalue())    
    
    
    for r in regios:            
        el = xmlid[r]  # lookup regio_id  in xml
        children=el.findall("*")
        child=children[0]   # altijd maar een child       
        child.attrib.pop("clip-path")
        child.set('class',"outline")
        child.set('id',r)
        el.attrib.pop("id")
        #sys.exit()
        
        
        
        # lookup border around regions
        line='l'+r[1:]    
        el = xmlid[line]  # lookup regio_id  in xml        
        el.set('class', "border")

    ET.ElementTree(tree).write(outfile+'.svg')        
    
    s=json.dumps(regio_ids);
    f=open("js/shape_ids.js",'w')
    f.write("var shape_ids=");
    f.write(s);
    f.write(';\n');
    f.close()

    s='{}'
    if labelID is not None:
        s=json.dumps(labels);
    f=open("js/labels.js",'w')
    f.write("var labels=");
    f.write(s);
    f.write(';\n');
    f.close()
    
    




def save_html (args):

    outfile=args["outfile"]
    fullhtml=args['fullhtml']
    verbose=args['verbose']
    
    html=open ("map.html",'r').read()    
    f=open(outfile+'.html','w')
    
    cssfrags=html.split('<link href="')
    
    f.write(cssfrags[0])
    cssfiles=[cssfrag.split('"')[0] for cssfrag in cssfrags[1:]]                
    for cssfrag in cssfrags[1:]:
        cssfile=cssfrag.split('"')[0]
        
       # print cssfile
        if fullhtml:
            f.write('\n<style>\n')
            css=open(cssfile,"r").read()
            f.write(css)
            f.write('\n</style>\n')
            if verbose:
                print cssfile,'included'
        else:
            s='<link href="'+cssfile+'" rel="stylesheet" type="text/css">'
            f.write(s)
            if verbose:
                print cssfile,'skipped'
            
            

    if fullhtml:
        not_replaceable_js=[]
    else:        
        not_replaceable_js=['js-lib/jquery-2.0.3.min.js',
                        'js-lib/d3.v3.min.js',
                        'js-lib/chroma.min.js',
                        'js/colormaps.js',                        
                        'js/ui.js',
                        'js/data.js',
                        'js/labels.js',
                        'js/shape_ids.js']
    jsfrags=html.split('script src="')            
    for jsfrag in jsfrags[1:]:
        jsfile=jsfrag.split('"')[0]
        if jsfile in not_replaceable_js:
            s='\n<script type="text/javascript" src="'+jsfile+'"> </script>\n'
            f.write(s)
            if verbose:
                print jsfile,'skipped'
        else:
            f.write('\n<script type="text/javascript">\n')        
            js=open(jsfile,'r').read()    
            f.write(js)
            f.write('\n</script>\n')
            if verbose:
                print jsfile,'included'
        

    body=html.split("<body>")
    body=body[1]
    svg=open(outfile+'.svg','r').read()                        
    body=body.replace('<svg> </svg>',svg)
    f.write("</head>\n")
    f.write("<body>\n")
    f.write(body)
    f.close()
    
    





    
# Apparently, the `register_namespace` method works only with 
# python 2.7 and up and is necessary to avoid garbling the XML name
# space with ns0.
ET.register_namespace("","http://www.w3.org/2000/svg")    


parser = argparse.ArgumentParser(description='generate calendar from repeating data')

parser.add_argument('-s', '--shapefile', dest='shapefile',  help='esri intput shapefile', required=True)
parser.add_argument('-f', dest='fieldID',  help='shapefile area key variabele', required=True, default=None)
parser.add_argument('-l', dest='labelID',  help='shapefile area label variabele', required=False, default=None)
parser.add_argument('-c', '--csvfile', dest='csvfile',  help='csv input file name', required=True)
parser.add_argument('-d', dest='sep',  help='delimiter of csv infile', required=False, default=',')
parser.add_argument('-o', dest='outfile',  help='output basename for .svg/.js', required=False, default='')
parser.add_argument('-fullhtml', dest='fullhtml',  help='include everything (js, css) in html file', required=False, default=False, action='store_true')
parser.add_argument('-verbose', dest='verbose',  help='verbose debuginfo', required=False, default=False, action='store_true')
parser.add_argument('-r', '--record', dest='recordinfo',  help='recordbeschrijving: regiokey, data, regiolabel, dummy, key, keylabel', required=True)
parser.add_argument('-title', dest='title',  help='title', required=False, default='')
parser.add_argument('-label_x', dest='label_x',  help='title', required=False, default=0.1)
parser.add_argument('-label_y', dest='label_y',  help='title', required=False, default=0.9)
parser.add_argument('-label', dest='label',  help='title', required=False, default='label')

args=vars(parser.parse_args())



shapefile=args["shapefile"]
csvfile=args["csvfile"]
outfile=args["outfile"]
fullhtml=args["fullhtml"]

print ''

driver = ogr.GetDriverByName('ESRI Shapefile')


f=open (csvfile)
varnames=f.readline().strip().split(',')
maxdata=get_max_data(csvfile)





line=f.readline()
#mapdata, datum, line=read_frame(f,varnames,line)
mapdata=read_simple_frame(f,varnames)

#print mapdata.items()
sh = ogr.Open(shapefile)
layer = sh.GetLayer()

prep_js(args)
save_map (args, mapdata, layer)
save_html (args)

        
