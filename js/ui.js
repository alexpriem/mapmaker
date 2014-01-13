var regio_ts={};
var regio_ts_min={};
var regio_ts_max={};
var date2date={};
var datesel=0;
var regiosel=0;
var varsel=varnames[2];

var minval=0;
var maxval=0;
var tminval=0;
var tmaxval=0;

var use_regiomin=true;
var color=[];
var canvas;
var chart;
var chart_width=0;
var chart_height=0;

var xScale=d3.time.scale();
var yScale=d3.scale.linear();

var chart_xpos=125;
var chart_ypos=100;

ts_width=800;
ts_height=200;

var MonthName = [ "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December" ];

function click_date () {
	
	
	xpos=d3.mouse(this)[0];

	console.log(xpos, xScale.invert(xpos));
	newdate=xScale.invert(xpos);	
	datesel=10000*newdate.getFullYear()+100*(newdate.getMonth()+1)+newdate.getDate();
	datesel_asdate=newdate;
	console.log(datesel, datesel_asdate);
	update_choropleth();
	update_ts_sel();
	return false;
}

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


function convert_date (d) {

	var year=parseInt(d/10000.0);
	var month=parseInt((d-year*10000)/100);
	var day=parseInt(d-year*10000-month*100);	
	newdate=new Date(year,month-1,day); 

	return newdate;
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

		val=row[varidx];
		if (!(regio in regio_ts)) {
			regio_ts[regio]=[[ddate,val]];
			regio_ts_min[regio]=val;
			regio_ts_max[regio]=val;
		} else {
			regio_ts[regio].push([ddate,val]);
			if (val<regio_ts_min[regio]) regio_ts_min[regio]=val;
			if (val>regio_ts_max[regio]) regio_ts_max[regio]=val;
		}
	}
	
	mindate=convert_date(var_min[0]);
	maxdate=convert_date(var_max[0]);
	datesel=data[0][0];
	datesel_asdate=convert_date(datesel);
	console.log ("prep:",mindate,maxdate);

	regiosel=data[0][1];
}


function update_choropleth () {

	var records, color, s;


	update_var_info();   // 
	console.log("day/regio/var",datesel,regiosel,varsel);
	records=data.length;
	for (rownr=0; rownr<records; rownr++){	
		row=data[rownr];
		if (row[0]==datesel) {						
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
		} /* if row=datesel */
	} /* for records */


	var d=datesel_asdate;
	datelabel=d.getDate()+' '+MonthName[d.getMonth()]+' '+d.getFullYear();


	$('#chartlabel').remove();
	chart=d3.select("#chart_svg");
	chart.append("text")      // text label for the x axis
		.attr("id","chartlabel")
  		.attr("class","label")
        .attr("x", chart_xpos )
        .attr("y", chart_ypos )
        .style("text-anchor", "middle")
        .attr("font-family", "sans-serif")
  		.attr("font-size", "16px")
  		.attr("font-weight", "bold")
        .text(datelabel);
    
}



function update_ts_sel () {
	$("#ts_line").remove();	
	canvas.append("line")
  		.attr("id","ts_line")
  		.attr("x1",xScale(datesel_asdate))
  		.attr("x2",xScale(datesel_asdate))
  		.attr("y1",yScale(miny))
  		.attr("y2",yScale(maxy))
  		.attr("stroke-width", 1)
  		.attr("stroke", 'red');

  	}



function update_ts () {


 canvas = d3.select("#ts")
    		.append("svg")
    		.attr('xmlns',"http://www.w3.org/2000/svg")
    		.attr('id','svg_ts')            
            .attr("width", ts_width)
            .attr("height", ts_height);            
	
	

	console.log('update_ts:', regiosel, varsel);	

	if (use_regiomin) {
		miny=regio_ts_min[regiosel];
		maxy=regio_ts_max[regiosel]		
	} else {
    	miny=minval;
    	maxy=maxval;
    }

    xScale.domain([mindate,maxdate]);   // time in ms
	xScale.range([50,ts_width]); 

    yScale.domain([maxy,miny]);	
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
    	.text("datum");

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

  d3.select("#svg_ts").on('click', click_date);

  update_ts_sel();


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

	var svg=$("#chart").children()[0];
	$(svg).attr('id','chart_svg');
	
	w=svg.getAttributeNS(null,'width');
	chart_width=w.slice(0,w.length-2);
	h=svg.getAttributeNS(null,'height');
	chart_height=h.slice(0,h.length-2);

	
	$('#patch_3').remove();
    $('#patch_4').remove();
    $('#patch_5').remove();
    $('#patch_6').remove();
	

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
