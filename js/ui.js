var regio_ts={};
var regio_ts_min={};
var regio_ts_max={};
var tabsel;
var datesel={};
var regiosel=0;
var varsel=varnames[2];


var use_regiomin=true;
var color=[];
var canvas={};
var chart;
var chart_width=0;
var chart_height=0;

var xScale=d3.time.scale();
var yScale=d3.scale.linear();

var chart_xpos=125;  // label position
var chart_ypos=100;


var ts_width=400;
var ts_height=200;

var ts_xpos=ts_width/2;  // label position
var ts_ypos=10;
var chartnames=['a','b','c'];
var prev_chartcolors={};
var datamin;
var datamax;

var current_ts='a';


var MonthName = [ "January", "February", "March", "April", "May", "June",
    				"July", "August", "September", "October", "November", "December" ];







function click_ts () {
	
	console.log(this.id);
	current_ts=this.id.slice(this.id.length-1);
	xpos=d3.mouse(this)[0];

	console.log(xpos, xScale.invert(xpos));
	currentdate=xScale.invert(xpos);		
	
// d3 calculates dates according to exact position, so we have to lookup the nearest date in our data. 
// Faster but trickier solution would be to use rounding. This is guaranteed to work, but slower.

	mind=data[0][0];
	mindiff=Math.abs(currentdate-mind);
	for (var d in date_index) {
  		if (date_index.hasOwnProperty(d)) {
  			var d2=new Date(d);
  			//console.log('datediff:',  Math.abs(datesel-d2), mindiff, mind);
  			if (Math.abs(currentdate-d2)<mindiff) {
  				mindiff=Math.abs(currentdate-d2);
  				mind=d2;
  			}
  		}
  	}
  	
  	datesel[current_ts]=mind;
	
	//datesel=10000*newdate.getFullYear()+100*(newdate.getMonth()+1)+newdate.getDate();	
	console.log(mind,datesel);
	update_choropleth(current_ts);
	update_ts_sel(current_ts);
	return false;
}

function click_regio(evt) {

	regiosel=evt.target.getAttribute('data-regio');
	var clicked_id=evt.target.getAttribute('id');	// regio's hebben formaat 'a361_1' -chartnummer,regio,_,shapenr_voor_regio
	current_ts=clicked_id.slice(0,1);
	clickedregio=clicked_id.split('_')[0].slice(1);
	regiolabel=regio_label2key[clickedregio];
	console.log('click_regio:',clickedregio,regiosel, current_ts);

	
//	$('#label_'+current_ts).text(regiolabel);
	$('#svg_ts'+current_ts).remove();		
	update_ts(current_ts);
	return false;
}


function change_var () {

	varsel=$(this).attr('data-varname');
	console.log('change_var:',varsel);

	$('.varname').removeClass('active_selectie');
	$(this).addClass('active_selectie');	
	
	varidx=varnames.indexOf(varsel);
	minval=var_min[varidx];	
	maxval=var_max[varidx];	// FIXME: transform bijhouden.	
	prep_data();
	update_choropleth(current_ts);
	update_ts(current_ts);	
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
	keyidx=varnames.indexOf("key");	
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
		if (keyidx>=0) {					
			if (row[keyidx]!=keysel) continue;
		}

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
	datesel[current_ts]=data[0][datecol];  // init: begin met datum van eerste record.		

	console.log ("prep:",mindate,maxdate); 

	regiosel=data[0][regiocol]; // init: begin met regio van eerste record.
}




/* zet waarde van shape, reken waarde eerst om naar kleur */

function set_shape_color_by_value (chartname, regio, val) {

//	console.log('set_shape_color_by_value:',chartname,regio,val);
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
			el_id='#'+chartname+el_ids[i];						
			$(el_id).css('fill',colorstring).css('color',colorstring);
			}		// for  
		} else {
			console.log("undefined regio:", regio);
	} 													
}


