
function click_ts () {
	
	console.log('click_ts:',this.id);
	current_ts=this.id.slice(this.id.length-1);
	xpos=d3.mouse(this)[0];
	
	var currentdate=xScale[current_ts].invert(xpos);			
	console.log('click_ts:',current_ts, xpos, currentdate);


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
	console.log(datesel);
	update_choropleth(current_ts);
	if ((current_ts!='c') && (cmode!='tot')) update_choropleth('c');  // verschil updaten
	update_ts_sel(current_ts);
	return false;
}




function update_ts_sel (current_ts) {
	$('#ts_line_'+current_ts).remove();
	var selected_date=datesel[current_ts];
	if (selected_date!=null) {
		if (current_ts in canvas) {
			canvas[current_ts].append("line")
  				.attr("id","ts_line_"+current_ts)
  				.attr("x1",xScale[current_ts](selected_date))
  				.attr("x2",xScale[current_ts](selected_date))
  				.attr("y1",yScale[current_ts](miny))
  				.attr("y2",yScale[current_ts](maxy))
  				.attr("stroke-width", 1)
  				.attr("stroke", ts_sel_color[current_ts]);
  		}
  	}
}





function update_ts (current_ts) {


 var svg_ts='#svg_ts'+current_ts;
 $(svg_ts).remove();
 $('#ts_line_'+current_ts).remove();
 cv=canvas[current_ts] = d3.select("#ts_"+current_ts)
    		.append("svg")
    		.attr('xmlns',"http://www.w3.org/2000/svg")
    		.attr('id','svg_ts'+current_ts)            
            .attr("width", ts_width)
            .attr("height", ts_height);            
	

	var x_Scale=d3.time.scale();
	var y_Scale=d3.scale.linear();
	
	xScale[current_ts]=x_Scale;
	yScale[current_ts]=y_Scale;
	

	console.log('update_ts:', regiosel, varsel);	

	if (current_ts=='c') {
		miny=total_date_min;
		maxy=total_date_max;
	} else {                   /* a/b deel */
		if (use_regiomin) {
			miny=regio_ts_min[regiosel];  /* fixme: uitsplitsen naar a/b */
			maxy=regio_ts_max[regiosel];
		} else {
    		miny=minval;			/* fixme: uitsplitsen naar a/b */
    		maxy=maxval;
    	}
    }

    console.log('update_ts:miny,maxy',current_ts, miny,maxy)

    x_Scale.domain([mindate,maxdate]);   // time in ms
	x_Scale.range([50,ts_width]); 

    y_Scale.domain([maxy,miny]);	
	y_Scale.range([50,ts_height-50]); 
	var line = d3.svg.line();

	var x_Axis=d3.svg.axis();
	xAxis[current_ts]=x_Axis;
    x_Axis.scale(x_Scale)
    	.orient("bottom");

	var y_Axis=d3.svg.axis();
	xAxis[current_ts]=y_Axis;
    y_Axis.scale(y_Scale)
    	.orient("left")   
    	.ticks(5)
    	.tickFormat(function(d) {
    			if ((d/1000)>=1) { d=d/1000+"k"; }
    			return d;
			});


	var x_Grid=d3.svg.axis();
	xGrid[current_ts]=x_Grid;
    x_Grid.scale(x_Scale)
    	.orient("bottom")
    	.tickSize(-0.5*ts_height,0,0)
    	.tickFormat(function(d) {
    			return "";

			});
    		
 	var y_Grid=d3.svg.axis();
 	yGrid[current_ts]=y_Grid;
    y_Grid.scale(y_Scale)
    	.orient("left")    	
    	.tickSize(-ts_width,0,0)
    	.tickFormat(function(d) {
    			return "";

			});

/* place axis & grids */

   cv.append("g")
    		.attr("class","grid")
    		.attr("transform","translate(0,"+(ts_height-50)+")")
    		.call(x_Grid);
   cv.append("g")
    		.attr("class","grid")
    		.attr("transform","translate(50,0)")
			.call(y_Grid);

   cv.append("g")
    		.attr("class","xaxis")
    		.attr("transform","translate(0,"+(ts_height-50)+")")
    		.call(x_Axis);
   cv.append("g")
    		.attr("class","yaxis")
    		.attr("transform","translate(50,0)")
    		.call(y_Axis);

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
	.x(function(d,i)  { return x_Scale(xdata[i]); })
	.y(function(d,i)  {  /*console.log(d,i, yScale(d));*/ return y_Scale(d); }); 

	
	xdata=[];
	ydata=[];
	console.log(current_ts,cmode);
	if (current_ts=='c') {
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

	//console.log('C:regioreeks',current_ts, regioreeks)
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


 	d3.select(svg_ts).on('click', click_ts);
 	$('#ts_label_'+current_ts).remove();

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

  update_ts_sel(current_ts);
}
