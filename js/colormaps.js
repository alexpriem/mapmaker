var transforms=['linear','sqrt','log2','log10'];
//function colormap_terrain() {};
//function colormap_red() {};
//function colormap_hot() {};
//function colormap_coolwarm() {};


// http://stackoverflow.com/questions/7624920/number-sign-in-javascript
function sign(x) {
    return typeof x === 'number' ? x ? x < 0 ? -1 : 1 : x === x ? 0 : NaN : NaN;
}


/* deze moeten rekening houden met toestand: alle gradienten bijwerken of alleen actieve gradient*/

var click_transform=function click_transform (evt) {

	var new_transform=$(this).attr('data-transform');
	$('.transformname ').removeClass('active_selectie');
	$(this).addClass('active_selectie');

	console.log('new transform:',new_transform);

	if (selected_charts.length>1){
		for (var i=0; i<selected_charts.length; i++){
			var chart=charts[selected_charts[i]];
			var colormap=chart.colormap;
			colormap.transform=new_transform;		
			colormap.calculate_colormap();
			chart.forced_update=true;
			chart.update_choropleth();
		}
	} else {
			var chart=charts[selected_chart];
			var colormap=chart.colormap;
			colormap.transform=new_transform;		
			colormap.calculate_colormap();
			chart.forced_update=true;
			chart.update_choropleth();		
	}
	return false;
}



var click_colormap=function click_colormap (evt) {
	new_colormapname=$(this).attr('data-colormap');		
	console.log('click_colormap',new_colormapname);	

	if (selected_charts.length>1){
		for (var i=0; i<selected_charts.length; i++){
			var chart=charts[selected_charts[i]];
			var colormap=chart.colormap;		
			colormap.colormapname=new_colormapname;
			colormap.calculate_colormap();
			//chart.colormap_data=colormap_functions[new_colormapname](colormap.gradsteps);		
			console.log('click_colormap',new_colormapname);	
			chart.forced_update=true;
			chart.update_choropleth();
			}
		} else {
			var chart=charts[selected_chart];
			var colormap=chart.colormap;
			colormap.colormapname=new_colormapname	
			colormap.calculate_colormap();
			chart.forced_update=true;
			chart.update_choropleth();		
	}

	$('.colormapname ').removeClass('active_selectie');
	$(this).addClass('active_selectie');		
	return false;
}



function update_colormap_sidebar()  {
	console.log("update_colormap_sidebar");
	
	charts[selected_chart].colormap.update_sidebar_transformname();
	charts[selected_chart].colormap.update_sidebar_colormapname();	
}






var enter_selectie=function enter_selectie (evt) {
	$(this).addClass('hover_selectie');
}
var leave_selectie=function enter_selectie (evt) {
	$(this).removeClass('hover_selectie');
}








function build_colormap_bezier (colors, N) {

	scale=chroma.interpolate.bezier(colors);
	cmap=[];
	frac=1.0/N;
	for (i=0; i<N; i++){
		rgb=scale(i*frac).rgb();
		cmap.push([parseInt(rgb[0]),parseInt(rgb[1]),parseInt(rgb[2])]);
	}
	return cmap;
}




var colormap_terrain=function colormap_terrain (N) {
	
	scale = chroma.scale(['#333399','#0098ff','#00ca69','#ffff99','#805d54','#ffffff']);
	cmap=[];
	frac=1.0/N;
	for (i=0; i<N; i++){
		rgb=scale(i*frac).rgb();
		cmap.push([parseInt(rgb[0]),parseInt(rgb[1]),parseInt(rgb[2])]);
	}
	return cmap;
}



var colormap_coolwarm=function colormap_coolwarm(N){
    
scale = chroma.scale(['#3A4CC0','white','#B30326']);
cmap=[];
frac=1.0/N;
for (i=0; i<N; i++){
	rgb=scale(i*frac).rgb();
	cmap.push([parseInt(rgb[0]),parseInt(rgb[1]),parseInt(rgb[2])]);
}
return cmap;
}




var colormap_hot2=function colormap_hot2(N){    
	return build_colormap_bezier (['white', 'yellow', 'red', 'black'],N);
}