function update_choropleth (chartname) {

	var records, color, colorstring;


	currentdate=datesel[chartname];
	console.log('update_choropleth:',chartname);
	if (currentdate==null) {
		console.log("bailout, currentdate=null");
		return;
	}
// voor entry: currentdate bevat  huidige datumkeuze uit tab.

	chart=d3.select("#chart1");

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
	console.log("update_choropleth:",tgradmin, tgradmax, tdelta);
	console.log("day/regio/var",datesel,regiosel,varsel, varidx);
	records=data.length;	

	regioidx=1;
	dateidx=0;
	dataslice=data;

	if (tabsel=='a-b') {
		dataslice=[];
		// join 2 date-slices in js;   waardes van regio's aftrekken voor datum a en b 

		currentdate_a=datesel['a'];
		currentdate_b=datesel['b'];
		start_row_a=date_index[currentdate_a].start_row;
		start_row_b=date_index[currentdate_b].start_row;
		eind_row_a=date_index[currentdate_a].eind_row;
		eind_row_b=date_index[currentdate_b].eind_row;
		rownr_a=start_row_a;
		rownr_b=start_row_b;
		while ((rownr_a < eind_row_a) && (rownr_b> eind_row_b)) {
			if (data[rownr_a][regioidx]>data[rownr_b][regioidx]) {
				val=data[rownr_a][varidx];
				rownr_a++;
			}
			if (data[rownr_a][regioidx]<data[rownr_b][regioidx]) {
				val=data[rownr_b][varidx];
				rownr_b++;
			}
			if (data[rownr_a][regioidx]==data[rownr_b][regioidx]) {
				val=data[rownr_a][varidx]-data[rownr_b][varidx];
				rownr_a++;
				rownr_b++;
			}
		val=data[rownr][varidx];	
		dataslice.push([data[rownr], val]);		
		}
	}


	prev_regiocolors=prev_chartcolors[chartname];


	start_row=date_index[currentdate].start_row;
	eind_row=date_index[currentdate].eind_row;
	console.log("start:end",start_row, eind_row);
	new_regiocolors={};
	for (i=0; i<regio_keys.length; i++) {
		new_regiocolors[regio_keys[i]]=0;
	}
	
	chart_min=data[0][varidx];  // chart minimum/maximum init.
	chart_max=data[0][varidx];
	for (rownr=start_row; rownr<eind_row; rownr++){	
		row=dataslice[rownr];
		if ((row[0]-currentdate)!=0) {
			console.log("error-update choropleth", row[0],datesel, start_row, eind_row);
			}
		var regio=row[1];			
		val=row[varidx];			
	//	console.log(regio, val);				
		prev_val=prev_regiocolors[regio];   // kleur zetten als 
		                                    // nieuwe waarde ongelijk vorige waarde
		                                    
		if ((val!=prev_val)) {			
			//console.log('regio,p,v',regio,prev_val,val);
			new_regiocolors[regio]=val;			
			if (val<chart_min) { 
				chart_min=val;
			}
			if (val>chart_max) {
				chart_max=val;
			}
			val=color_transform(val);		
			set_shape_color_by_value (chartname, regio,val);
		}
	} /* for records */

	for (var regiokey in prev_regiocolors) {
			prev_val=prev_regiocolors[regiokey];
			val=new_regiocolors[regiokey];
		//	console.log("Prev_regio",regiokey,prev_val,val);
			if ((typeof(val)=='undefined') || (val==0)) {
				//console.log('undefined, dus wissen:',regiokey, val,prev_val)
				set_shape_color_by_value (chartname,regiokey, 0);
			}
		}			
	prev_chartcolors[chartname]=new_regiocolors;

	var d=currentdate;
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

	update_choropleth (current_ts);	
	update_ts(current_ts);	
}




function update_ts_sel (current_ts) {
	$("#ts_line_a").remove();
	$("#ts_line_b").remove();		
	$("#ts_line_c").remove();
	var datesel_a=datesel['a'];
	if (datesel_a!=null) {
		canvas['a'].append("line")
  			.attr("id","ts_line_a")
  			.attr("x1",xScale(datesel_a))
  			.attr("x2",xScale(datesel_a))
  			.attr("y1",yScale(miny))
  			.attr("y2",yScale(maxy))
  			.attr("stroke-width", 1)
  			.attr("stroke", 'red');
  		}
  	var datesel_b=datesel['b'];
  	if (datesel_b!=null) {
		canvas['b'].append("line")
  			.attr("id","ts_line_b")
  			.attr("x1",xScale(datesel_b))
  			.attr("x2",xScale(datesel_b))
  			.attr("y1",yScale(miny))
  			.attr("y2",yScale(maxy))
  			.attr("stroke-width", 1)
  			.attr("stroke", 'blue');
  		}
  	var datesel_c=datesel['c'];
	if (datesel_c!=null) {
		canvas['c'].append("line")
  			.attr("id","ts_line_c")
  			.attr("x1",xScale(datesel_c))
  			.attr("x2",xScale(datesel_c))
  			.attr("y1",yScale(miny))
  			.attr("y2",yScale(maxy))
  			.attr("stroke-width", 1)
  			.attr("stroke", 'blue');
  		}
}



