
function TimeSeries(chartname) {
	this.chartname=chartname;
	this.use_regiomin=true;

	this.click_ts=function () {

		console.log('click_ts:',this.id);	
		chartname=this.id.slice(this.id.length-1);
		var timeserie=timeseries[chartname];		
		xpos=d3.mouse(this)[0];
		
		var currentdate=timeserie.xScale.invert(xpos);			
		console.log('click_ts:',chartname, xpos, currentdate);

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
	  	datesel[chartname]=mind;  	
		
		//datesel=10000*newdate.getFullYear()+100*(newdate.getMonth()+1)+newdate.getDate();	
		console.log(datesel);
		var chart=charts[chartname];		
		chart.update_choropleth();
		if ((chartname!='c') && (cmode!='tot')) charts['c'].update_choropleth();  // verschil updaten
		timeserie.update_ts_sel();
		return false;
	}






	this.update_ts_sel=function  () {
		var chartname=this.chartname;

		$('#ts_line_'+chartname).remove();
		var selected_date=datesel[chartname];
		if (selected_date!=null) {			
				this.canvas.append("line")
	  				.attr("id","ts_line_"+chartname)
	  				.attr("x1",this.xScale(selected_date))
	  				.attr("x2",this.xScale(selected_date))
	  				.attr("y1",this.yScale(miny))
	  				.attr("y2",this.yScale(maxy))
	  				.attr("stroke-width", 1)
	  				.attr("stroke", ts_sel_color[chartname]);	  		
	  	}
	}


	this.update_ts=function  () {

		var chartname=this.chartname;

		console.log('update_ts:', chartname, regiosel, varsel);
		
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
		console.log()

		if (chartname=='c') {
			miny=total_date_min;
			maxy=total_date_max;
		} else {                   /* a/b deel */
			if (this.use_regiomin) {
				miny=regio_ts_min[regiosel];  /* fixme: uitsplitsen naar a/b */
				maxy=regio_ts_max[regiosel];
			} else {
	    		miny=minval;			/* fixme: uitsplitsen naar a/b */
	    		maxy=maxval;
	    	}
	    }

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
		//	.interpolate("monotone") 
			.x(function(d,i)  { return xScale(xdata[i]); })
			.y(function(d,i)  {  /*console.log(d,i, yScale(d));*/ return yScale(d); }); 

			
			xdata=[];
			ydata=[];
			console.log(chartname,cmode);
			if (chartname=='c') {
				if (cmode=='tot') {
					regioreeks=total_date;
					ts_label='Totaal';
				}
				if (cmode=='totsel') {
					regioreeks=total_date;
					ts_label='Totaal'+ts_label;
				}
				if (cmode=='diff') {
					regioreeks=total_date;
					ts_label='Verschil';
				}
				if (cmode=='reg') {
					regioreeks=total_date;
					ts_label='Regressie';
				}
			} else {
				if (!(regiosel in regio_ts)) {				// a of b timeseries
					console.log("bailout, no regiodata");
					return;
				}
				regioreeks=regio_ts[regiosel];
				var ts_label=regio_label2key[regiosel];
			}

			//console.log('C:regioreeks',chartname, regioreeks)
			for (i=0; i<regioreeks.length; i++) xdata.push(regioreeks[i][0]);  
			for (i=0; i<regioreeks.length; i++) ydata.push(regioreeks[i][1]);  

				console.log(ydata);

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
		        .text(ts_label);

		  this.update_ts_sel();
		}

}  // Timeseries