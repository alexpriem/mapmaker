var regio_ts={};
var regio_ts_min={};
var regio_ts_max={};
var datesel={};
var regiosel=0;
var varsel=varnames[2];


var chartnames=['a','b','c'];
var selected_charts=[chartnames[0]];   // bovenste regel, meerdere sel
var selected_chart=chartnames[0];    // onderste regel, enkele sel.

/* chart stuff */

var color=[];
var charts={};
var timeseries={};
var datatable;



/* timeseries stuff */

var ts_width=400;
var ts_height=200;
var ts_xpos=ts_width/2;  // label position
var ts_ypos=10;
var ts_sel_color={'a':'red','b':'blue','c':'black'};

var datamin;
var datamax;

var current_chart='a';
var cmode='regressie';
var cmode='diff';
var datestyle='YMD';

var display_datatable=false;  // datatable of chart


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




function update_cmode () {
	console.log('update_cmode:',cmode);
	$('.tab').removeClass('active_selectie');
	$('#tab_'+cmode).addClass('active_selectie');
	if ((cmode=='regressie') || (cmode=='diff')) {		
		console.log('update_cmode::set diff');
		charts['c'].colormap.colormapname='coolwarm';
		charts['c'].colormap.gradmax='max';
		charts['c'].colormap.gradmin='min';
	}
	console.log(charts['c']);
}

function change_cmode () {

	cmode=$(this).attr('data-tab');
	console.log('change_cmode:',cmode);
	update_cmode();	
//	update_cmode_settings();	
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
	var chart=charts[current_chart];
	var nextdate=dates[0];	
	console.log ("movie_begin, date set to:",datesel[current_chart]);
	
	chart.datesel=nextdate;
	console.log ("movie_next, date set to:",current_chart, nextdate);
	var timeserie=timeseries[current_chart];	
	timeserie.datesel=nextdate;
	chart.update_choropleth();
	timeserie.update_ts_sel();
	return false;
	return false;
}

function movie_last (evt) {
	var current_chart=evt.target.getAttribute('data-ts');
	var chart=charts[current_chart];
	var nextdate=dates[dates.length-2];	
	//datesel_asdate=convert_date(datesel);	
		
	chart.datesel=nextdate;
	console.log ("movie_next, date set to:",current_chart, nextdate);
	var timeserie=timeseries[current_chart];	
	timeserie.datesel=nextdate;
	chart.update_choropleth();
	timeserie.update_ts_sel();
	return false;
}

function movie_next (evt) {
	var current_chart=evt.target.getAttribute('data-ts');
	var chart=charts[current_chart];
	var datesel=chart.datesel;
	var nextdateindex=dates.indexOf(datesel)+1;	
	if (nextdateindex>=dates.length)
		nextdateindex=dates.length;

	var nextdate=dates[nextdateindex];	
	chart.datesel=nextdate;
	console.log ("movie_next, date set to:",current_chart, nextdate);
	var timeserie=timeseries[current_chart];	
	timeserie.datesel=nextdate;
	chart.update_choropleth();
	timeserie.update_ts_sel();

	return false;
}

function movie_prev (evt) {
	var current_chart=evt.target.getAttribute('data-ts');
	var chart=charts[current_chart];
	var datesel=chart.datesel;
	var nextdateindex=dates.indexOf(datesel)-1;
	if (nextdateindex<0)
		nextdateindex=0;			
	var nextdate=dates[nextdateindex];	

	chart.datesel=nextdate;
	console.log ("movie_next, date set to:",current_chart, nextdate);
	var timeserie=timeseries[current_chart];	
	timeserie.datesel=nextdate;
	chart.update_choropleth();
	timeserie.update_ts_sel();
	return false;
}

function movie_start (evt) {
	console.log("start player");
	dateindex=dates.indexOf(datesel);

	stop_player=false;
	setTimeout (movie_nextframe(),200);
	return false;
}

function movie_nextframe(evt) {

	var current_chart=evt.target.getAttribute('data-ts');
	var chart=charts[current_chart];
	console.log('nextframe:',dateindex,stop_player);
	if (stop_player) return;
	chart.dateindex+=1;
	if (chart.dateindex>=dates.length){
		console.log('ended');
		stop_player=true;
		return;
	}
	chart.datesel=dates[dateindex];
	
	var timeserie=timeseries[current_chart];
	timeserie.datesel=dates[dateindex];
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
	$('.m_begin').on('click',movie_begin);
	$('.m_prev').on('click',movie_prev);
	$('.m_start').on('click',movie_start);
	$('.m_pause').on('click',movie_pause);
	$('.m_next').on('click',movie_next);
	$('.m_last').on('click',movie_last);
}



function update_selection () {

	$('.selectie_header').removeClass('active');				
	$('#header_'+selected_chart).addClass('active');
	console.log('update_selection:',selected_chart);
//	charts[chartname].update_choropleth();
//	timeseries[chartname].update_ts();
}


