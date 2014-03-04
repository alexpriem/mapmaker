var regio_ts={};
var regio_ts_min={};
var regio_ts_max={};
var datesel=0;
var regiosel=0;
var varsel=varnames[2];


var use_regiomin=true;
var color=[];
var canvas;
var chart;
var chart_width=0;
var chart_height=0;

var xScale=d3.time.scale();
var yScale=d3.scale.linear();

var chart_xpos=125;  // label position
var chart_ypos=100;

var ts_xpos=400;  // label position
var ts_ypos=10;
var prev_regiocolors={};
var datamin;
var datamax;


ts_width=650;
ts_height=200;

var MonthName = [ "January", "February", "March", "April", "May", "June",
    				"July", "August", "September", "October", "November", "December" ];







function click_date () {
	
	
	xpos=d3.mouse(this)[0];

	console.log(xpos, xScale.invert(xpos));
	newdate=xScale.invert(xpos);	
	datesel=newdate;

// d3 calculates dates according to exact position, so we have to lookup the nearest date in our data. 
// Faster but trickier solution would be to use rounding. This is guaranteed to work, but slower.

	mind=data[0][0];
	mindiff=Math.abs(datesel-mind);
	for (var d in date_index) {
  		if (date_index.hasOwnProperty(d)) {
  			var d2=new Date(d);
  			console.log('datediff:',  Math.abs(datesel-d2), mindiff, mind);
  			if (Math.abs(datesel-d2)<mindiff) {
  				mindiff=Math.abs(datesel-d2);
  				mind=d2;
  			}
  		}
  	}
  	datesel=mind;

	//datesel=10000*newdate.getFullYear()+100*(newdate.getMonth()+1)+newdate.getDate();
	datesel_asdate=mind;
	console.log(datesel, datesel_asdate);
	update_choropleth();
	update_ts_sel();
	return false;
}

function click_regio(evt) {

	$('#svg_ts').remove();	
	r=evt.target.id.split('_')[0];
	regiosel=r.slice(1);
	console.log('regio:',regiosel);
	update_ts();

	return false;
}


function change_var () {

/* todo: cleanup  + handle multipolygons */
	
	varsel=$(this).attr('data-varname');
	console.log('change_var:',varsel);
	varidx=varnames.indexOf(varsel);
	minval=var_min[varidx];	
	maxval=var_max[varidx];	// FIXME: transform bijhouden.	
	prep_data();
	update_choropleth();	
	update_ts();	
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
	
	prevd=0;
	start_i=0;
	dates=[];
	date_index={};
	regiocol=var_types.indexOf("regio");
	datecol=var_types.indexOf("date");
	varidx=varnames.indexOf(varsel);
	datamin=data[0][varidx];
	datamax=data[0][varidx];


	ts_total=[];
	for (i=0; i<regio_keys.length;i++) {
		key=regio_keys[i];
		regio_ts[key]=[];
		regio_ts_min[key]=[];	
		regio_ts_max[key]=[];
	}
	for (i=0; i<records; i++) {
		row=data[i];
		d=row[datecol];
		regio=row[regiocol];		

		val=row[varidx];
		if (d-prevd!=0)  {			 // stupid javascript unable to compare dates
			dates.push(d);			
			if (prevd!=0) {
				date_index[prevd]={start_row:start_i, eind_row:i-1}
				start_i=i;
				ts_total.push([prevd,total]);
			}			
			total=0;
			prevd=d;			
		}

		total+=val;
		if (val<datamin) {
			datamin=val;
		}
		if (val>datamax) {
			datamax=val;
		}		
		regio_ts[regio].push([d,val]);
		if (val<regio_ts_min[regio]) regio_ts_min[regio]=val;
		if (val>regio_ts_max[regio]) regio_ts_max[regio]=val;		
	}

	date_index[prevd]={startdatum:start_i, einddatum:i-1}
	ts_total.push([prevd,total]);

	mindate=var_min[datecol];
	maxdate=var_max[datecol];
	datesel=data[0][datecol];  // init: begin met datum van eerste record.
	datesel_asdate=datesel; //convert_date(datesel);
	console.log ("prep:",mindate,maxdate,datesel_asdate); 

	regiosel=data[0][regiocol]; // init: begin met regio van eerste record.
}