function update_ts (ts_nr) {

  var svg_ts='#svg_ts'+ts_nr;
  $(svg_ts).remove();
  $('#ts_line_'+ts_nr).remove();

  canvas[ts_nr] = d3.select("#ts_"+ts_nr);
  cv=canvas[ts_nr];
  cv.append("svg")
	.attr('xmlns',"http://www.w3.org/2000/svg")
    .attr('id','svg_ts'+ts_nr)            
    .attr("width", ts_width)
    .attr("height", ts_height);            
	
	

	console.log('update_ts:', ts_nr,regiosel, varsel);	

	if (use_regiomin) {
		miny=regio_ts_min[regiosel];
		maxy=regio_ts_max[regiosel]		
	} else {
    	miny=minval;
    	maxy=maxval;
    }

    console.log(mindate,maxdate);
    console.log(ts_width,ts_height);
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

   cv.append("g")
    		.attr("class","grid")
    		.attr("transform","translate(0,"+(ts_height-50)+")")
    		.call(xGrid);
   cv.append("g")
    		.attr("class","grid")
    		.attr("transform","translate(50,0)")
			.call(yGrid);

   cv.append("g")
    		.attr("class","xaxis")
    		.attr("transform","translate(0,"+(ts_height-50)+")")
    		.call(xAxis);
   cv.append("g")
    		.attr("class","yaxis")
    		.attr("transform","translate(50,0)")
    		.call(yAxis);

/* xas / yas labels */
    cv.append("text")
    	.attr("class", "label")
    	.attr("y", ts_height-10)
    	.attr("x", ts_width/2)    	
    	.text(xlabel);

    cv.append("text")
    	.attr("class", "label")
    	.attr("x", 0)
    	.attr("y", 0)    	
    	.attr("transform", "translate(12,100)rotate(270)")    
    	.text(ylabel);

	

	var line=d3.svg.line()	
		.x(function(d,i)  { return xScale(xdata[i]); })
		.y(function(d,i)  {  /*console.log('ts:',d,i, yScale(d));*/ return yScale(d); }); 

	
	xdata=[];
	ydata=[];
	if (!(regiosel in regio_ts)) {
		console.log("bailout, no regiodata");
		return;
	}
	//regioreeks=regio_ts[regiosel];

	console.log(regioreeks);
	for (i=0; i<regioreeks.length; i++) xdata.push(regioreeks[i][0]);  
	for (i=0; i<regioreeks.length; i++) ydata.push(regioreeks[i][1]);  

	console.log('datalen:',regioreeks.length);

	console.log('daydata:',regioreeks[1]);
	for (i=1; i<regioreeks.length; i++) {    		
		cv.append("svg:path")
			//.attr("id","l_"+day+"_"+month)
			.attr("class","dayl")
			.attr("d", line(ydata));				
	}


 	d3.select(svg_ts).on('click', click_ts);
 	$('#ts_label_'+current_ts).remove();

 	var ts_label=regio_label2key[regiosel];

 	console.log('labelpos:',ts_xpos, ts_ypos);
	cv.append("text")      // text label for the x axis
		.attr("id","ts_label_"+current_ts)
  		.attr("class","label")
        .attr("x", ts_xpos )
        .attr("y", ts_ypos )
        .style("text-anchor", "middle")
        .attr("font-family", "sans-serif")
  		.attr("font-size", "16px")
  		.attr("font-weight", "bold")
        .text(ts_label);

  update_ts_sel(ts_nr);
}

/*
function change_tab () {
	$('.tab').removeClass('active_selectie');
	$(this).addClass('active_selectie');
	tabsel=$(this).attr('data-tab');
	datesel=datesel[tabsel];		
	update_choropleth(tabsel);
}
*/




function setup_vars () {
	console.log('setup_vars');
	var html='';
	html+='<li class="sel_heading"> Variable: </li>';
	for (i=0; i<varnames.length; i++) {
		console.log(var_types[i]);
		if (var_types[i]=='data'){
			var varname=varnames[i];
			html+='<li id="v_'+varname+'" data-varname="'+varname+'" class="varname">'+varname  + '</li>';
		}	
	}
	

	$('#varlist').html(html);
	$('.varname').on('click',change_var);	
	$('.varname').on('mouseenter ',enter_selectie);
	$('.varname').on('mouseout ',leave_selectie);
	$('#v_'+varsel).addClass('active_selectie');
}



function movie_begin (evt) {
	current_ts=evt.target.getAttribute('data-ts');
	var currentdate=dates[0];	
	console.log(currentdate);

	datesel[current_ts]=currentdate;
	
	console.log ("date set to:",currentdate);
	update_choropleth(current_ts);
	update_ts_sel(current_ts);
	return false;
}

function movie_last () {
	var current_ts=evt.target.getAttribute('data-ts');
	var currentdate=dates[dates.length-1];
	datesel[current_ts]=currentdate;
	
	console.log ("date set to:",currentdate);
	update_choropleth(current_ts);
	update_ts_sel(current_ts);
	return false;
}

function movie_next () {
	var current_ts=evt.target.getAttribute('data-ts');
	var nextdate=dates.indexOf(datesel[current_ts])+1;
	if (nextdate>=dates.length)
		nextdate=dates.length;
	currentdate=dates[nextdate];
	datesel[current_ts]=currentdate;
	//datesel_asdate=convert_date(datesel);
	console.log ("date set to:",currentdate);
	update_choropleth(current_ts);
	update_ts_sel(current_ts);
	return false;
}

