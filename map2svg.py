import shpUtils

infile = 'shapefiles\\gm_2012.shp'
regiocol='GM2012'
classname='outline'
outfile='test.svg'

height=460
width=390



class map2svg():


    def __init__(self, width, height):
        self.shaperecords=None
        self.minx=None
        self.maxx=None
        self.miny=None
        self.maxy=None
        self.width=width
        self.height=height
        self.classname=''
    

    def load_shapefile(self,infile):
        self.shaperecords=shpUtils.loadShapefile(infile)
        return self.shaperecords

    def write_svg(self, outfile, svg):
        f=open (outfile,'w')
        width=self.width
        height=self.height

        f.write ("""
        <svg xmlns="http://www.w3.org/2000/svg" height="%(height)spt" width="%(width)spt" viewBox="0 0 %(width)s %(height)s" version="1.1" >
         
        <g id="figure_1"> 
        """ % locals ())
        f.write(svg)

        f.write("""
        </g>
        </svg>
        """)
        f.close()        



    def autoscale (self, shpRecords=None):
        minx=None
        maxx=None
        miny=None
        maxy=None
        if shpRecords is None:
            shpRecords=self.shaperecords
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
        self.dx=maxx-minx
        self.dy=maxy-miny
        self.minx=minx
        self.maxx=maxx
        self.miny=miny
        self.maxy=maxy
        



    def build_svg (self, shpRecords=None, classname=''):

        if shpRecords is None:
            shpRecords=self.shaperecords
        if self.minx is None:
            self.autoscale(shpRecords)
        minx=self.minx
        miny=self.miny
        dx=self.dx
        dy=self.dy
        width=self.width
        height=self.height

        svg=''
        classtxt=''
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
                s+=' z " />\n  '
            svg+=s
        return svg







s=map2svg (width,height)
s.load_shapefile(infile)
s.autoscale()
svg=s.build_svg()
s.write_svg(outfile, svg)
