from math import log, log10
import os, sys, argparse, json,re

import dateutil.parser

from map2svg import map2svg
import shpUtils





class mapmaker:

    def __init__(self, args):
        self.args=args


    def read_keyfile(self,keyfile,sep):

        keylabel={}
        if keyfile is not None:
            f=open(keyfile)
            f.readline()
            for nr,line in enumerate(f.readlines()):
                keyvalue=line.strip().split(sep)                
                if len(keyvalue)!=2:
                    raise RuntimeError("line %d:expected key/value pairs in file:%s" % (nr,keyfile))
                keylabel[keyvalue[0]]=keyvalue[1]
                
        return keylabel

    def write_keyfile(self,filename,keydict,prefix):
            intdict={}
            for k,v in keydict.items():
                intdict[int(k)]=v
            keydict=intdict
            valdict={}
            for k,v in keydict.items():
                valdict[v.lower()]=k
        
            f=open(filename,'w')
            keytxt=json.dumps(sorted(keydict.keys()));
            f.write("var %s_keys=%s;\n\n" %(prefix,keytxt));
            valuestxt=json.dumps(sorted(keydict.values()));
            f.write("var %s_labels=%s;\n\n" %(prefix,valuestxt));
            dicttxt=json.dumps(keydict);
            f.write("var %s_label2key=%s;\n\n" %(prefix,dicttxt));
            dicttxt=json.dumps(valdict);
            f.write("var %s_key2label=%s;\n\n" %(prefix,dicttxt));
            f.close()

    def draw_areas(self,p,graph,color,regio_id):

        # returns a list of dom-id's for every polygon drawn
        # (multipolygons get
        # dom-id format:  r%regioid_%counter
        #

        if color is None:
            color=(1.0,1.0,1.0)
        bordercolor=(120/255.0,120/255.0,120/255.0)
        borderwidth=0.5
        
        if not(hasattr(p,'geoms')):            
            xList,yList = p.exterior.xy
            h=graph.fill(xList,yList, color=color)
            l=graph.plot(xList,yList, 
                       color=bordercolor,
                       linewidth=borderwidth)
            for il, element in enumerate(h):
                element.set_gid ("a%d_1" % regio_id)
            for il, element in enumerate(l):
                element.set_gid ("l%d_1" % regio_id )
            return ["a%d_1" % regio_id]
        else:
            j=1
            regs=[]
            for poly in p:
                xList,yList = poly.exterior.xy
                h=graph.fill(xList,yList, color=color)
                l=graph.plot(xList,yList,
                            color=bordercolor,
                            linewidth=borderwidth)            
                for il, element in enumerate(h):
                    element.set_gid ("a%d_%d" % (regio_id,j) )   # polylines gaan niet goed
                
                for il, element in enumerate(l):
                    element.set_gid ("l%d_%d" % (regio_id,j) )                
                regs.append("a%d_%d" % (regio_id, j))                
                j+=1            
            return regs


    def draw_outline(self,p,graph,outline_id):

        # returns a list of dom-id's for every polygon drawn
        # (multipolygons get
        # dom-id format:  r%regioid_%counter
        #
        
        bordercolor=(40/255.0,40/255.0,40/255.0)
        borderwidth=1.5

        if not(hasattr(p,'geoms')):            
            xList,yList = p.xy
            l=graph.plot(xList,yList, 
                       color=bordercolor,
                       linewidth=borderwidth)
            for il, element in enumerate(l):
                element.set_gid ("o%d_1" % outline_id )
            return ["o%d_1" % outline_id]
        else:
            j=1
            regs=[]
            for poly in p:
                xList,yList = poly.xy
                l=graph.plot(xList,yList,
                            color=bordercolor,
                            linewidth=borderwidth)                            
                for il, element in enumerate(l):
                    element.set_gid ("o%d_%d" % (outline_id,j) )                
                regs.append("o%d_%d" % (outline_id, j))                
                j+=1            
            return regs




    def read_files (self):

        csvfile=args["csvfile"]               
        outfile=args["outfile"]
        fullhtml=args["fullhtml"]
        

        f=open (csvfile)
        varnames=f.readline().strip().split(',')
        self.maxdata=m.get_max_data(args["csvfile"])
        line=f.readline()
        #mapdata, datum, line=read_frame(f,varnames,line)
        self.mapdata=self.read_simple_frame(f,varnames)


    def rescale_color (self, val, minval, maxval):

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
        
        

    def get_max_data(self, filename):

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



    def read_frame(self, f,varnames, prevline=None):
        
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


    def read_simple_frame(self, f, varnames):
        datadict={}

        for line in f.readlines():
            cols=line.strip().split(',')
            datadict[cols[0]]=int(cols[-1])
            if len(cols)<=1:
                return datadict
        return datadict


    def prep_js (self, args):

        csvfile=args['csvfile']
        csvdir=args['csvdir']
        
        sep=args['sep']
        outfile=args['outfile']
        recordinfo=args['recordinfo']
        recs=recordinfo.strip().split(',')
        # simpele syntaxcheck
        allowed_keys=['regio','regiolabel','keylabel','key','data','dummy','date','norm']
        for r in recs:            
            if r not in allowed_keys:
                raise RuntimeError('unknown key for recordinfo:'+str(r)+'\nallowed keys:'+str(allowed_keys))
        
        regiocol=recs.index('regio')
        regiolabelcol=None
        if 'regiolabel' in recs:
            regiolabelcol=recs.index('regiolabel')
        keylabelcol=None
        if 'keylabel' in recs:
            keylabelcol=recs.index('keylabel')
        keycol=None
        if 'key' in recs:
            keycol=recs.index('key')

        normcol=None
        if 'norm' in recs:
            normcol=recs.index('norm')
        datecol=None
        if 'date' in recs:
            datecol=recs.index('date')
        datacols = [i for i, x in enumerate(recs) if x == "data"]

        if csvdir:
            csvfiles = [ f for f in os.listdir(csvdir)] # if re.match(r'\w*\.csv', f) and os.path.isfile(csvdir+f) ]
            
            csvfile=csvdir+'/'+csvfiles[0]
            
        
        f=open (csvfile)

        g=open("js/data.js",'w')    

        varnames=f.readline().strip().split(sep)
        
        xlabel=args.get('xlabel','')
        ylabel=args.get('ylabel','')
        label_xpos=args.get('label_xpos','')
        label_ypos=args.get('label_ypos','')
        title=args.get('title','')
        g.write('var xlabel="%s";\n' % xlabel);
        g.write('var ylabel="%s";\n' % ylabel);
        g.write('var label_xpos=%s;\n' % label_xpos);
        g.write('var label_ypos=%s;\n' % label_ypos);
        g.write('var label="%s";\n' % title);
        
        
        s='var varnames=['
        if datecol is not None:        
            s+='"'+varnames[datecol]+'",'
        s+='"'+varnames[regiocol]+'",'
        s+=','.join(['"'+varnames[col]+'"' for col in datacols])+'];\n'
        g.write(s)
        
        var_types=[]
        if 'key' in recs:
            var_types.append('key')
        if not('key' in recs) and ('keylabel' in recs):
            var_types.append('keylabel')
        if 'date' in recs:
            var_types.append('date')
        if 'regio' in recs:
            var_types.append('regio')
        var_types+=['data']*len(datacols)                        
        s=json.dumps(var_types)    
        g.write('var var_types='+s+';\n\n')


        
        
        
        
        # build js-object: [keys], date, regio, data1, data2
        #

        var_min=[None]*len(datacols)
        var_max=[None]*len(datacols)
        mindatestr=None
        maxdatestr=None
        line_out='\n'
        g.write('var data=[\n')
        regiolabels={}
        keylabels={}


        total_regio={}
        total_date={}
        date_keys={}
        if keycol is not None:
            for key in keys.values():
                total_regio_key[key]={}
                total_date_key[key]={}


        
        for line in f.readlines():        
            g.write(line_out)
            cols=line.strip().split(sep)
            line_out='['
            regio=cols[regiocol]
            if regiolabelcol is not None:
                regiolabels[regio]=cols[regiolabelcol]
            if keylabelcol is not None:
                keylabels[regio]=cols[keylabelcol]

            if (datecol is not None):
                date=cols[datecol]
                d=dateutil.parser.parse(date)
                js_date="new Date('"+d.isoformat()+"')"
                if mindatestr is None or d<mindate:
                    mindate=d
                    mindatestr=js_date
                if maxdatestr is None or d>maxdate:
                    maxdate=d
                    maxdatestr=js_date
                #line_out+=date+","
                
                line_out+="new Date('"+date.replace(' ','T')+"'),"
            line_out+=regio + ','
            if keycol is not None:
                line_out+=cols[keycol]+','
            if keycol is None and keylabelcol is not None:
                line_out+=cols[keylabelcol]+','

            line_out+=','.join([cols[col] for col in datacols])
            line_out+='],\n'
            #print line_out
            numdatacols=len(datacols)
            for i,col in enumerate(datacols):
                val=float(cols[col])
                if var_min[i] is None or val<var_min[i]:
                    var_min[i]=val
                if var_max[i] is None or val>var_max[i]:
                    var_max[i]=val

                if not(regio in total_regio):
                    total_regio[regio]=[0]*numdatacols
                if not(js_date in total_date):
                    total_date[js_date]=[0]*numdatacols
                    date_keys[d]=0

                # aggegraten over dataset bepalen
                # naar regio, date
                # en naar key x regio, key x date
                total_regio[regio][i]+=val
                total_date[js_date][i]+=val
                if keycol is not None:
                    if not(regio in total_regio_key[key]):
                        total_regio_key[key][regio]=[0]*numdatacols                    
                    if not(date in total_date_key[key]):
                        total_date_key[key][js_date]=[0]*numdatacols
                    total_regio_key[key][regio][i]+=val
                    total_date_key[key][js_date][i]+=val
                    

                                


                
        var_min.insert(0,0)
        var_max.insert(0,0)
        if datecol is not None:
            var_min.insert(0,mindatestr)         # min /max datum invoegen?
            var_max.insert(0,maxdatestr)
            
        
                    
        line_out=line_out[:-2]
        g.write(line_out+'];\n')        
        total_regio=[[0, int(row[0])]+list(row[1]) for row in sorted(total_regio.items())]
        s=json.dumps(total_regio)
        
        g.write('\n\nvar total_regio='+s+';\n')
        # datum sorteren voor tijdreeks.        
        
        

        total_date=[[row[0]]+list(row[1]) for row in sorted(total_date.items())]
        s=json.dumps(total_date).replace('"','')
        # date-step bepalen
        date_keys=sorted(date_keys.keys())
        minms=None
        for i,val in enumerate(date_keys[1:]):
            dk=date_keys[i]-date_keys[i-1];            
            ms=dk.days*24*3600*1000+dk.seconds*1000 # to milliseconds
            if minms is None:   
                minms=ms
            if ms<minms and ms>0:
                minms=ms
            
        g.write('\n\nvar datestep_ms=%d;' % ms)
        
        
        

        
        g.write('\n\nvar total_date='+s+';\n')
        if keycol is not None:
            s=json.dumps(total_regio_key)
            g.write('\n\nvar total_regio_key='+s+';\n')
            for key in keys.values():
                total_date_key[key]=sorted(total_date_key[key].items())
            s=json.dumps(total_date_key)
            g.write('\n\nvar total_date_key='+s+';\n')

        f.close()

        if csvdir:
            s=json.dumps(csvfiles)
            g.write('\n\n var selectie='+s+';\n');

        keyfile=args['keyfile']
        if keyfile is not None:
            keylabels=self.read_keyfile(keyfile,sep)
        regiofile=args['regiofile']
        if regiofile is not None:
            regiolabels=self.read_keyfile(regiofile,sep)
                                
        self.write_keyfile('js/regiolabels.js',regiolabels,'regio')
        self.write_keyfile('js/keylabels.js',keylabels,'country')
            

            
        s=json.dumps(var_min).replace('"','') # quotes om datums verwijderen    
        g.write('\n\nvar var_min='+s+';\n')
        s=json.dumps(var_max).replace('"','')        
        g.write('\n\nvar var_max='+s+';\n')
        g.close()        





    def save_map (self, args):

        self.area_shapefile=args["area_shapefile"] 
        self.outline_shapefile=args["outline_shapefile"]


        svg=map2svg (args["width"], args["height"])
        svg.load_shapefile(self.area_shapefile)
        svg.autoscale()
        svgtxt=svg.build_svg(None,args['shape_fieldID'],'regio')
        

        
        mapdata=self.mapdata       
        outfile=args['outfile']

        if self.outline_shapefile is not None:
           # print 'outline'
            outline_shp=shpUtils.loadShapefile(self.outline_shapefile)

            svgtxt+=svg.build_svg(outline_shp, args['outline_fieldID'],'outline')
