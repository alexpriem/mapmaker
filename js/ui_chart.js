


function Chart (chartname) {


	this.chartname=chartname;

	this.click_regio=function click_regio(evt) {

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




	this.update_choropleth=function () {

	var records, color, colorstring;

	var chartname=this.chartname;

	console.log('update_choropleth:',chartname);
	if (datesel[chartname]==null) {
		console.log("bailout, datesel=null");
		return;
	}

	var current_colormap=chart_colormap[chartname];
// voor entry: datesel bevat  huidige datumkeuze uit tab.

	var tgradmin=current_colormap.tgradmin;
	var tgradmin=current_colormap.tgradmin;
	if (current_colormap.gradmin=='max') {
		tgradmax=datamax;      // datamax is afhankelijk van keuze chart (a/b/c)
	} else {
		tgradmax=current_colormap.gradmax;
	}
	if (current_colormap.gradmin=='min') {
		tgradmax=datamin;      // datamin is afhankelijk van keuze chart
	} else {
		tgradmax=current_colormap.gradmax;
	}
	tgradmin=current_colormap.gradmin;
	current_colormap.draw_colormap(chartname); 

	tgradmin=current_colormap.color_transform(tgradmin);
	tgradmax=current_colormap.color_transform(tgradmax);
	var tdelta=tgradmax-tgradmin;
	current_colormap.tgradmin=tgradmin;
	current_colormap.tgradmax=tgradmax;
	current_colormap.tdelta=tdelta;

	console.log("update_choropleth:",tgradmin, tgradmax, tdelta)

	console.log("day/regio/var",datesel,regiosel,varsel, varidx);
	records=data.length;	

	regioidx=1;
	dateidx=0;
	prev_regiocolors=prev_chartcolors[chartname];


	if (chartname=='c') {
		dataslice=prepare_c_chart();
		start_row=0;
		eind_row=total_regio.length;
	} else { 
		dataslice=data;
		selected_date=datesel[chartname];
		start_row=date_index[selected_date].start_row;
		eind_row=date_index[selected_date].eind_row;	
	}
	

	console.log("start:end",start_row, eind_row);
	new_regiocolors={};
	for (i=0; i<regio_keys.length; i++) {
		new_regiocolors[regio_keys[i]]=0;
	}
	
	row=dataslice[start_row];
	chart_min=row[varidx];  // chart minimum/maximum init.
	chart_max=row[varidx];
	for (rownr=start_row; rownr<eind_row; rownr++){	
		row=dataslice[rownr];	

		if ((row[0]-selected_date)!=0) {
			if (!((chartname=='c') && (cmode!='totsel')))  {
				console.log("error-update choropleth", row[0],selected_date, start_row, eind_row);
			}
		}
		var regio=row[regioidx];			
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
			val=current_colormap.color_transform(val);		
			
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

	
	if (chartname=='c') { 
		if (cmode=='tot') {
			datelabel='Totaal';
		}
		if (cmode=='totsel') {
			datelabel='Totaal';
		}
		if (cmode=='diff') {
			datelabel='Verschil';
		}
		if (cmode=='reg') {
			datelabel='Regressie';
		}
	} else {
		var d=selected_date;	
		datelabel=d.getDate()+' '+MonthName[d.getMonth()]+' '+d.getFullYear();
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
   
}



	/* initializatie chart */ 


	if (chartname=='a') {
		$('#axes_1').on('click',this.click_regio);	
		window.document.title=label;

		var chartdiv=document.getElementById('chartbox1');
		var chart1=chartdiv.children[0];
		chart1.setAttribute("id","chart_a");	
		chart1.removeAttribute("viewBox");	

		w=chart1.getAttributeNS(null,'width');
		chart_width=parseInt(w.slice(0,w.length-2));
		chart1.setAttributeNS(null,'width',(chart_width-50)+'pt');
		chart1.setAttributeNS(null,'padding',-50+'px');
		h=chart1.getAttributeNS(null,'height');
		chart_height=h.slice(0,h.length-2);
	}

	
	if (chartname=='b') {
		var chartdiv=document.getElementById('chartbox1');
		var chart1=chartdiv.children[0];
		var chart2 = chart1.cloneNode(true);
		chart2.setAttribute("id","chart_b");
		$('#chartbox2').append(chart2);

	//	chart2=document.getElementById('chart2');	
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
		groupnode=axisnode.firstElementChild;
		while (groupnode) {
			var pathnode=groupnode.firstElementChild;
			var pathid=pathnode.getAttribute('id');
			if (pathid!=null) {
				pathnode.setAttribute('id','b'+pathid.slice(1));
			}
			groupnode = groupnode.nextElementSibling;
		}


		$('#axes_2').on('click',this.click_regio);
	//console.log(fignode.childNodes);
	}

	
	if (chartname=='c') {
		var chartdiv=document.getElementById('chartbox1');
		var chart1=chartdiv.children[0];
		var chart3 = chart1.cloneNode(true);
		chart3.setAttribute("id","chart_c");
		$('#chartbox3').append(chart3);
		var subnodes=chart3.childNodes;
		/* this should not fail, 'figure_1' is always in the svg */	

		el=chart3.firstElementChild;
		while (el) {    	
			if (el.getAttribute('id')=='figure_1') {
					var fignode=el;
					break;
				}
	    	el = el.nextElementSibling;
	  	}

		fignode.setAttribute('id','figure_3');
		axisnode=fignode.firstElementChild;
		axisnode.setAttribute('id','axes_3');
		groupnode=axisnode.firstElementChild;
		while (groupnode) {
			var pathnode=groupnode.firstElementChild;
			var pathid=pathnode.getAttribute('id');
			if (pathid!=null) {
				pathnode.setAttribute('id','c'+pathid.slice(1));
			}
			groupnode = groupnode.nextElementSibling;
		}
		$('#axes_3').on('click',this.click_regio);
	}

	

	prev_regiocolors={};
	for (j=regio_keys.length; j--;) {		
		prev_regiocolors[regio_keys[chartname]]=0;
	}
	prev_chartcolors[chartname]=prev_regiocolors;	
}  // function  Chart()

