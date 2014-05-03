import shpUtils
import matplotlib.pyplot as plt

shpRecords = shpUtils.loadShapefile('f:\\data\\maps\\shapefiles\\gm_2012.shp')

f=open ('test.svg','w')

f.write ("""
<svg xmlns="http://www.w3.org/2000/svg" height="460pt" version="1.1" viewBox="0 0 390 460" width="390pt">
 <defs>
  <style type="text/css">
*{stroke-linecap:butt;stroke-linejoin:round;}
  </style>
 </defs>
 <g id="figure_1"> 
""")
         
for i in range(0,len(shpRecords)):
    polygons=shpRecords[i]['shp_data']['parts']
    for p in polygons:                
        x = []
        y = []
        s='<path class="outline" d=" '
        tempx = float(p['points'][0]['x'])/1000.0
        tempy = 300.0-(float(p['points'][0]['y'])/1000.0-300.0)
        s+='M %.2f %.2f' % (tempx, tempy)
        for j in range(1,len(p['points'])):                    
            tempx = float(p['points'][j]['x'])/1000.0
            tempy = 300.0- (float(p['points'][j]['y'])/1000.0-300.0)
            x.append(tempx)
            y.append(tempy)
            
            s+='L%.2f %.2f' % (tempx,tempy)
        #plt.fill(x,y, color='red', linecolor='black')
        s+=' z "   '
        s+='style="fill:#ff0000;stroke:#444444;" />\n'

        f.write(s)
        plt.plot(x,y, color='black')


f.write("""
</g>
</svg>
""")
        
plt.axis('equal')
plt.title("Testing")
plt.show()


