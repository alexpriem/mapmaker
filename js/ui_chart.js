
//depends on colormap.js for colormap

var chart_xpos=100;  // label position
var chart_ypos=50;
var chart_width=0;
var chart_height=0;


function dateformat (d, format) {
	if (format=='YMD') {
			var s=d.getDate()+' '+MonthName[d.getMonth()]+' '+d.getFullYear();
		}
	if (format=='YM') {
		var s=MonthName[d.getMonth()]+' '+d.getFullYear();
	}

	return s;
}


// should include function to other charts (a/b/c)

function Chart (chartname, default_datesel, default_regiosel, default_varsel, 
							default_colormapname, default_transform, 
							default_gradmin, default_gradsteps, default_gradmax) {

	this.chartname=chartname;	
	this.datesel=default_datesel;
	this.regiosel=default_regiosel;
	this.varsel=default_varsel;   	
 	this.prev_chartcolors={};   



	this.click_regio=function (evt) {


		var clicked_regio=evt.target.getAttribute('data-regio');

		if (clicked_regio==null) return false; //buiten kaart geklikt.
		this.regiosel=clicked_regio;

		var clicked_id=evt.target.getAttribute('id');	// regio's hebben formaat 'a361_1' -chartnummer,regio,_,shapenr_voor_regio
		var chartname=clicked_id.slice(0,1);

		// TESTME -- handling multiple selections.
		//selected_charts=[chartname];
		
		regiolabel=regio_label2key[clicked_regio];
		console.log('click_regio:',clicked_regio, regiolabel, chartname);		
	//	$('#label_'+chartname).text(regiolabel);
		$('#svg_ts'+chartname).remove();		
		var timeserie=timeseries[chartname];
		timeserie.regiosel=clicked_regio;
		timeserie.update_ts();
		if (cmode=='diff') {					// bij verschil ook timeseries C bijwerken.
			timeseries['c'].update_ts();
		}
		return false;
		}




	this.prepare_c_chart=function () {

		console.log('prepare_c_chart:');
		chartc_min=null;	/* global for the moment */
		chartc_max=null;

		if (cmode=='diff') {
			console.log('prepare_c_chart:diff');
			var dataslice=[];
			// join 2 date-slices in js;   waardes van regio's aftrekken voor datum a en b 

			var data_a=charts['a'].chart_data;
			var data_b=charts['b'].chart_data;
			start_row_a=0;
			start_row_b=0;
			eind_row_a=data_a.length;
			eind_row_b=data_b.length;
			rownr_a=start_row_a;
			rownr_b=start_row_b;
			console.log('[a1,a2],[b1,b2]', start_row_a,eind_row_a, start_row_b, eind_row_b);
			while ((rownr_a < eind_row_a) && (rownr_b< eind_row_b)) {
				//console.log(rownr_a, ':',rownr_b,'==',data[rownr_a][regioidx], ':',data[rownr_b][regioidx]);
				//console.log(regio, data_a[row_a][regioidx], data_b[row_b][regioidx], data_c[row_c][regioidx], ':::',row_a,row_b, row_c);
				
				if (data_a[rownr_a][regioidx]<data_b[rownr_b][regioidx]) {
					val= data_a[rownr_a][varidx];
					row=[0, data_a[rownr_a][regioidx],val];
					rownr_a++;
				} else if (data_a[rownr_a][regioidx]>data_b[rownr_b][regioidx]) {
					val= data_b[rownr_b][varidx];
					row=[0, data_b[rownr_b][regioidx], -val];
					rownr_b++;
				} else if (data_a[rownr_a][regioidx]==data_b[rownr_b][regioidx]) {
					val= data_a[rownr_a][varidx]-data_b[rownr_b][varidx];
					row=[0, data_b[rownr_b][regioidx], val];
					rownr_a++;
					rownr_b++;
				}
			//	console.log(data[rownr_a][regioidx], ':',data[rownr_b][regioidx],'==',row);
				if ((chartc_min==null) || (val<chartc_min)) {chartc_min=val;}
				if ((chartc_max==null) || (val>chartc_max)) {chartc_max=val;}
				dataslice.push(row);						
			}  // while  
			// 'uitstekende data' toevoegen.
			while (rownr_a< eind_row_a) {
				val= data_a[rownr_a][varidx];
				row=[0, data_a[rownr_a][regioidx], val];
				rownr_a++;
				if ((chartc_min==null) || (val<chartc_min)) {chartc_min=val;}
				if ((chartc_max==null) || (val>chartc_max)) {chartc_max=val;}
				dataslice.push(row);
			}
			while (rownr_b< eind_row_b) {
				val= data_b[rownr_b][varidx];
				row=[0, data_b[rownr_b][regioidx], -val];
				rownr_b++;
				if ((chartc_min==null) || (val<chartc_min)) {chartc_min=val;}
				if ((chartc_max==null) || (val>chartc_max)) {chartc_max=val;}
				dataslice.push(row);
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
		if (cmode=='regressie') {
			console.log('prepare_c_chart:regressie');
			var origdata=[];
			// join 2 date-slices in js;   waardes van regio's aftrekken voor datum a en b 
			chartc_min=null;	/* global for the moment */
			chartc_max=null;

			var data_a=charts['a'].chart_data;
			var data_b=charts['b'].chart_data;
			start_row_a=0;
			start_row_b=0;
			eind_row_a=data_a.length;
			eind_row_b=data_b.length;
			rownr_a=start_row_a;
			rownr_b=start_row_b;
			console.log('[a1,a2],[b1,b2]', start_row_a,eind_row_a, start_row_b, eind_row_b);
			while ((rownr_a < eind_row_a) && (rownr_b< eind_row_b)) {
				//console.log(rownr_a, ':',rownr_b,'==',data[rownr_a][regioidx], ':',data[rownr_b][regioidx]);
				//console.log(regio, data_a[row_a][regioidx], data_b[row_b][regioidx], data_c[row_c][regioidx], ':::',row_a,row_b, row_c);
				
				if (data_a[rownr_a][regioidx]<data_b[rownr_b][regioidx]) {
					rownr_a++;
				} else if (data_a[rownr_a][regioidx]>data_b[rownr_b][regioidx]) {
					rownr_b++;
				} else if (data_a[rownr_a][regioidx]==data_b[rownr_b][regioidx]) {
					val_a= data_a[rownr_a][varidx];
					val_b= data_b[rownr_b][varidx];
					row=[data_a[rownr_a][regioidx], val_a, val_b];
					rownr_a++;
					rownr_b++;
					origdata.push(row);
				}										
			}  // while  
			this.origdata=origdata;
			results=linear_regression(origdata); //returns a,b, r2
			this.regressie_info=results;			
			dataslice=results.residuals;

			for (i=0; i<dataslice.length; i++) { 
				val=dataslice[i][2];
				if ((chartc_min==null) || (val<chartc_min)) {chartc_min=val;}
				if ((chartc_max==null) || (val>chartc_max)) {chartc_max=val;}
			}		

		this.chart_min=chartc_min;
		this.chart_max=chartc_max;
		}   // regressie

		this.chart_data=dataslice;
		console.log ('prepare_c_chart:',cmode, dataslice);		
	}







/* zet waarde van shape, reken waarde eerst om naar kleur */

	this.set_shape_color_by_value=function  (regio, val) {

	var chartname=this.chartname;	
	var colormap=this.colormap;

	var tgradmin=colormap.tgradmin;
	var tdelta=colormap.tdelta;
	var gradsteps=colormap.gradsteps;
//	console.log('set_shape_color_by_value:',chartname,regio,val);
	colorindex=~~((val-tgradmin)/(tdelta)*gradsteps);  					
	if (colorindex<0) colorindex=0;
	if (colorindex>=gradsteps) colorindex=gradsteps-1;			
	colorindex=parseInt(colorindex);

//	console.log('set_shape_color_by_value:', val, colorindex, tgradmin, tdelta);
	color=colormap.colormap_data[colorindex];					
	colorstring ="rgb("+color[0]+","+color[1]+","+color[2]+")";
		//console.log('#r'+key+'_1',s);
		//console.log('set_shape_color_by_value:',regio,colorstring)
	el_ids=shape_ids[regio];			
	/* // extra debugging
	if (chartname=='c') {
		console.log('set_shape_color_by_value:',regio, val, colorindex, colorstring);
	}
	*/
	if (typeof(el_ids)!="undefined") {
		for (i=0; i<el_ids.length; i++) {
			el_id='#'+chartname+el_ids[i];						
			$(el_id).css('fill',colorstring).css('color',colorstring);
			}		// for  
		} else {
			console.log("undefined regio:", regio);
	} 													
}



	this.update_chart_data= function () {

		console.log('update_chart_data:',this.datesel);

		selected_date=this.datesel;
		var chart_data=[];		
		var start_row=date_index[selected_date].start_row;
		var eind_row=date_index[selected_date].eind_row;
		var row=data[start_row];
		var chart_min=row[varidx];  // chart minimum/maximum init.
		var chart_max=row[varidx];				
		
		for (rownr=start_row; rownr<eind_row; rownr++){				
			row=data[rownr];						
			chart_data.push(row)				
			if ((row[0]-selected_date)!=0) {
				if (!((chartname=='c') && (cmode!='totsel')))  {
					console.log("error-update choropleth", row[0],selected_date, start_row, eind_row);
				}
			}
			val=row[varidx];			
			if (val<chart_min) { 
				chart_min=val;
			}
			if (val>chart_max) {
				chart_max=val;
			}			
		} /* for records */
		this.chart_data=chart_data;		
		this.chart_min=chart_min;
		this.chart_max=chart_max;
	}




	this.update_choropleth=function () {

		var records, color, colorstring;
		var chartname=this.chartname;
		var datesel=this.datesel;
		var varsel=this.varsel;


		console.log('update_choropleth:',chartname);
		if (this.datesel==null) {
			console.log("bailout, datesel=null");
			return;
		}

		var colormap=this.colormap;
	// voor entry: datesel bevat  huidige datumkeuze uit tab.


		if (chartname=='c') {
			this.prepare_c_chart();
		} else {
			this.update_chart_data();
		}
		var gradient_max=colormap.gradmax;
		if (colormap.gradmax=='max') {
			gradient_max=this.chart_max;      // datamax is afhankelijk van keuze chart (a/b/c)
		} 
		if (colormap.gradmax=='dmax') {
			gradient_max=datamax;      // over hele dataset
		}
		if (colormap.gradmax=='tmax') {
			gradient_max=timeseries[chartname].chart_max;      // over geselecteerde tijdreeks.
		}

		var gradient_min=colormap.gradmin;
		if (colormap.gradmin=='min') {
			gradient_min=this.chart_min;
		} 		
		if (colormap.gradmin=='dmin') {
			gradient_min=datamin;      // over hele dataset
		}
		if (colormap.gradmax=='tmin') {
			gradient_max=timeseries[chartname].chart_min;      // over geselecteerde tijdreeks.
		}


		colormap.gradient_min=gradient_min;
		colormap.gradient_max=gradient_max;
		
		colormap.tgradmin=colormap.color_transform(gradient_min);
		colormap.tgradmax=colormap.color_transform(gradient_max);		
		colormap.tdelta=colormap.tgradmax-colormap.tgradmin;

		colormap.calculate_colormap();
		colormap.draw_colormap(chartname); 


		console.log("update_choropleth:",colormap.tgradmin, colormap.tgradmax,colormap.tdelta);
		console.log("day/regio/var",this.datesel,this.regiosel,varsel, varidx);
		records=data.length;	
		regioidx=1;			// FIXME 
		dateidx=0;


		prev_regiocolors=this.prev_chartcolors;		
		new_regiocolors={};
		for (i=0; i<regio_keys.length; i++) {
			new_regiocolors[regio_keys[i]]=0;
		}

			// daadwerkelijk inkleuren van kaart begint hier.

		var forced_update=this.forced_update;		
		for (rownr=0; rownr<this.chart_data.length; rownr++){	
			row=this.chart_data[rownr];				
			var regio=row[regioidx];			
			val=row[varidx];
				
			//console.log(regio, val);				
			prev_val=prev_regiocolors[regio];   // kleur zetten als 
			                                    // nieuwe waarde ongelijk vorige waarde
			new_regiocolors[regio]=val; 
			if ((forced_update) || (val!=prev_val)) {

				//if (chartname=='c') { console.log('regio,p,v',regio,prev_val,val);}
				val=colormap.color_transform(val);		
				this.set_shape_color_by_value (regio,val);
			}
		} /* for records */

		for (var regiokey in prev_regiocolors) {
				prev_val=prev_regiocolors[regiokey];
				val=new_regiocolors[regiokey];
				//console.log("Prev_regio",regiokey,prev_val,val);
				//if ((typeof(val)=='undefined') || (val==0)) {
				if ((typeof(val)=='undefined') || ((val==0) && (prev_val!=0))) {
					//console.log("Prev_regio:",regiokey,prev_val,val);
					//console.log('undefined/0, dus wissen:',regiokey, val,prev_val)
					this.set_shape_color_by_value (regiokey, 0);
				}
			}			
		this.prev_chartcolors=new_regiocolors;

		
		if (chartname=='c') { 
			if (cmode=='tot') {
				datelabel='Totaal (periode)';
			}
			if (cmode=='totsel') {
				datelabel='Totaal sel (periode)';
			}
			if (cmode=='diff') {
				label_a=dateformat(charts['a'].datesel, datestyle);
				label_b=dateformat(charts['b'].datesel, datestyle);
				datelabel='Verschil: ' + label_a + '-' + label_b;
			}
			if (cmode=='reg') {
				label_a=dateformat(charts['a'].datesel, datestyle);
				label_b=dateformat(charts['b'].datesel, datestyle);
				datelabel='Regressie' + label_a + 'vs' + label_b;
			}
		} else {			
			var datelabel=dateformat(selected_date, datestyle);
		}


		$('#chartlabel_'+chartname).remove();	
		chart=d3.select("#chart_"+chartname);

		console.log('update_choropleth,label:',chartname,chart);
		chart.append("text")      // text label for the x axis
			.attr("id","chartlabel_"+chartname)
	  		.attr("class","label")
	        .attr("x", chart_xpos )
	        .attr("y", chart_ypos )
	        .style("text-anchor", "middle")
	        .attr("font-family", "sans-serif")
	  		.attr("font-size", "16px")
	  		.attr("font-weight", "bold")
	        .text(datelabel);
   		this.forced_update=false;  // want net update gedaan.
	}  // update_chart



	window.document.title=label;
	/* initializatie chart */ 

	
	if (chartname=='a') {
		$('#figure_1').on('click',this.click_regio);	

		var chart1=document.getElementById('chart_1');
		chart1.setAttribute("id","chart_a");
		var chart1=document.getElementById('figure_1');

		w=chart1.getAttributeNS(null,'width');
		chart_width=parseInt(w.slice(0,w.length-2));
		//chart1.setAttributeNS(null,'width',chart_width+'pt');
		//chart1.setAttributeNS(null,'padding',-50+'px');
		h=chart1.getAttributeNS(null,'height');
		chart_height=h.slice(0,h.length-2);
	}


	if (chartname=='b') {
		var chart1=document.getElementById('figure_1');		
		var chart2 = chart1.cloneNode(true);
		chart2.setAttribute("id","figure_2");

		var chart=chart2.getElementById('chart_a');
		chart.setAttribute("id","chart_b");		

		
		pathnode=chart.firstElementChild;
		while (pathnode) {			
			var pathid=pathnode.getAttribute('id');
			if (pathid!=null) {
				pathnode.setAttribute('id','b'+pathid.slice(1));
			}
			pathnode = pathnode.nextElementSibling;
		}
		$('#chartbox_b').append(chart2);

		$('#figure_2').on('click',this.click_regio);
//console.log(fignode.childNodes);
	}


	if (chartname=='c') {
		var chart1=document.getElementById('figure_1');		
		var chart3 = chart1.cloneNode(true);
		chart3.setAttribute("id","figure_3");

		var chart=chart3.getElementById('chart_a');
		chart.setAttribute("id","chart_c");		

		
		pathnode=chart.firstElementChild;
		while (pathnode) {			
			var pathid=pathnode.getAttribute('id');
			if (pathid!=null) {
				pathnode.setAttribute('id','c'+pathid.slice(1));
			}
			pathnode = pathnode.nextElementSibling;
		}
		$('#chartbox_c').append(chart3);

		$('#figure_3').on('click',this.click_regio);

	}
	
	
	this.colormap=new Colormap(chartname, default_colormapname, default_transform, default_gradmin, default_gradsteps, default_gradmax);
	prev_regiocolors={};
	for (j=regio_keys.length; j--;) {		
		prev_regiocolors[regio_keys[chartname]]=0;
	}
	this.prev_chartcolors=prev_regiocolors;	
}  // function  Chart()

