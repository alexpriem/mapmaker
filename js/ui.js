var regio_ts={};
var regio_ts_min={};
var regio_ts_max={};
var datesel={};
var regiosel=0;
var varsel=varnames[2];


var chartnames=['a','b','c'];
var selected_charts=[chartnames[0]];  

/* chart stuff */

var color=[];
var charts={};
var timeseries={};



/* timeseries stuff */

var ts_width=400;
var ts_height=200;
var ts_xpos=ts_width/2;  // label position
var ts_ypos=10;
var ts_sel_color={'a':'red','b':'blue','c':'black'};

var datamin;
var datamax;

var current_chart='a';
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

	var chart=charts[current_chart];
	chart.update_choropleth();
	if ((current_chart!='c') && (cmode!='tot')) charts['c'].update_choropleth();  // verschil updaten //fixme: 'c' uit context halen.

	var timeserie=timeseries[current_chart];
	timeseries.update_ts();	
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





function update_key_selectie () {
	console.log ('selectie=',$(this).val());
	selected_keylabel=$(this).val()
	selected_keyid=key2id[selected_keylabel];
	console.log ('selectie=',selected_keyid);

	var chart=charts[current_chart];
	chart.update_choropleth ();	
	if ((current_chart!='c') && (cmode!='tot')) charts['c'].update_choropleth();  // verschil updaten FIXME: 'c' uit context halen
	var timeserie=timeseries[current_chart];
	timeserie.update_ts();	
}





function change_cmode () {
	$('.tab').removeClass('active_selectie');
	$(this).addClass('active_selectie');
	cmode=$(this).attr('data-tab');

	charts['c'].update_choropleth();	// FIXME: 'c' uit context halen
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

function movie_begin (evt) {
	var current_chart=evt.target.getAttribute('data-ts');
	datesel[current_chart]=dates[0];	
	console.log ("date set to:",datesel[current_chart]);
	var chart=charts[current_chart];
	var timeserie=timeseries[current_chart];
	chart.update_choropleth();
	timeserie.update_ts_sel();
	return false;
}

function movie_last (evt) {
	var current_chart=evt.target.getAttribute('data-ts');
	datesel[current_chart]=dates[dates.length-1];
	//datesel_asdate=convert_date(datesel);
	console.log ("date set to:",datesel[current_chart]);
	var chart=charts[current_chart];
	var timeserie=timeseries[current_chart];
	chart.update_choropleth();
	timeserie.update_ts_sel();
	return false;
}

function movie_next (evt) {
	var current_chart=evt.target.getAttribute('data-ts');
	var nextdate=dates.indexOf(datesel)+1;
	if (nextdate>=dates.length)
		nextdate=dates.length;
	datesel[current_chart]=dates[nextdate];
	//datesel_asdate=convert_date(datesel);
	console.log ("date set to:",datesel[current_chart]);
	var chart=charts[current_chart];
	var timeserie=timeseries[current_chart];	
	chart.update_choropleth();
	timeserie.update_ts_sel();
	return false;
}

function movie_prev (evt) {
	var current_chart=evt.target.getAttribute('data-ts');	
	var nextdate=dates.indexOf(datesel)-1;
	if (nextdate<0)
		nextdate=0;	
	datesel[current_chart]=dates[nextdate];
	console.log ("date set to:",datesel[current_chart]);
	var chart=charts[current_chart];
	var timeserie=timeseries[current_chart];	
	chart.update_choropleth();
	timeserie.update_ts_sel();
	return false;
}

function movie_start (evt) {
	console.log("start player");
	dateindex=dates.indexOf(datesel);

	stop_player=false;
	setTimeout (movie_nextframe,200);
	return false;
}

function movie_nextframe(evt) {

	var current_chart=evt.target.getAttribute('data-ts');
	console.log('nextframe:',dateindex,stop_player);
	if (stop_player) return;
	dateindex+=1;
	if (dateindex>=dates.length){
		console.log('ended');
		stop_player=true;
		return;
	}
	datesel[current_chart]=dates[dateindex];

	var chart=charts[current_chart];
	var timeserie=timeseries[current_chart];	
	chart.update_choropleth();
	timeserie.update_ts_sel();
	setTimeout (movie_nextframe,10);		
	return false;	
}


function movie_pause (evt) {
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



function update_selection () {

	$('.selectie_header').removeClass('active');

	for (i=0; i<selected_charts.length;i++) {		
		chartname=selected_charts[i];
		console.log(chartname);
		$('#header_'+chartname).addClass('active');
		charts[chartname].update_choropleth();
		timeseries[chartname].update_ts();
		}
}


function set_selection (evt) {

	var extrachart=evt.target.getAttribute('data-selectie')
	console.log ('set_selection', extrachart);
	var i=	selected_charts.indexOf(extrachart)
	if (i<0) {
		selected_charts.push(extrachart);
	} else {
		selected_charts.splice(i, 1);
	}	
	console.log ('set_selection:', selected_charts);
	update_selection();	
}







function init_svg(){
	console.log('init_svg');


	$('.selectie_header').on('click',set_selection);
	

	init_colormap_sidebar_controls();
	//$('.outline').on('click',click_regio);

	$('#headertxt').html('<b>'+ label+ '</b>');

	$('#patch_1').remove();
	$('#patch_2').remove();
	$('#patch_3').remove();
    $('#patch_4').remove();
    $('#patch_5').remove();
    $('#patch_6').remove();


	var chart_a=new Chart('a',data[0][0],data[0][1],0);
	var chart_b=new Chart('b',data[0][0],data[0][1],0);
	var chart_c=new Chart('c',data[0][0],data[0][1],0);
	charts['a']=chart_a;
	charts['b']=chart_b;
	charts['c']=chart_c;

	timeseries['a']=new TimeSeries('a',data[0][0],data[0][1],0);
	timeseries['b']=new TimeSeries('b',data[0][0],data[0][1],0);
	timeseries['c']=new TimeSeries('c',data[0][0],data[0][1],0);	

// tab init
	cmode='tot';
    $('.tab').on('click',change_cmode);
    $('#tab_a').addClass('active_selectie');
    $('.tab').on('mouseenter ',enter_selectie);
	$('.tab').on('mouseout ',leave_selectie);

// selectie init
    if (('key' in var_types) && (country_labels.length>0))  {    	
		$('#keyentry').typeahead({source:country_labels,  valueKey: "Country"});
		$('#keyentry').on('change',update_key_selectie);
	} else {
		$('#keyentry').css('display','none');
		$('#keylabel').css('display','none');
	}

	setup_vars();		
	init_movie_ui();

	if (var_types.indexOf('date')>=0) {		// datum in data? verdergaan met initializatie. 
		console.log('prep');
		prep_data();		
		charts['a'].update_choropleth();
		charts['b'].update_choropleth();		
		charts['c'].update_choropleth();	
		timeseries['a'].update_ts ();
		timeseries['b'].update_ts ();
		timeseries['c'].update_ts ();		
	}	

	update_colormap_sidebar();	
	update_selection ();
}


$( document ).ready(init_svg);
