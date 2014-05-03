import shpUtils

shpRecords = shpUtils.loadShapefile('shapefiles\\gm_2012.shp')
regiocol='GM2012'
classname='outline'
outfile='test.svg'

height=460
width=390
minx=None
maxx=None
miny=None
maxy=None

for i in range(0,len(shpRecords)):
    polygons=shpRecords[i]['shp_data']['parts']
    for poly in polygons:
        for point in poly['points']:
            tempx=float(point['x'])
            tempy=float(point['y'])
            if minx is None or tempx<minx:
                minx=tempx
            if miny is None or tempy<miny:
                miny=tempy
            if maxx is None or tempx>maxx:
                maxx=tempx
            if maxy is None or tempy>maxy:
                maxy=tempy
#print minx, maxx, miny, maxy
dx=maxx-minx
dy=maxy-miny




f=open (outfile,'w')
f.write ("""
<svg xmlns="http://www.w3.org/2000/svg" height="%(height)spt" width="%(width)spt" viewBox="0 0 %(width)s %(height)s" version="1.1" >
<defs>
  <style type="text/css">
  *{fill:#ff0000;stroke:#444444;}
  </style>
 </defs>
 
<g id="figure_1"> 
""" % locals ())



if classname!='':
    classtxt='class="'+classname+'"'
for i in range(0,len(shpRecords)):
    dbfdata=shpRecords[i]['dbf_data']
    shape_id=dbfdata['GM2012']    
    polygons=shpRecords[i]['shp_data']['parts']
    for shape_nr, poly in enumerate(polygons): 
        
        x = []
        y = []
        s='<path %s id="%d_%d" data-shapeid="%d" d=" ' % (classtxt,shape_id, shape_nr, shape_id)
        point=poly['points'][0]        
        tempx = ((float(point['x'])-minx)/dx)*width
        tempy = height - ((float(point['y'])-miny)/dy)*height
        s+='M %.2f %.2f' % (tempx, tempy)
        for point in poly['points']:
            tempx = ((float(point['x'])-minx)/dx)*width
            tempy = height - ((float(point['y'])-miny)/dy)*height
            x.append(tempx)
            y.append(tempy)
            
            s+='L%.2f %.2f' % (tempx,tempy)
        #plt.fill(x,y, color='red', linecolor='black')
        s+=' z " />\n  '
        #s+='style="fill:#ff0000;stroke:#444444;" />\n'

        f.write(s)


f.write("""
</g>
</svg>
""")
        