var colormap_blue=function colormap_blue(N){
    
scale=chroma.scale(['white', '#d2ecf7','#9cd7ef','#00a1cd','#008dd1','#004b9a', '#002c61']).correctLightness(true);
cmap=[];
frac=1.0/N;
for (i=0; i<N; i++){
	rgb=scale(i*frac).rgb();
	cmap.push([parseInt(rgb[0]),parseInt(rgb[1]),parseInt(rgb[2])]);
}
return cmap;
}

var colormap_red=function colormap_red(N){
    
scale=chroma.scale(['white', '#fee4c7','#fccb8d','#f39200','#ea5906','#e4002c', '#af081f']).correctLightness(true);
cmap=[];
frac=1.0/N;
for (i=0; i<N; i++){
	rgb=scale(i*frac).rgb();
	cmap.push([parseInt(rgb[0]),parseInt(rgb[1]),parseInt(rgb[2])]);
}
return cmap;
}

var colormap_green=function colormap_green(N){
    
scale=chroma.scale(['white', '#ecf2d0','#dae49b','#afcb05','#85bc22','#00a139', '#007f2c']).correctLightness(true);
cmap=[];
frac=1.0/N;
for (i=0; i<N; i++){
	rgb=scale(i*frac).rgb();
	cmap.push([parseInt(rgb[0]),parseInt(rgb[1]),parseInt(rgb[2])]);
}
return cmap;
}



var colormap_hot=function colormap_hot(N){
    
scale=chroma.scale(['white', '#ffce00', '#ffae00', 'black']).correctLightness(true);
cmap=[];
frac=1.0/N;
for (i=0; i<N; i++){
	rgb=scale(i*frac).rgb();
	cmap.push([parseInt(rgb[0]),parseInt(rgb[1]),parseInt(rgb[2])]);
}
return cmap;
}




var colormap_functions={
	'terrain':colormap_terrain,
	'blue':colormap_blue,
	'green':colormap_green,
	'red':colormap_red,
	'hot':colormap_hot,
	'hot2':colormap_hot2,		
	'coolwarm':colormap_coolwarm,	
  };




