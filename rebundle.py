import re,os,sys, shutil

arg=sys.argv[1]
matches=sorted([f for f in os.listdir('.') if re.match(arg+'.*\.png', f)])

j=10001
for f in matches:
    newname=arg+'_'+str(j)[1:]+'.png'
    print f,newname
    shutil.copyfile(f, newname)
    j+=1
    

