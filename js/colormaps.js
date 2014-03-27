

var transform='log10';
var colormapname='hot';
var gradmax='max';
var gradmin=0;
var gradsteps=255;
var minval=0;
var maxval=0;
var tminval=0;
var tmaxval=0;



var click_transform=function click_transform (evt) {

	transform=$(this).attr('data-transform');
	$('.transformname ').removeClass('active_selectie');
	$(this).addClass('active_selectie');

	console.log('new transform:',transform);
	update_choropleth();
	return false;
}



var click_colormap=function click_colormap (evt) {
	colormapname=$(this).attr('data-colormap');
	
	console.log('click_colormap',colormapname);
	colormap=colormaps[colormapname](gradsteps);
	colormaplength=colormap.length-1;
	console.log('click_colormap',colormapname,  colormaplength);
	$('.colormapname ').removeClass('active_selectie');
	$(this).addClass('active_selectie');
	
	update_choropleth();
	return false;
}



function color_transform (val){

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





var enter_selectie=function enter_selectie (evt) {
	$(this).addClass('hover_selectie');
}
var leave_selectie=function enter_selectie (evt) {
	$(this).removeClass('hover_selectie');
}




function init_colormap_inputs() {

	if 	(typeof(SVGForeignObjectElement)!== 'undefined') {
		$('.ie_fallback').remove();
		var chart = d3.select("#chart1");
		var svg=document.getElementById('chartbox1').children[0];
		w=svg.getAttributeNS(null,'width');		
		var imgwidth=parseInt(w.slice(0,w.length-2));
		console.log('imgwidth:',imgwidth);
	//	svg.setAttributeNS(null,'width',(imgwidth+200)+'pt');
		
		
		offsetx=200;
		chart.append("foreignObject")
		  .attr("width", 150)
		  .attr("height", 50)
		  .attr("x",imgwidth-offsetx)
		  .attr("y",100)
		  .append("xhtml:body")
		  .style("font", "14px Helvetica")
		  .html("<label> max:&nbsp;</label> <input type='text' id='edit_gradmax'name='gradmax' value='"+gradmax+"' size=4/>");

		chart.append("foreignObject")
		  .attr("width", 150)
		  .attr("height", 50)
		  .attr("x",imgwidth-offsetx)
		  .attr("y",180)
		  .append("xhtml:body")
		  .style("font", "14px Helvetica")
		  .html("<label> step:</label> <input type='text' id='edit_gradsteps'  name='gradsteps' value='"+gradsteps+"' size=4/>");

		chart.append("foreignObject")
		  .attr("width", 150)
		  .attr("height", 50)
		  .attr("x",imgwidth-offsetx)
		  .attr("y",270)
		  .append("xhtml:body")
		  .style("font", "14px Helvetica")
		  .html("<label> min:&nbsp;</label> <input type='text' id='edit_gradmin'  name='gradmin' value='"+gradmin+"' size=4/>");
	} 
 		
	$("#edit_gradmax").val(gradmax);
	$("#edit_gradsteps").val(gradsteps);
	$("#edit_gradmin").val(gradmin);

	$("#edit_gradmax").on('keydown',update_gradient);
	$("#edit_gradsteps").on('keydown',update_gradient);
	$("#edit_gradmin").on('keydown',update_gradient);

}


function draw_colormap () {

console.log("draw_colormap", colormaplength);


$('.colormap').remove();
var barlength=chart_height/3;
var barstep=(barlength/gradsteps);
var chart = d3.select("#chart1");
console.log(barlength, barstep);
var svg=document.getElementById('chartbox2').children[0];
w=svg.getAttributeNS(null,'width');		
var imgwidth=parseInt(w.slice(0,w.length-2));

chart.append("rect")
	.attr("class","colormap")
	.attr("x",chart_width-25)
	.attr("y",100)
	.attr("width",20)
	.attr("height",barlength)
	.style("fill","none")
	.style("stroke","black")
	.style("stroke-width","1px");
  
 for (i=1; i<gradsteps; i++) {
 	color=colormap[i];
	chart.append("rect")
		.attr("class","colormap")
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

  console.log('Colorscale, transform:', transform);
  console.log('Colorscale, datadomain',datamin, datamax);
  console.log('Colorscale, domain',tgradmin, tgradmax);
  tgradmin=1;
  colorScale.domain([tgradmax, tgradmin])
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






function update_gradient (e) {

	
	console.log('update_gradient:');
	if (e.keyCode == '13') {
		gradmax=$('#edit_gradmax').val();
		gradsteps=$('#edit_gradsteps').val();
		gradmin=$('#edit_gradmin').val();
		console.log('update_gradient:',gradmin, gradmax, gradsteps);
		colormap=colormaps[colormapname](gradsteps);	
		update_choropleth();	
	}
}




function init_colormaps()
{

console.log("init_colormaps");
var html='<li class="sel_heading"> Colormaps: </li>';
var selclas='';
for (var key in colormaps) {
  if (colormaps.hasOwnProperty(key)) {
  	if (key==colormapname) 
  		selclass='active_selectie';
  	else
  		selclass='';
    html+='<li class="colormapname '+selclass+'" id="colormap_'+key+'" data-colormap="'+key+'">'+key+'</li>';
  }
  colormap=colormaps[colormapname](gradsteps);
  colormaplength=colormap.length-1;
}

$('#sel_colormap').html(html);
$('.colormapname').on('click',click_colormap);
$('.colormapname').on('mouseenter ',enter_selectie);
$('.colormapname').on('mouseout ',leave_selectie);
$('#colormapname_'+colormapname).addClass('active_selectie');

$('.transformname').on('mouseenter ',enter_selectie);
$('.transformname').on('mouseout ',leave_selectie);
$('.transformname').on('click',click_transform);
$('#trans_'+transform).addClass('active_selectie');

 //for (colormapname in colormaps)  break;
 colormap=colormaps[colormapname](gradsteps);
 colormaplength=colormap.length-1;
 //init_colormap_inputs();
 console.log('init_colormaps:',colormapname,colormaplength,gradsteps);

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




var colormaps={
	'terrain':colormap_terrain,
	'red':colormap_red,
	'hot':colormap_hot,		
	'coolwarm':colormap_coolwarm,	
  };
