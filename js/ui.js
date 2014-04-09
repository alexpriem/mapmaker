var regio_ts={};
var regio_ts_min={};
var regio_ts_max={};
var datesel={};
var regiosel=0;
var varsel=varnames[2];



/* chart stuff */
var use_regiomin=true;
var color=[];
var canvas={};
var chart_a;  // placeholders 
var chart_b;
var chart_c;
var chart_width=0;
var chart_height=0;
var chartnames=['a','b','c'];
var prev_chartcolors={};

/* timeseries stuff */
/* need timeseries class for all of this.  */
var xScale={}; 
var yScale={}; 
var xAxis={}; 
var yAxis={}; 
var xGrid={}; 
var yGrid={}; 

var chart_colormap={};

var ts_width=400;
var ts_height=200;
var ts_xpos=ts_width/2;  // label position
var ts_ypos=10;
var ts_sel_color={'a':'red','b':'blue','c':'black'};

var chart_xpos=100;  // label position
var chart_ypos=50;



var datamin;
var datamax;

var current_ts='a';
var cmode='tot';

var MonthName = [ "January", "February", "March", "April", "May", "June",
    				"July", "August", "September", "October", "November", "December" ];









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
	if ((current_ts!='c') && (cmode!='tot')) update_choropleth('c');  // verschil updaten
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

	var records=data.length;	var row, ts,regio;
	
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
	datesel['a']=data[0][datecol];  // init: begin met datum van eerste record.	
	datesel['b']=data[0][datecol];  // init: begin met datum van eerste record.	
	datesel['c']=data[0][datecol];  // init: begin met datum van eerste record.	

	/* dit kan ook in make_ts.py gedaan worden -- scheelt inlaadtijd*/
	total_regio_min=total_regio_max=total_regio[0][varidx];			
	for (i=0; i<total_regio.length;i++) {
		val=total_regio[i][varidx];	
		if ((total_regio_min==null) || (val<total_regio_min)) {total_regio_min=val;}
		if ((total_regio_max==null) || (val>total_regio_max)) {total_regio_max=val;}
		//console.log('chartc:',val,total_regio_min,total_regio_max);
	}
	total_date_min=total_date_max=total_date[0][varidx-1];		
	
	for (i=0; i<total_date.length;i++) {
		val=total_date[i][varidx-1];	
		if ((total_date_min==null) || (val<total_date_min)) {total_date_min=val;}
		if ((total_date_max==null) || (val>total_date_max)) {total_date_max=val;}
	//	console.log('chartc:',val,total_date_min,total_date_max);
	}



	console.log ("prep:",mindate,maxdate); 

	regiosel=data[0][regiocol]; // init: begin met regio van eerste record.
}



function prepare_c_chart (){


	if (cmode=='diff') {
		var dataslice=[];
		// join 2 date-slices in js;   waardes van regio's aftrekken voor datum a en b 
		chartc_min=null;	/* global for the moment */
		chartc_max=null;

		var datesel_a=datesel['a'];
		var datesel_b=datesel['b'];
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
		if ((chartc_min==null) || (val<chartc_min)) {chartc_min=val;}
		if ((chartc_max==null) || (val>chartc_max)) {chartc_max=val;}
		dataslice.push([data[rownr], val]);		
		}
	}
	if (cmode=='tot') {
		chartc_min=total_regio_min;
		chartc_min=total_regio_max;
		var dataslice=total_regio;
	
	}
	if (cmode=='totsel') {
		var dataslice=total_regio;
	}
	if (cmode=='reg') {
		var dataslice=[];
	}

	//console.log ('prepare_c_chart:',cmode, dataslice);
	return dataslice;
}


/* zet waarde van shape, reken waarde eerst om naar kleur */

function set_shape_color_by_value (chartname, regio, val) {

	var current_colormap=chart_colormap[chartname];

	var tgradmin=current_colormap.tgradmin;
	var tdelta=current_colormap.tdelta;
	var gradsteps=current_colormap.gradsteps;
//	console.log('set_shape_color_by_value:',chartname,regio,val);
	colorindex=~~((val-tgradmin)/(tdelta)*gradsteps);  					
	if (colorindex<0) colorindex=0;
	if (colorindex>=gradsteps) colorindex=gradsteps-1;			
	colorindex=parseInt(colorindex);

		//console.log(minval, maxval, colorindex);
	color=colormap[colorindex];					
	colorstring ="rgb("+color[0]+","+color[1]+","+color[2]+")";
		//console.log('#r'+key+'_1',s);
	//console.log('set_shape_color_by_value:',regio,colorstring)
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




function update_selectie () {
	console.log ('selectie=',$(this).val());
	selected_keylabel=$(this).val()
	selected_keyid=key2id[selected_keylabel];
	console.log ('selectie=',selected_keyid);

	update_choropleth (current_ts);	
	if ((current_ts!='c') && (cmode!='tot')) update_choropleth('c');  // verschil updaten
	update_ts(current_ts);	
}





function change_cmode () {
	$('.tab').removeClass('active_selectie');
	$(this).addClass('active_selectie');
	cmode=$(this).attr('data-tab');

	update_choropleth('c');	
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
	var current_ts=evt.target.getAttribute('data-ts');
	datesel[current_ts]=dates[0];	
	console.log ("date set to:",datesel[current_ts]);
	update_choropleth(current_ts);
	update_ts_sel(current_ts);
	return false;
}

function movie_last () {
	var current_ts=evt.target.getAttribute('data-ts');
	datesel[current_ts]=dates[dates.length-1];
	//datesel_asdate=convert_date(datesel);
	console.log ("date set to:",datesel[current_ts]);
	update_choropleth(current_ts);
	update_ts_sel(current_ts);
	return false;
}

function movie_next () {
	var current_ts=evt.target.getAttribute('data-ts');
	var nextdate=dates.indexOf(datesel)+1;
	if (nextdate>=dates.length)
		nextdate=dates.length;
	datesel[current_ts]=dates[nextdate];
	//datesel_asdate=convert_date(datesel);
	console.log ("date set to:",datesel[current_ts]);
	update_choropleth(current_ts);
	update_ts_sel(current_ts);
	return false;
}

function movie_prev () {
	var current_ts=evt.target.getAttribute('data-ts');	
	var nextdate=dates.indexOf(datesel)-1;
	if (nextdate<0)
		nextdate=0;	
	datesel[current_ts]=dates[nextdate];
	console.log ("date set to:",datesel[current_ts]);
	update_choropleth(current_ts);
	update_ts_sel(current_ts);
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

	$('#patch_1').remove();
	$('#patch_2').remove();
	$('#patch_3').remove();
    $('#patch_4').remove();
    $('#patch_5').remove();
    $('#patch_6').remove();


	chart_a=new Chart('a');
	chart_b=new Chart('b');
	chart_c=new Chart('c');

// tab init
	cmode='tot';
    $('.tab').on('click',change_cmode);
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

	chart_colormap['a']=new Colormap('a');
	chart_colormap['b']=new Colormap('b');
	chart_colormap['c']=new Colormap('c');
	console.log(chart_colormap);



	console.log(var_types.indexOf('date'));
	if (var_types.indexOf('date')>=0) {
		console.log('prep');
		prep_data();		
		chart_a.update_choropleth();
		chart_b.update_choropleth();		
		chart_c.update_choropleth();	
		update_ts ('a');
		update_ts ('b');
		update_ts ('c');
		
	}
	

}


$( document ).ready(init_svg);