#            labelID=args['outline_labelID']

                
        svgtxt=svg.embed_svg(svgtxt)
        f=open (outfile+'.svg','w')
        f.write(svgtxt)
        f.close()        

        regio_ids=svg.get_shapeids(None, args['shape_fieldID'])
        s=json.dumps(regio_ids)
        
        f=open("js/shape_ids.js",'w')
        f.write("var shape_ids=")
        f.write(s)
        f.write(';\n')
        f.close()



    def save_html (self, args):

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

                            'js/linreg.js',
                            'js/ui_datatable.js',
                            'js/ui_timeseries.js',
                            'js/ui_chart.js',
                            'js/ui.js',
                            'js/data.js',
                            'js/labels.js',
                            'js/shape_ids.js']
        jsfrags=html.split('script src="')            
        for jsfrag in jsfrags[1:]:
            jsfile=jsfrag.split('"')[0]
            if jsfile in not_replaceable_js:
                s='<script type="text/javascript" src="'+jsfile+'"> </script>\n'
                f.write(s)
                if verbose:
                    print jsfile,'skipped'
            else:
                f.write('\n<script type="text/javascript">\n')        
                js=open(jsfile,'r').read()    
                f.write(js)
                f.write('</script>\n')
                if verbose:
                    print jsfile,'included'
            

        body=html.split("<body>")
        body=body[1]
        svg=open(outfile+'.svg','r').read()                        
        body=body.replace('<svg > </svg>',svg)
        f.write("</head>\n")
        f.write("<body>\n")
        f.write(body)
        f.close()
        
        
    




    