function Colormap (chartname, colormapname, transform, gradmin,gradsteps,gradmax) {

	this.chartname=chartname;
	this.gradmax=gradmax;
	this.gradmin=gradmin;
	this.gradsteps=gradsteps;
	this.tgradmin=0;
	this.tgradmax=0;
	this.transform=transform;
	this.colormapname=colormapname;

		// kopie 
	this.gradmax_2=gradmax;
	this.gradmin_2=gradmin;
	this.gradsteps_2=gradsteps;
	this.tgradmin_2=0;
	this.tgradmax_2=0;
	this.transform_2=transform;
	this.colormapname_2=colormapname;



	this.store_settings=function () {
		this.gradmax_2=this.gradmax;
		this.gradmin_2=this.gradmin;
		this.gradsteps_2=this.gradsteps;
		this.tgradmin_2=this.tgradmin;
		this.tgradmax_2=this.tgradmax;
		this.transform_2=this.transform;
		this.colormapname_2=this.colormapname;
	}

	this.restore_settings=function () {
		this.gradmax=this.gradmax_2;
		this.gradmin=this.gradmin_2;
		this.gradsteps=this.gradsteps_2;
		this.tgradmin=this.tgradmin_2;
		this.tgradmax=this.tgradmax_2;
		this.transform=this.transform_2;
		this.colormapname=this.colormapname_2;
	}

	this.copy_settings=function (from_chart){

		this.gradmax=from_chart.gradmax;
		this.gradmin=from_chart.gradmin;
		this.gradsteps=from_chart.gradsteps;
		this.tgradmin=from_chart.tgradmin;
		this.tgradmax=from_chart.tgradmax;
		this.transform=from_chart.transform;
		this.colormapname=from_chart.colormapname;
	}


	this.calculate_colormap=function () {
		this.colormap_data=colormap_functions[this.colormapname](this.gradsteps);
	}

	this.update_gradient=function (evt) {

		
		console.log('update_gradient:');
		if (evt.keyCode == '13') {			
			var chartname=evt.target.getAttribute('data-ts');
			var chart=charts[chartname];
			var colormap=chart.colormap;
			var val=$('#edit_gradsteps_'+chartname).val();
			if (val<1) { 
					$('#edit_gradsteps_'+chartname).css('background','red');
				}
				else{
				 colormap.gradsteps=val;
				 $('#edit_gradsteps_'+chartname).css('background','white');
			}
			colormap.gradmax=$('#edit_gradmax_'+chartname).val();			
			colormap.gradmin=$('#edit_gradmin_'+chartname).val();
			console.log('update_gradient:',chart.gradmin, chart.gradmax, chart.gradsteps);
			colormap.calculate_colormap();
			chart.forced_update=true;
			chart.update_choropleth();	
		}
	}


	this.update_sidebar_transformname=function () {
		console.log('update_sidebar_transformname:',this.transform);
		$('.transformname').removeClass('active_selectie');
		$('#trans_'+this.transform).addClass('active_selectie');
	}
	this.update_sidebar_colormapname=function () {
		$('.colormapname').removeClass('active_selectie');
		$('#colormap_'+this.colormapname).addClass('active_selectie');
	}


	this.init_colormap_inputs=function () {

		var chartname=this.chartname;
		if 	(typeof(SVGForeignObjectElement)!== 'undefined') {
			$('.ie_fallback').remove();
			var chart = d3.select("#chart_"+chartname);
			var svg=document.getElementById('chartbox_'+chartname).children[0];  // FIXME: juiste element pakken. ipv chartbox1
			w=svg.getAttributeNS(null,'width');		
			var imgwidth=parseInt(w.slice(0,w.length-2));
			console.log('init_colormap_inputs: imgwidth:',imgwidth);
		//	svg.setAttributeNS(null,'width',(imgwidth+200)+'pt');
			
			

			offsetx=-50;
			chart.append("foreignObject")
			  .attr("width", 150)
			  .attr("height", 50)
			  .attr("x",imgwidth-offsetx)
			  .attr("y",100)
			  .append("xhtml:body")
			  .style("font", "14px Helvetica")
			  .html("<label> max:&nbsp;</label> <input type='text' id='edit_gradmax_"+chartname+"' data-ts='"+chartname+"' name='gradmax' value='"+this.gradmax+"' size=4/>");

			chart.append("foreignObject")
			  .attr("width", 150)
			  .attr("height", 50)
			  .attr("x",imgwidth-offsetx)
			  .attr("y",180)
			  .append("xhtml:body")
			  .style("font", "14px Helvetica")
			  .html("<label> step:</label> <input type='text' id='edit_gradsteps_"+chartname+"' data-ts='"+chartname+"' name='gradsteps' value='"+this.gradsteps+"' size=4/>");

			chart.append("foreignObject")
			  .attr("width", 150)
			  .attr("height", 50)
			  .attr("x",imgwidth-offsetx)
			  .attr("y",270)
			  .append("xhtml:body")
			  .style("font", "14px Helvetica")
			  .html("<label> min:&nbsp;</label> <input type='text' id='edit_gradmin_"+chartname+"' data-ts='"+chartname+"' name='gradmin' value='"+this.gradmin+"' size=4/>");
		} 
	 		
		$("#edit_gradmax_"+chartname).val(this.gradmax);
		$("#edit_gradsteps_"+chartname).val(this.gradsteps);
		$("#edit_gradmin_"+chartname).val(this.gradmin);

		$("#edit_gradmax_"+chartname).on('keydown',this.update_gradient);
		$("#edit_gradsteps_"+chartname).on('keydown',this.update_gradient);
		$("#edit_gradmin_"+chartname).on('keydown',this.update_gradient);

	}


	this.draw_colormap=function () {

		var chartname=this.chartname;
		console.log("draw_colormap:", this.chartname, this.colormapname, this.transform, this.gradsteps);

		var colormapclassname='colormap_'+chartname;
		$('.'+colormapclassname).remove();		
		var barlength=chart_height/3;
		var barstep=(barlength/this.gradsteps);
		var chart = d3.select("#chart_"+chartname);
		//console.log(barlength, barstep);
		var svg=document.getElementById('chartbox_'+chartname).children[0];
		w=svg.getAttributeNS(null,'width');		
		var imgwidth=parseInt(w.slice(0,w.length-2));
		var transform=this.transform;
		var colormap_data=this.colormap_data;


		chart.append("rect")
			.attr("class",colormapclassname)
			.attr("x",chart_width-25)
			.attr("y",100)
			.attr("width",20)
			.attr("height",barlength)
			.style("fill","none")
			.style("stroke","black")
			.style("stroke-width","1px");
		  
		  //console.log("colormap_data:",this.colormap_data)
		 for (i=0; i<this.gradsteps; i++) {

		 	color=this.colormap_data[i];
		// 	console.log(i,color);
			chart.append("rect")
				.attr("class",colormapclassname)
				.attr("x",chart_width-24)
				.attr("y",100+barlength-barstep*i-barstep)
				.attr("width",18)
				.attr("height",barstep)
				.style("fill","rgb("+color[0]+","+color[1]+","+color[2]+")")
				.style("stroke","rgb("+color[0]+","+color[1]+","+color[2]+")")
				.style("stroke-width","1px");

		 }


	  if (transform=='linear') {
		var colorScale=d3.scale.linear();
	  }  
	  if (transform=='log10') {  	
	  	var colorScale=d3.scale.log();
	  }
	  if (transform=='log2') {
	  	var colorScale=d3.scale.log().base(2);
	  }
	  if (transform=='sqrt') {
	  	var colorScale=d3.scale.pow().exponent(0.5);
	  }
	  this.colorScale=colorScale;

	  console.log('Colorscale, transform:', this.transform);
	  //console.log('Colorscale, datadomain',this.datamin, this.datamax);
	  console.log('Colorscale, domain',this.gradient_max, this.gradient_min);
	  tgradmin=1;
	  colorScale.domain([this.gradient_max, this.gradient_min])
	  			.range([0,barlength])
	  			.ticks(10);



	  var colorAxis=d3.svg.axis();  
	  colorAxis.scale(colorScale)       
	       .orient("left")
	       .tickFormat(function(d) {
	       	 		var x = Math.log(d) / Math.log(10) + 1e-6;
	       	 		val=Math.abs(x - Math.floor(x));
	       	 		if (val >= .75) return "";
	       	 		if ((val<.68) && (val>.31)) return "";
	       			if ((d/1000000)>=1) { return d=d/1000000+"M"; }
	    			if ((d/1000)>=1) { return d=d/1000+"k"; }
	    			return d;
				});


	  scalepos=chart_width-25;
	  chart.append("g")
	        .attr("class","yaxis "+colormapclassname)
	        .attr("transform","translate("+scalepos+",100)")
	        .call(colorAxis);        	 
	}




	this.color_transform=function (val){

		var transform=this.transform;

		var sign_val=sign(val);
		var absval=Math.abs(val);
		
		if (val==0) return 0;
		if (transform=='sqrt') {
					return sign_val*Math.sqrt(absval);
		    	}
		if (transform=='log2') {
				return sign_val*Math.log(absval);		
		}
		if (transform=='log10') {
				return sign_val*Math.log(absval)/Math.LN10;
		}
		return val;
	}

	
	this.colormap_data=colormap_functions[this.colormapname](this.gradsteps);
	this.init_colormap_inputs();
	this.draw_colormap();	
}



/* initializeer sidebar */

	function init_colormap_sidebar_controls()

	{
		console.log("init_colormaps");
		var html='<li class="sel_heading"> Colormaps: </li>';
		var selclas='';
		for (var key in colormap_functions) {
	  		if (colormap_functions.hasOwnProperty(key)) {	  			
	  			selclass='';
	    		html+='<li class="colormapname '+selclass+'" id="colormap_'+key+'" data-colormap="'+key+'">'+key+'</li>';
	  			}
//	  colormap=colormaps[colormapname](gradsteps); 
			}


		$('#sel_colormap').html(html);
		$('.colormapname').on('click',click_colormap);
		$('.colormapname').on('mouseenter ',enter_selectie);
		$('.colormapname').on('mouseout ',leave_selectie);
		//$('#colormapname_'+colormapname).addClass('active_selectie');

		$('.transformname').on('mouseenter ',enter_selectie);
		$('.transformname').on('mouseout ',leave_selectie);
		$('.transformname').on('click',click_transform);
		//$('#trans_'+transform).addClass('active_selectie');

	 	console.log('init_colormap_sidebar_controls:done');
	}






