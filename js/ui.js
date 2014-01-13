var regio_ts={};
var date2date={};
var daysel=0;
var regiosel=0;
var varsel=varnames[2];

var minval=0;
var maxval=0;
var tminval=0;
var tmaxval=0;

var color=[];
var canvas;

ts_width=800;
ts_height=200;

function click_regio() {

	$('#svg_ts').remove();
	console.log(this.id);	
	r=this.id.split('_')[0];
	regiosel=r.slice(1);
	console.log(regiosel);
	update_ts();
	return false;
}


function update_var_info ()  {

	varidx=varnames.indexOf(varsel);
	minval=var_min[varidx];
	tminval=minval;
	if (minval!=0) tminval=Math.log(minval);	
	maxval=var_max[varidx];	// FIXME: transform bijhouden.
	tmaxval=minval;
	if (maxval!=0) tmaxval=Math.log(maxval);
}

function change_var () {

/* todo: cleanup  + handle multipolygons */

	
	var varsel=this.id.split('_')[1];
	console.log(varsel);
	update_var_info ();
	update_choropleth();	
	return false;
}


function prep_data () {

	var records=data.length;
	var row, ts,regio;
	

	for (i=0; i<records; i++) {
		row=data[i];
		d=row[0];
		regio=row[1];

		year=parseInt(d/10000.0);
		month=parseInt((d-year*10000)/100);
		day=parseInt(d-year*10000-month*100);		
		ddate= new Date(year,month-1,day); 
		date2date[d]= ddate;

		if (!(regio in regio_ts)) {
			regio_ts[regio]=[[ddate,row[2]]];
		} else {
			regio_ts[regio].push([ddate,row[2]]);
		}
	}

	min_d=var_min[0];
	year=parseInt(min_d/10000.0);
	month=parseInt((min_d-year*10000)/100);
	day=parseInt(min_d-year*10000-month*100);	
	mindate=new Date(year,month-1,day); 

	max_d=var_max[0];
	year=parseInt(max_d/10000.0);
	month=parseInt((max_d-year*10000)/100);
	day=parseInt(max_d-year*10000-month*100);	
	maxdate=new Date(year,month-1,day); 

	daysel=data[0][0];
	regiosel=data[0][1];
}


function update_choropleth () {

	var records, color, s;


	update_var_info();   // 
	console.log("day/regio/var",daysel,regiosel,varsel);
	records=data.length;
	for (rownr=0; rownr<records; rownr++){	
		row=data[rownr];
		if (row[0]==daysel) {						
			var regio=row[1];			
			val=row[varidx];			
		//	console.log(regio, val);
			if (val!=0){
				val=Math.log(val);
		//		console.log(val);
				colorindex=parseInt(254*(val-tminval)/(1.0*(tmaxval-tminval)));
				
				//console.log(minval, maxval, colorindex);
				color=colormap[colorindex];
				
				s="rgb("+color[0]+","+color[1]+","+color[2]+")";
				//console.log('#r'+key+'_1',s);
				el_ids=shape_ids[regio];
				
				if (typeof(el_ids)!="undefined") {
					
					for (i=0; i<el_ids.length; i++) {
						el_id='#'+el_ids[i];										
						el=$(el_id);
						c=$(el).children();						
						 for (j=0; j<c.length; j++){
							c_j=c[j];
							$(c_j).css('fill',s);
							$(c_j).css('color',s);
							}	// for */
						}		// for  
					} // if typeof  
					else {
						console.log("undefined regio:", regio);
					} 
						
			} /* if val!=0 */
		} /* if row=daysel */
	} /* for records */


}



function update_ts () {


 canvas = d3.select("#ts")
    		.append("svg")
    		.attr('xmlns',"http://www.w3.org/2000/svg")
    		.attr('id','svg_ts')            
            .attr("width", ts_width)
            .attr("height", ts_height);            
	
	var xScale=d3.time.scale();
    xScale.domain([mindate,maxdate]);   // time in ms
	xScale.range([50,ts_width]); 


	console.log('update_ts:', regiosel, varsel);
	var yScale=d3.scale.linear();
    yScale.domain([maxval, minval]);
	yScale.range([50,ts_height-50]); 
	var line = d3.svg.line();

	var xAxis=d3.svg.axis();
    xAxis.scale(xScale)
    	.orient("bottom");

	var yAxis=d3.svg.axis();
    yAxis.scale(yScale)
    	.orient("left")   
    	.tickFormat(function(d) {
    			if ((d/1000)>=1) { d=d/1000+"k"; }
    			return d;
			});


	var xGrid=d3.svg.axis();
    xGrid.scale(xScale)
    	.orient("bottom")
    	.tickSize(-0.7*ts_height,0,0)
    	.tickFormat(function(d) {
    			return "";

			});
    		
 	var yGrid=d3.svg.axis();
    yGrid.scale(yScale)
    	.orient("left")
    	.tickSize(-ts_width,0,0)
    	.tickFormat(function(d) {
    			return "";

			});

/* place axis & grids */

   canvas.append("g")
    		.attr("class","grid")
    		.attr("transform","translate(0,"+(ts_height-50)+")")
    		.call(xGrid);
   canvas.append("g")
    		.attr("class","grid")
    		.attr("transform","translate(50,0)")
			.call(yGrid);

   canvas.append("g")
    		.attr("class","xaxis")
    		.attr("transform","translate(0,"+(ts_height-50)+")")
    		.call(xAxis);
   canvas.append("g")
    		.attr("class","yaxis")
    		.attr("transform","translate(50,0)")
    		.call(yAxis);

/* xas / yas labels */
    canvas.append("text")
    	.attr("class", "label")
    	.attr("y", ts_height-10)
    	.attr("x", ts_width/2)
    	.text("tijd (uur)");

    canvas.append("text")
    	.attr("class", "label")
    	.attr("y", ts_height/2)
    	.attr("x", 10)
    	.text("label");

	

var line=d3.svg.line()
	.x(function(d,i)  { return xScale(xdata[i]); })
	.y(function(d,i)  {  /*console.log(d,i, yScale(d));*/ return yScale(d); }); 

	
	xdata=[];
	ydata=[];
	regioreeks=regio_ts[regiosel];

	for (i=0; i<regioreeks.length; i++) xdata.push(regioreeks[i][0]);  
	for (i=0; i<regioreeks.length; i++) ydata.push(regioreeks[i][1]);  

	console.log('daydata:',regioreeks[1]);
	for (i=1; i<regioreeks.length; i++) {    		
		canvas.append("svg:path")
			//.attr("id","l_"+day+"_"+month)
			.attr("class","dayl")
			.attr("d", line(ydata))
			.style("stroke","blue")
			.style("fill","none")
			.style("stroke-width","2")
			.style("opacity","0.9");
			
	}


}







function setup_vars () {
	var html='';
	var start=1;
	if (has_date) start=2;
	for (i=start; i<varnames.length; i++) {
		var varname=varnames[i];
		html+='<li class="varnameli"> <a href="#" id="v_'+varname+'_'+i+'"" class="varname">'+varname  + '</a></li>';
	
	}

	$('#varlist').html(html);
	$('.varname').on('click',change_var);
}



function init_svg(){
	console.log('init_svg');
	$('.outline').on('click',click_regio);

	setup_vars();	
	update_var_info();
	colormap=colormap_hot(256);	
	//console.log(colormap);
	console.log(minval,maxval,varsel);

	if (has_date) {
		prep_data();		
		update_choropleth();
		update_ts ();
	}
	

}


$( document ).ready(init_svg);