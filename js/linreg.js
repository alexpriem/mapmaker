// return (a, b) that minimize
// sum_i r_i * (a*x_i+b - y_i)^2
function linear_regression( xydata )
{
    var i, x, y,N,
        sumx=0, sumy=0, sumx2=0, sumy2=0, sumxy=0, sumr=0,sumres=0,
        a, b,r2;

    N=xydata.length;
    for(i=0;i<N; i++)
    {           
        x = xydata[i][1]; 
        y = xydata[i][2];    // element 0 is region
        sumx += x;
        sumx2 += x*x;
        sumy += y;
        sumy2 += y*y;
        sumxy += x*y;
    }    

    // note: the denominator is the variance of the random variable X
    // the only case when it is 0 is the degenerate case X==constant
    var b = (sumy*sumx2 - sumx*sumxy)/(sumr*sumx2-sumx*sumx);
    var a = (sumr*sumxy - sumx*sumy)/(sumr*sumx2-sumx*sumx);
    var residuals=[];
    
    sstot=0;
    avgy=sumy/N;
    for (i=0; i<N; i++) {
        residu=a+b*xydata[i][1]-xydata[i][2];
        residuals.push([0,xydata[i][0],residu]);            // residuals moeten in chartdata-formaat zijn: datum, regio, variabele
        sumres+=residu*residu;

        sst=(xydata[i][2]-sumy);
        sstot+=sst*sst;
    }
    r2=1.0-sumres/sstot;

    return {'a':a,'b':b,'r2':r2, 'residuals':residuals};
}