function update_choropleth () {

	var records, color, colorstring;

	chart=d3.select("#chart_svg");

	if (gradmax=='max') {
		tgradmax=datamax;      // max is afhankelijk van keuze
	} else {
		tgradmax=gradmax;
	}
	tgradmin=gradmin;
	draw_colormap(); 

	tgradmin=color_transform(gradmin);
	tgradmax=color_transform(tgradmax);
	tdelta=tgradmax-tgradmin;

	console.log("update_choropleth:",tgradmin, tgradmax, tdelta)

	console.log("day/regio/var",datesel,regiosel,varsel, varidx);
	records=data.length;	
	start_row=date_index[datesel].start_row;
	eind_row=date_index[datesel].eind_row;
	console.log("start:end",start_row, eind_row);
	new_regiocolors={};
	chart_min=data[0][varidx];  // chart minimum/maximum init.
	chart_max=data[0][varidx];
	for (rownr=start_row; rownr<eind_row; rownr++){	
		row=data[rownr];
		if (row[0]!=datesel) {
			console.log("error-update choropleth", start_row, eind_row);
			}
		var regio=row[1];			
		val=row[varidx];			
	//	console.log(regio, val);				
		prev_val=prev_regiocolors[regio];   // kleur zetten als - nieuwe waarde !=0
		                                    // oude waarde ongelijk vorige waarde
		                                    // 
		if ((val!=0) || ((typeof(prev_val)!="undefined") && (val!=prev_val))) {
			if (val!=0) {
				new_regiocolors[regio]=val;
			}
			if (val<chart_min) { 
				chart_min=val;
			}
			if (val>chart_max) {
				chart_max=val;
			}
			val=color_transform(val);
		//console.log(val);
			//colorindex=parseInt(gradsteps*(val-tminval)/(1.0*(tmaxval-tminval)));	

			colorindex=~~((val-tgradmin)/(tdelta)*gradsteps);  					
			if (colorindex<0) colorindex=0;
			if (colorindex>=gradsteps) colorindex=gradsteps-1;			
			colorindex=parseInt(colorindex);

				//console.log(minval, maxval, colorindex);
			color=colormap[colorindex];					
			colorstring ="rgb("+color[0]+","+color[1]+","+color[2]+")";
				//console.log('#r'+key+'_1',s);
			el_ids=shape_ids[regio];				
			if (typeof(el_ids)!="undefined") {

				for (i=0; i<el_ids.length; i++) {
					el_id='#'+el_ids[i];						
					$(el_id).css('fill',colorstring).css('color',colorstring);
					}		// for  
				} else {
					console.log("undefined regio:", regio);
			} 													
		}
	} /* for records */
	prev_regiocolors=new_regiocolors;

	var d=datesel_asdate;
	console.log(d, typeof(d));
	datelabel=d.getDate()+' '+MonthName[d.getMonth()]+' '+d.getFullYear();


	$('#chartlabel').remove();	
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



function update_selectie () {
	console.log ('selectie=',$(this).val());
	selected_keylabel=$(this).val()
	selected_keyid=key2id[selected_keylabel];
	console.log ('selectie=',selected_keyid);

	update_choropleth ();	
	update_ts();	
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


 $('#svg_ts').remove();
 $('#svg_line').remove();
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
    	.ticks(5)
    	.tickFormat(function(d) {
    			if ((d/1000)>=1) { d=d/1000+"k"; }
    			return d;
			});


	var xGrid=d3.svg.axis();
    xGrid.scale(xScale)
    	.orient("bottom")
    	.tickSize(-0.5*ts_height,0,0)
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
    	.attr("x", 0)
    	.attr("y", 0)    	
    	.attr("transform", "translate(12,100)rotate(270)")    
    	.text("events");

	

var line=d3.svg.line()
	.interpolate("monotone") 
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
			.attr("d", line(ydata));
				
	}


 	d3.select("#svg_ts").on('click', click_date);
 	$('#ts_label').remove();

 	var ts_label=regio_label2key[regiosel];

 	console.log('labelpos:',ts_xpos, ts_ypos);
	canvas.append("text")      // text label for the x axis
		.attr("id","ts_label")
  		.attr("class","label")
        .attr("x", ts_xpos )
        .attr("y", ts_ypos )
        .style("text-anchor", "middle")
        .attr("font-family", "sans-serif")
  		.attr("font-size", "16px")
  		.attr("font-weight", "bold")
        .text(ts_label);

  update_ts_sel();
}







