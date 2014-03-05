var regio_ts={};
var regio_ts_min={};
var regio_ts_max={};
var tabsel;
var datesel_a=null;
var datesel_b=null;
var datesel=null;
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







function click_ts () {
	
	
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
  			//console.log('datediff:',  Math.abs(datesel-d2), mindiff, mind);
  			if (Math.abs(datesel-d2)<mindiff) {
  				mindiff=Math.abs(datesel-d2);
  				mind=d2;
  			}
  		}
  	}
  	datesel=mind;  	
	if (tabsel=='a') {
		datesel_a=mind;		
	}
	if (tabsel=='b') {
		datesel_b=mind;		
	}

	//datesel=10000*newdate.getFullYear()+100*(newdate.getMonth()+1)+newdate.getDate();	
	console.log(datesel,datesel_a,datesel_b);
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

	varsel=$(this).attr('data-varname');
	console.log('change_var:',varsel);

	$('.varname').removeClass('active_selectie');
	$(this).addClass('active_selectie');	
	
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
	datesel_a=datesel;

	console.log ("prep:",mindate,maxdate); 

	regiosel=data[0][regiocol]; // init: begin met regio van eerste record.
}




function update_choropleth () {

	var records, color, colorstring;


	if (datesel==null) {
		console.log("bailout, datesel=null");
		return;
	}
// voor entry: datesel bevat  huidige datumkeuze uit tab.

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

	regioidx=1;
	dateidx=0;
	dataslice=data;

	if (tabsel=='a-b') {
		dataslice=[];
		// join 2 date-slices in js;   waardes van regio's aftrekken voor datum a en b 

		start_row_a=date_index[datesel_a].start_row;
		start_row_b=date_index[datesel_b].start_row;
		eind_row_a=date_index[datesel_a].eind_row;
		eind_row_b=date_index[datesel_b].eind_row;
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



	start_row=date_index[datesel].start_row;
	eind_row=date_index[datesel].eind_row;
	console.log("start:end",start_row, eind_row);
	new_regiocolors={};
	chart_min=data[0][varidx];  // chart minimum/maximum init.
	chart_max=data[0][varidx];
	for (rownr=start_row; rownr<eind_row; rownr++){	
		row=dataslice[rownr];
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

	var d=datesel;
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
	$("#ts_line_a").remove()
	$("#ts_line_b").remove();	;	
	if (datesel_a!=null) {
		canvas.append("line")
  			.attr("id","ts_line_a")
  			.attr("x1",xScale(datesel_a))
  			.attr("x2",xScale(datesel_a))
  			.attr("y1",yScale(miny))
  			.attr("y2",yScale(maxy))
  			.attr("stroke-width", 1)
  			.attr("stroke", 'red');
  		}
  	if (datesel_b!=null) {
		canvas.append("line")
  			.attr("id","ts_line_b")
  			.attr("x1",xScale(datesel_b))
  			.attr("x2",xScale(datesel_b))
  			.attr("y1",yScale(miny))
  			.attr("y2",yScale(maxy))
  			.attr("stroke-width", 1)
  			.attr("stroke", 'blue');
  		}


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
    	.text(xlabel);

    canvas.append("text")
    	.attr("class", "label")
    	.attr("x", 0)
    	.attr("y", 0)    	
    	.attr("transform", "translate(12,100)rotate(270)")    
    	.text(ylabel);

	

var line=d3.svg.line()
	.interpolate("monotone") 
	.x(function(d,i)  { return xScale(xdata[i]); })
	.y(function(d,i)  {  /*console.log(d,i, yScale(d));*/ return yScale(d); }); 

	
	xdata=[];
	ydata=[];
	if (!(regiosel in regio_ts)) {
		console.log("bailout, no regiodata");
		return;
	}
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


 	d3.select("#svg_ts").on('click', click_ts);
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


function change_tab () {
	$('.tab').removeClass('active_selectie');
	$(this).addClass('active_selectie');
	tabsel=$(this).attr('data-tab');
	if (tabsel=='a') {
		datesel=datesel_a;		
	}
	if (tabsel=='b') {
		datesel=datesel_b;		
	}

	update_choropleth();
}





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

function movie_begin () {
	datesel=dates[0];
	//datesel_asdate=convert_date(datesel);
	console.log ("date set to:",datesel);
	update_choropleth();
	update_ts_sel();
	return false;
}

function movie_last () {
	datesel=dates[dates.length-1];
	//datesel_asdate=convert_date(datesel);
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
	//datesel_asdate=convert_date(datesel);
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
	//datesel_asdate=convert_date(datesel);
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
	//datesel_asdate=convert_date(datesel);
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

	$('#headertxt').html('<b>'+ label+ '</b>');
	$('#axes_1').on('click',click_regio);
	window.document.title=label;

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

// tab init
	tabsel='a';
    $('.tab').on('click',change_tab);
    $('#tab_a').addClass('active_selectie');
    $('.tab').on('mouseenter ',enter_selectie);
	$('.tab').on('mouseout ',leave_selectie);

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
		update_choropleth();
		update_ts ();
	}
	

}


$( document ).ready(init_svg);
