var transforms=['linear','sqrt','log2','log10'];
//function colormap_terrain() {};
//function colormap_red() {};
//function colormap_hot() {};
//function colormap_coolwarm() {};




/* deze moeten rekening houden met toestand: alle gradienten bijwerken of alleen actieve gradient*/

var click_transform=function click_transform (evt) {

	transform=$(this).attr('data-transform');
	$('.transformname ').removeClass('active_selectie');
	$(this).addClass('active_selectie');

	console.log('new transform:',transform);
	for (i=0; i<selected_charts.length; i++){
		var chart=charts[selected_charts[i]];
		var colormap=chart.colormap;
		colormap.transform=new_transform;
		colormap.calculate_colormap();
		charts[selected_charts[i]].update_choropleth();
	}
	return false;
}



var click_colormap=function click_colormap (evt) {
	new_colormapname=$(this).attr('data-colormap');		
	console.log('click_colormap',new_colormapname);	

	for (i=0; i<selected_charts.length; i++){
		var chart=charts[selected_charts[i]];
		var gradsteps=chart.gradsteps;	
		chart.colormap_data=colormap_function[new_colormapname](gradsteps);		
		console.log('click_colormap',new_colormapname,  colormaplength);	
		charts[selected_charts[i]].update_choropleth();
		}
	$('.colormapname ').removeClass('active_selectie');
	$(this).addClass('active_selectie');		
	return false;
}



function update_colormap_sidebar()  {
	console.log("update_colormap_sidebar");
	if (selected_charts.length==1) {
		charts[selected_charts[0]].colormap.update_sidebar_transformname();
		charts[selected_charts[0]].colormap.update_sidebar_colormapname();
	} // iets anders doen voor lengte>1. (?)
}






var enter_selectie=function enter_selectie (evt) {
	$(this).addClass('hover_selectie');
}
var leave_selectie=function enter_selectie (evt) {
	$(this).removeClass('hover_selectie');
}






function build_colormap_simple (colors, N) {

	scale=chroma.scale(colors).correctLightness(true);
	cmap=[];
	frac=1.0/N;
	for (i=0; i<N; i++){
		rgb=scale(i*frac).rgb();
		cmap.push([parseInt(rgb[0]),parseInt(rgb[1]),parseInt(rgb[2])]);
	}
	return cmap;
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


var colormap_red=function colormap_red(N){
	return build_colormap_simple(['white','red'],N);
}

var colormap_hot=function colormap_hot(N){    
	return build_colormap_bezier (['white', 'yellow', 'red', 'black'],N);
}




var colormap_functions={
	'terrain':colormap_terrain,
	'red':colormap_red,
	'hot':colormap_hot,		
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


	this.calculate_colormap=function () {
		this.colormap_data=colormap_functions[this.colormapname](this.gradsteps);
	}

	this.update_gradient=function (e) {

		
		console.log('update_gradient:');
		if (e.keyCode == '13') {
			var chartname=this.chartname;
			this.gradmax=$('#edit_gradmax_'+chartname).val();
			this.gradsteps=$('#edit_gradsteps_'+chartname).val();
			this.gradmin=$('#edit_gradmin_'+chartname).val();
			console.log('update_gradient:',this.gradmin, this.gradmax, this.gradsteps);
			this.colormap_data=colormap_functions[colormapname](this.gradsteps);	
			charts[chartname].update_choropleth();	
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
			var svg=document.getElementById('chartbox1').children[0];  // FIXME: juiste element pakken. ipv chartbox1
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
			  .html("<label> max:&nbsp;</label> <input type='text' id='edit_gradmax'name='gradmax' value='"+this.gradmax+"' size=4/>");

			chart.append("foreignObject")
			  .attr("width", 150)
			  .attr("height", 50)
			  .attr("x",imgwidth-offsetx)
			  .attr("y",180)
			  .append("xhtml:body")
			  .style("font", "14px Helvetica")
			  .html("<label> step:</label> <input type='text' id='edit_gradsteps'  name='gradsteps' value='"+this.gradsteps+"' size=4/>");

			chart.append("foreignObject")
			  .attr("width", 150)
			  .attr("height", 50)
			  .attr("x",imgwidth-offsetx)
			  .attr("y",270)
			  .append("xhtml:body")
			  .style("font", "14px Helvetica")
			  .html("<label> min:&nbsp;</label> <input type='text' id='edit_gradmin'  name='gradmin' value='"+this.gradmin+"' size=4/>");
		} 
	 		
		$("#edit_gradmax").val(this.gradmax);
		$("#edit_gradsteps").val(this.gradsteps);
		$("#edit_gradmin").val(this.gradmin);

		$("#edit_gradmax").on('keydown',this.update_gradient);
		$("#edit_gradsteps").on('keydown',this.update_gradient);
		$("#edit_gradmin").on('keydown',this.update_gradient);

	}


	this.draw_colormap=function () {

		var chartname=this.chartname;
		console.log("draw_colormap", this.chartname,this.colormaplength);


		$('.colormap_'+chartname).remove();
		var barlength=chart_height/3;
		var barstep=(barlength/this.gradsteps);
		var chart = d3.select("#chart_"+chartname);
		console.log(barlength, barstep);
		var svg=document.getElementById('chartbox1').children[0];
		w=svg.getAttributeNS(null,'width');		
		var imgwidth=parseInt(w.slice(0,w.length-2));
		var transform=this.transform;
		var colormap_data=this.colormap_data;


		chart.append("rect")
			.attr("class","colormap_"+chartname)
			.attr("x",chart_width-25)
			.attr("y",100)
			.attr("width",20)
			.attr("height",barlength)
			.style("fill","none")
			.style("stroke","black")
			.style("stroke-width","1px");
		  
		 for (i=1; i<this.gradsteps; i++) {
		 	color=this.colormap_data[i];
			chart.append("rect")
				.attr("class","colormap_"+chartname)
				.attr("x",chart_width-24)
				.attr("y",100+barlength-barstep*i-1)
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
	  console.log('Colorscale, datadomain',this.datamin, this.datamax);
	  console.log('Colorscale, domain',this.tgradmin, this.tgradmax);
	  tgradmin=1;
	  colorScale.domain([this.tgradmax, this.tgradmin])
	  			.range([0,barlength])
	  			.ticks(1);



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
	        .attr("class","yaxis colormap")
	        .attr("transform","translate("+scalepos+",100)")
	        .call(colorAxis);        	 
	}




	this.color_transform=function (val){

		var transform=this.transform;

		if (val==0) return 0;
		if (transform=='sqrt') {
					return Math.sqrt(val);
		    	}
		if (transform=='log2') {
			if (val>0) {
				return Math.log(val);
				} else { 
				return 0;			
			}	
		}
		if (transform=='log10') {
			if (val>0) {
				return Math.log(val)/Math.LN10;
				} else { 
					return 0;
				}
		   }
		return val;
	}


	console.log(this.colormapname);
	console.log(colormap_functions);
	console.log(colormap_functions[this.colormapname]);
	this.colormap_data=colormap_functions[this.colormapname](this.gradsteps);
	this.init_colormap_inputs();
	this.draw_colormap();
	this.colormaplength=this.colormap_data.length-1;
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
//	  colormaplength=colormap.length-1;
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