function setup_vars () {
	console.log('setup_vars');
	var html='';
	
	for (i=0; i<varnames.length; i++) {
		console.log(var_types[i]);
		if (var_types[i]=='data'){
			var varname=varnames[i];
			html+='<li class="varnameli"> <a href="#" data-varname="'+varname+'" class="varname">'+varname  + '</a></li>';
		}	
	}


	$('#varlist').html(html);
	$('.varname').on('click',change_var);
}

function movie_begin () {
	datesel=dates[0];
	datesel_asdate=convert_date(datesel);
	console.log ("date set to:",datesel);
	update_choropleth();
	update_ts_sel();
	return false;
}

function movie_last () {
	datesel=dates[dates.length-1];
	datesel_asdate=convert_date(datesel);
	console.log ("date set to:",datesel);
	update_choropleth();
	update_ts_sel();
	return false;
}

function movie_next () {
	var nextdate=dates.indexOf(datesel)+1;
	if (nextdate>=dates.length)
		nextdate=dates.length;
	datesel=dates[nextdate];
	datesel_asdate=convert_date(datesel);
	console.log ("date set to:",datesel);
	update_choropleth();
	update_ts_sel();
	return false;
}

function movie_prev () {
	var nextdate=dates.indexOf(datesel)-1;
	if (nextdate<0)
		nextdate=0;	
	datesel=dates[nextdate];
	datesel_asdate=convert_date(datesel);
	console.log ("date set to:",datesel);
	update_choropleth();
	update_ts_sel();
	return false;
}

function movie_start () {
	console.log("start player");
	dateindex=dates.indexOf(datesel);

	stop_player=false;
	setTimeout (movie_nextframe,200);
	return false;
}

function movie_nextframe() {

	console.log('nextframe:',dateindex,stop_player);
	if (stop_player) return;
	dateindex+=1;
	if (dateindex>=dates.length){
		console.log('ended');
		stop_player=true;
		return;
	}
	datesel=dates[dateindex];	
	datesel_asdate=convert_date(datesel);
	update_choropleth();
	update_ts_sel();
	setTimeout (movie_nextframe,10);		
	return false;	
}


function movie_pause () {
	stop_player=true;
	return false;
}

	

function init_movie_ui () {
	$('#m_begin').on('click',movie_begin);
	$('#m_prev').on('click',movie_prev);
	$('#m_start').on('click',movie_start);
	$('#m_pause').on('click',movie_pause);
	$('#m_next').on('click',movie_next);
	$('#m_last').on('click',movie_last);
}




function init_svg(){
	console.log('init_svg');
	//$('.outline').on('click',click_regio);
	$('#axes_1').on('click',click_regio);

	var svg=document.getElementById('chart').children[0];
	svg.setAttribute("id","chart_svg");	
	svg.removeAttribute("viewBox");	
	w=svg.getAttributeNS(null,'width');
	chart_width=parseInt(w.slice(0,w.length-2));
	svg.setAttributeNS(null,'width',(chart_width+200)+'pt');
	h=svg.getAttributeNS(null,'height');
	chart_height=h.slice(0,h.length-2);

	
	$('#patch_1').remove();
	$('#patch_2').remove();
	$('#patch_3').remove();
    $('#patch_4').remove();
    $('#patch_5').remove();
    $('#patch_6').remove();

    if (country_labels.length>0) {
    	console.log('typeahead');
		$('#keyentry').typeahead({source:country_labels});
		$('#keyentry').on('change',update_selectie);
	}
	setup_vars();		
	init_movie_ui();
	init_colormaps();
	//console.log(colormap);
	console.log(minval,maxval,varsel);

	console.log(var_types.indexOf('date'));
	if (var_types.indexOf('date')>=0) {
		console.log('prep');
		prep_data();		
		update_choropleth();
		update_ts ();
	}
	

}


$( document ).ready(init_svg);