parser = argparse.ArgumentParser(description='generate calendar from repeating data')

parser.add_argument('-sh', '--shapefile', dest='area_shapefile',  help='esri intput shapefile', required=True)
parser.add_argument('-sf', dest='shape_fieldID',  help='shapefile area key variabele', required=True, default=None)
parser.add_argument('-sl', dest='shape_labelID',  help='shapefile area label variabele', required=False, default=None)

parser.add_argument('-l', '--outlinefile', dest='outline_shapefile',  help='esri intput shapefile', required=False, default=None)
parser.add_argument('-lf', dest='outline_fieldID',  help='shapefile area key variabele', required=False, default=None)
parser.add_argument('-ll', dest='outline_labelID',  help='shapefile area label variabele', required=False, default=None)

group = parser.add_mutually_exclusive_group(required=True)
group.add_argument('-c', '--csvfile', dest='csvfile',  help='csv input file name')
group.add_argument('-cd', '--csvdir', dest='csvdir',  help='directory with csv input files')
parser.add_argument('-s', '--sep', dest='sep',  help='delimiter of csv infile', required=False, default=',')
parser.add_argument('-o', dest='outfile',  help='output basename for .svg/.js', required=False, default='')
parser.add_argument('-fullhtml', dest='fullhtml',  help='include everything (js, css) in html file', required=False, default=False, action='store_true')
parser.add_argument('-verbose', dest='verbose',  help='verbose debuginfo', required=False, default=False, action='store_true')
parser.add_argument('-r', '--record', dest='recordinfo',  help='recordbeschrijving: regiokey, norm, data, regiolabel, dummy, key, keylabel', required=True)
parser.add_argument('-xlabel', dest='xlabel',  help='xaxis label', required=False, default=0.1)
parser.add_argument('-ylabel', dest='ylabel',  help='yaxis label', required=False, default=0.9)
parser.add_argument('-label_xpos', dest='label_xpos',  help='xpos label', required=False, default=0.1)
parser.add_argument('-label_ypos', dest='label_ypos',  help='ypos label', required=False, default=0.9)
parser.add_argument('-title', dest='title',  help='title', required=False, default='')
parser.add_argument('-kf','--keyfile', dest='keyfile',  help='keyfile', required=False)
parser.add_argument('-rf','--regiofile', dest='regiofile',  help='regiofile', required=False)
parser.add_argument('-at','--agg_time', dest='agg_time',  help='aggegrate by time-axis', required=False, default=False,  action='store_true')
        
parser.add_argument('-wi','--width', dest='width',  help='width', required=False, default=300)
parser.add_argument('-he','--height', dest='height',  help='height', required=False, default=350)

args=vars(parser.parse_args())
m=mapmaker(args)


m.read_files()


#print mapdata.items()

m.prep_js(args)
m.save_map (args)
m.save_html (args)

        