function movie_prev () {
	var current_ts=evt.target.getAttribute('data-ts');
	var nextdate=dates.indexOf(datesel[current_ts])-1;
	if (nextdate<0)
		nextdate=0;	
	datesel=dates[nextdate];
	currentdate=dates[nextdate];
	datesel[current_ts]=currentdate;
	//datesel_asdate=convert_date(datesel);
	console.log ("date set to:",datesel);
	update_choropleth(current_ts);
	update_ts_sel(current_ts);
	return false;
}

function movie_start () {
	var current_ts=evt.target.getAttribute('data-ts');
	console.log("start player");
	dateindex=dates.indexOf(datesel[currentsel]);

	stop_player=false;
	setTimeout (movie_nextframe,200);
	return false;
}

function movie_nextframe() {
	var current_ts=evt.target.getAttribute('data-ts');
	console.log('nextframe:',dateindex,stop_player);
	if (stop_player) return;
	dateindex+=1;
	if (dateindex>=dates.length){
		console.log('ended');
		stop_player=true;
		return;
	}
	datesel[current_ts]=dates[dateindex];
	//datesel_asdate=convert_date(datesel);
	update_choropleth(current_ts);
	update_ts_sel(current_ts);
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

	$('#headertxt').html('<b>'+ label+ '</b>');
	$('#axes_1').on('click',click_regio);
	
	window.document.title=label;

	var chartdiv=document.getElementById('chartbox1');
	var chart1=chartdiv.children[0];
	chart1.setAttribute("id","chart1");	
	chart1.removeAttribute("viewBox");	

	w=chart1.getAttributeNS(null,'width');
	chart_width=parseInt(w.slice(0,w.length-2));
	chart1.setAttributeNS(null,'width',(chart_width-175)+'pt');
	chart1.setAttributeNS(null,'padding',-50+'px');
	h=chart1.getAttributeNS(null,'height');
	chart_height=h.slice(0,h.length-2);

	
	$('#patch_1').remove();
	$('#patch_2').remove();
	$('#patch_3').remove();
    $('#patch_4').remove();
    $('#patch_5').remove();
    $('#patch_6').remove();

	
	chart2 = chart1.cloneNode(true);
	chart2.setAttribute("id","chart2");
	$('#chartbox2').append(chart2);

//	chart2=document.getElementById('chart2');
	console.log(chart2);
	var subnodes=chart2.childNodes;
	/* this should not fail, 'figure_1' is always in the svg */	

	el=chart2.firstElementChild;
	while (el) {    	
		if (el.getAttribute('id')=='figure_1') {
				var fignode=el;
				break;
			}
    	el = el.nextElementSibling;
  	}

	fignode.setAttribute('id','figure_2');
	axisnode=fignode.firstElementChild;
	axisnode.setAttribute('id','axes_2');
	groupnode=axisnode.firstElementChild
	while (groupnode) {
		var pathnode=groupnode.firstElementChild;
		var pathid=pathnode.getAttribute('id');
		if (pathid!=null) {
			pathnode.setAttribute('id','b'+pathid.slice(1));
		}
		groupnode = groupnode.nextElementSibling;
	}


	$('#axes_2').on('click',click_regio);
	
	chart3 = chart1.cloneNode(true);
	chart3.setAttribute("id","chart3");
	$('#chartbox3').append(chart3);
	//svg.setAttributeNS(null,'width',(chart_width+200)+'pt');
	
	for (i=chartnames.length; i--;) {
		chartname=chartnames[i];
		console.log()
		prev_regiocolors={};
		for (j=regio_keys.length; j--;) {		
			prev_regiocolors[regio_keys[i]]=0;
		}
		prev_chartcolors[chartname]=prev_regiocolors;
		datesel[chartname]=data[0][0];
		canvas[chartname] = d3.select("#ts_"+chartname);
	}


// tab init
/*
	tabsel='a';
    $('.tab').on('click',change_tab);
    $('#tab_a').addClass('active_selectie');
    $('.tab').on('mouseenter ',enter_selectie);
	$('.tab').on('mouseout ',leave_selectie);
*/

// selectie init
    if (('key' in var_types) && (country_labels.length>0))  {    	
		$('#keyentry').typeahead({source:country_labels,  valueKey: "Country"});
		$('#keyentry').on('change',update_selectie);
	} else {
		$('#keyentry').css('display','none');
		$('#keylabel').css('display','none');
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
		console.log('datesel:',datesel);
		update_choropleth('a');
		update_choropleth('b');		
		update_ts ('a');
		update_ts ('b');
		update_ts ('c');

	}
	

}


$( document ).ready(init_svg);