function update_mselection () {

	$('.selectie_mheader').removeClass('active');

	console.log('update_mselection:',selected_charts);
	for (var i=0; i<selected_charts.length;i++) {		
		chartname=selected_charts[i];
		console.log('update_mselection:',chartname);
		$('#mheader_'+chartname).addClass('active');
		charts[chartname].update_choropleth();
		console.log('update_mselection2:',chartname);
		//timeseries[chartname].update_ts();
		}
	console.log('update_mselection:',selected_charts);		
}


function set_selection (evt) {

	selected_chart=evt.target.getAttribute('data-selectie')	
	console.log ('set_selection:', selected_chart);	
	update_selection();		
	update_colormap_sidebar();

	from_chart=charts[selected_chart];
	if (selected_charts.length>1) {
		for (var i=0; i<selected_charts.length; i++){
			var chart=charts[selected_charts[i]];	
			var colormap=chart.colormap;
			colormap.copy_settings (from_chart.colormap);		
			colormap.calculate_colormap();
			chart.forced_update=true;
			chart.update_choropleth();
		}
	} else {
			var chart=charts[selected_chart];	
			var colormap=chart.colormap;
			colormap.copy_settings (from_chart.colormap);		
			colormap.calculate_colormap();
			chart.forced_update=true;
			chart.update_choropleth();
	}
}

function set_mselection (evt) {

	var extrachart=evt.target.getAttribute('data-selectie')
	console.log ('set_mselection', extrachart);
	var i=selected_charts.indexOf(extrachart)
	if (i<0) {
		selected_charts.push(extrachart);
	} else {
		selected_charts.splice(i, 1);
	}	
	console.log ('set_mselection:', selected_charts);
	update_mselection();	
}


function update_regio_selectie () {

	regio=$('#regioentry').val();
	console.log('update_regio_selectie:',regio);
	regiokey=regio_key2label[regio.toLowerCase()];
	var timeserie=timeseries[selected_chart];
	timeserie.regiosel=regiokey;
	timeserie.update_ts();	
}


function update_date_selectie () {
	// FIXME: stub code
	var newdate=$('#dateentry').val();
	console.log('update_regio_selectie:',newdate);
	newdate=parseInt(newdate);
	var chart=charts[selected_chart];

	var year=Math.floor(newdate/10000);
	var month=Math.floor((newdate-year*10000)/100);
	var day=Math.floor(newdate-year*10000-month*100);
	console.log(year,month,day);
	// sanity checks doen op datum: geldig (try/catch), in bereik van dataset.
	newdate=new Date(year,month-1,day);
	console.log('update_regio_selectie:',chart.datesel, newdate);
	chart.datesel=newdate;
	chart.update_choropleth();	
}



function update_datatable_chart_visibility () {

if (!display_datatable) {
 	$('#chartbox_a').show();
 	$('#chartbox_b').show();
 	$('#chartbox_c').show();
 	$('#tabledata').hide();
} else {
	datatable.update_datatable();
 	$('#chartbox_a').hide();
 	$('#chartbox_b').hide();
 	$('#chartbox_c').hide();
 	$('#tabledata').show();	
 }

}

function show_charts () {

 console.log('show_chart:',show_datatable);
 display_datatable=false; 
 update_datatable_chart_visibility();
}


function show_datatable () {

 display_datatable=true;
 console.log('show_datatable:',show_datatable);
 update_datatable_chart_visibility();
}


function init_svg(){
	console.log('init_svg');


	$('.selectie_header').on('click',set_selection);
	$('.selectie_mheader').on('click',set_mselection);
	//$('.selectie_mheader').addClass('active');

	console.log ('added classes');
	init_colormap_sidebar_controls();
	//$('.outline').on('click',click_regio);

	$('#headertxt').html('<b>'+ label+ '</b>');

	$('#patch_1').remove();
	$('#patch_2').remove();
	$('#patch_3').remove();
    $('#patch_4').remove();
    $('#patch_5').remove();
    $('#patch_6').remove();


	var chart_a=new Chart('a',data[0][0], data[0][1], 0, 'hot2','log10', 0, 40, 'max' );
	var chart_b=new Chart('b',data[150][0], data[0][1], 0, 'hot2','log10', 0, 40, 'max' );
	var chart_c=new Chart('c',data[0][0], data[0][1], 0, 'hot2','log10', 'min', 40, 'max' );
	charts['a']=chart_a;
	charts['b']=chart_b;
	charts['c']=chart_c;

	timeseries['a']=new TimeSeries('a', data[0][0], data[0][1], 0);
	timeseries['b']=new TimeSeries('b', data[0][0], data[0][1], 0);
	timeseries['c']=new TimeSeries('c', data[0][0], data[0][1], 0);	

	datatable=new Datatable();

// tab init	
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


	$('#regioentry').typeahead({source:regio_labels,  valueKey: "Regio"});
	$('#regioentry').on('change',update_regio_selectie);
	$('#dateentry').on('change',update_date_selectie);
	setup_vars();		
	init_movie_ui();
	update_cmode();
	

	$('#tab_data').on('click',show_datatable);
	$('#tab_chart').on('click',show_charts);
	
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
	update_mselection ();
	update_datatable_chart_visibility();
}


$( document ).ready(init_svg);
