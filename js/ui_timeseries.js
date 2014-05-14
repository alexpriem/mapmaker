
function TimeSeries(chartname,default_datesel, default_regiosel, default_varsel) {

	this.chartname=chartname;
	this.use_regiomin=true;
	this.datesel=default_datesel;
	this.regiosel=default_regiosel;
	this.varsel=default_varsel;





	this.click_ts=function () {

		console.log('click_ts:',this.id);	
		chartname=this.id.slice(this.id.length-1);
		var timeserie=timeseries[chartname];		
		xpos=d3.mouse(this)[0];
		
		var currentdate=timeserie.xScale.invert(xpos);			
		console.log('click_ts:',chartname, xpos, currentdate);

	// d3 calculates dates according to exact position, so we have to lookup the nearest date in our data. 
	// Faster but trickier solution would be to use rounding. This is guaranteed to work, but slower.

		var datesel=data[0][0];
		mindiff=Math.abs(currentdate-datesel);
		for (var d in date_index) {
	  		if (date_index.hasOwnProperty(d)) {
	  			var d2=new Date(d);
	  			//console.log('datediff:',  Math.abs(datesel-d2), mindiff, mind);
	  			if (Math.abs(currentdate-d2)<mindiff) {
	  				mindiff=Math.abs(currentdate-d2);
	  				datesel=d2;
	  			}
	  		}
	  	}

		
		//datesel=10000*newdate.getFullYear()+100*(newdate.getMonth()+1)+newdate.getDate();			

		var chart=charts[chartname];
	  	chart.datesel=datesel;  	
	  	timeserie.datesel=datesel;	  	
		chart.update_choropleth();
		if ((chartname!='c') && (cmode!='tot')) charts['c'].update_choropleth();  // verschil updaten				
		timeserie.update_ts_sel();
		if (display_datatable) {
			datatable.update_datatable();
		}
		
		return false;
	}






	this.update_ts_sel=function  () {
		var chartname=this.chartname;

		console.log('update_ts_sel:',chartname,this.datesel);
		$('#ts_line_'+chartname).remove();
		var selected_date=this.datesel;		
		if (selected_date!=null) {		
				console.log('update_ts_sel:',this);
				this.canvas.append("line")
	  				.attr("id","ts_line_"+chartname)
	  				.attr("x1",this.xScale(selected_date))
	  				.attr("x2",this.xScale(selected_date))
	  				.attr("y1",this.yScale(this.miny))
	  				.attr("y2",this.yScale(this.maxy))
	  				.attr("stroke-width", 1)
	  				.attr("stroke", ts_sel_color[chartname]);	  		
	  	}
	}

	this.prepare_c_timeseries=function () {

		console.log ('prepare_c_timeseries:',cmode)
		var regioreeks=null;

		if (cmode=='tot') {
			var regioreeks=total_date;
			this.ts_label='Totaal (regios)';
		}
		if (cmode=='totsel') {
			var regioreeks=total_date;
			this.ts_label='Totaal '+ts_label;
		}
		if (cmode=='diff') {
			console.log('prepare_c_timeseries:diff');
			var origdata=[];
			// join 2 date-slices in js;   waardes van regio's aftrekken voor datum a en b 

			var xdata_a=timeseries['a'].xdata;
			var xdata_b=timeseries['b'].xdata;
			var ydata_a=timeseries['a'].ydata;
			var ydata_b=timeseries['b'].ydata;
			var xdata_c=[];
			var ydata_c=[];			
			start_row_a=0;
			start_row_b=0;
			eind_row_a=xdata_a.length;
			eind_row_b=xdata_b.length;
			rownr_a=start_row_a;
			rownr_b=start_row_b;
			console.log('[a1,a2],[b1,b2]', start_row_a,eind_row_a, start_row_b, eind_row_b);
			while ((rownr_a < eind_row_a) && (rownr_b< eind_row_b)) {
				//console.log(rownr_a, ':',rownr_b,'==',data[rownr_a][regioidx], ':',data[rownr_b][regioidx]);
				//console.log(regio, data_a[row_a][regioidx], data_b[row_b][regioidx], data_c[row_c][regioidx], ':::',row_a,row_b, row_c);
				//console.log(rownr_a, rownr_b, xdata_a[rownr_a]-xdata_b[rownr_b]);
				if ((xdata_a[rownr_a] - xdata_b[rownr_b])<0) {
					rownr_a++;
				} else if ((xdata_a[rownr_a] - xdata_b[rownr_b] )>0) {
					rownr_b++;
				} else if ((xdata_a[rownr_a] - xdata_b[rownr_b])==0) {					
					val_a= ydata_a[rownr_a];
					val_b= ydata_b[rownr_b];
					
					rownr_a++;
					rownr_b++;
					xdata_c.push(xdata_a[rownr_a]);
					ydata_c.push(ydata_a[rownr_a] - ydata_b[rownr_b] );
				}								
			}  // while  			
			label_a=regio_label2key[timeseries['a'].regiosel];
			label_b=regio_label2key[timeseries['b'].regiosel];
			this.ts_label='Verschil '+label_a+'-'+ label_b;
		}
		if (cmode=='reg') {
			var regioreeks=total_date;
			this.ts_label='Regressie';
		}

		if (regioreeks!=null) {
			var xdata_c=[];
			var ydata_c=[];
			for (i=0; i<regioreeks.length; i++) xdata_c.push(regioreeks[i][0]);  
			for (i=0; i<regioreeks.length; i++) ydata_c.push(regioreeks[i][1]);  
		}
		this.xdata=xdata_c;	
		this.ydata=ydata_c;	
		
	}


	this.update_ts=function  () {

		var chartname=this.chartname;
		var regiosel=this.regiosel;
		var varsel=this.varsel;
		console.log('update_ts:', chartname, regiosel, varsel);


		// data zelf klaar zetten in xdata, ydata,
		// kopie in this.xdata/this.ydata
		if (chartname=='c') {
			this.prepare_c_timeseries();
			xdata=this.xdata;
			ydata=this.ydata;
		} else {
			if (!(regiosel in regio_ts)) {				// a of b timeseries
				console.log("bailout, no regiodata");
				return;
			}
			regioreeks=regio_ts[regiosel];
			this.ts_label=regio_label2key[regiosel];
			xdata=[];
			ydata=[];
			for (i=0; i<regioreeks.length; i++) xdata.push(regioreeks[i][0]);  
			for (i=0; i<regioreeks.length; i++) ydata.push(regioreeks[i][1]);  
			this.xdata=xdata;
			this.ydata=ydata;
		}
		
		// grafiek zelf plotten

		var svg_ts='#svg_ts'+chartname;
		$(svg_ts).remove();
		$('#ts_line_'+chartname).remove();
		var cv=this.canvas = d3.select("#ts_"+chartname)
		    		.append("svg")
		    		.attr('xmlns',"http://www.w3.org/2000/svg")
		    		.attr('id','svg_ts'+chartname)            
		            .attr("width", ts_width)
		            .attr("height", ts_height);            
			

		var xScale=this.xScale=d3.time.scale();
		var yScale=this.yScale=d3.scale.linear();

		if (chartname=='c') {
			if (cmode=='diff') {
				miny=ydata[0];
				maxy=ydata[0];
				for (i=0; i<ydata.length; i++){
					val=ydata[i];
					if (val<miny) miny=val;
					if (val>maxy) maxy=val;
				}
			} else {
			var miny=total_date_min;
			var maxy=total_date_max;
		}
		} else {                   /* a/b deel */
			if (this.use_regiomin) {
				var miny=regio_ts_min[regiosel];  /* fixme: uitsplitsen naar a/b */
				var maxy=regio_ts_max[regiosel];
			} else {
	    		var miny=minval;			/* fixme: uitsplitsen naar a/b */
	    		var maxy=maxval;
	    	}
	    }
	    this.miny=miny;
	    this.maxy=maxy;

	    console.log('update_ts:miny,maxy',chartname, miny,maxy)

	    xScale.domain([mindate,maxdate]);   // time in ms
		xScale.range([50,ts_width]); 

	    yScale.domain([maxy,miny]);	
		yScale.range([50,ts_height-50]); 
		var line = d3.svg.line();

		var xAxis=this.xAxis=d3.svg.axis();		
	    xAxis.scale(xScale)
	    	.orient("bottom");

		var yAxis=this.yAxis=d3.svg.axis();		
	    yAxis.scale(yScale)
	    	.orient("left")   
	    	.ticks(5)
	    	.tickFormat(function(d) {
	    			if ((d/1000)>=1) { d=d/1000+"k"; }
	    			return d;
				});

		var xGrid=this.xGrid=d3.svg.axis();
			
	    xGrid.scale(xScale)
	    	.orient("bottom")
	    	.tickSize(-0.5*ts_height,0,0)
	    	.tickFormat(function(d) {
	    			return "";

				});
	    		
	 	var yGrid=this.xGrid=d3.svg.axis();
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
			.y(function(d,i)  {  /*console.log(d,i, yScale(d));*/ return yScale(d); }); 

			

			//console.log('C:regioreeks',chartname, regioreeks)
			

//				console.log(ydata);

			console.log('daydata:',regioreeks[1]);
			for (i=1; i<regioreeks.length; i++) {    		
				cv.append("svg:path")
					//.attr("id","l_"+day+"_"+month)
					.attr("class","dayl")
					.attr("d", line(ydata));
						
			}


		 	d3.select(svg_ts).on('click', this.click_ts);
		 	$('#ts_label_'+chartname).remove();

		 	console.log('labelpos:',ts_xpos, ts_ypos);
			cv.append("text")      // text label for the x axis
				.attr("id","ts_label_"+chartname)
		  		.attr("class","label")
		        .attr("x", ts_xpos )
		        .attr("y", ts_ypos )
		        .style("text-anchor", "middle")
		        .attr("font-family", "sans-serif")
		  		.attr("font-size", "16px")
		  		.attr("font-weight", "bold")
		        .text(this.ts_label);

		  this.update_ts_sel();
		}


	// initializatie timeseries		

}  // Timeseries