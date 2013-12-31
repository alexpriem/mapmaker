

function click_regio() {

	console.log(this.id);	
}

function change_var () {

/* todo: cleanup  + handle multipolygons */



	var varname=this.id.split('_')[1];
	var varidx=this.id.split('_')[2];
	console.log(varname);
	minval=var_min[varidx];
	maxval=Math.log(var_max[varidx]);
	console.log(data);	
	for (var key in data) {
		if (data.hasOwnProperty(key)){
			var regioinfo=data[key];
			//console.log(regioinfo);
			val=regioinfo[varidx-1];
		//	console.log(val);
			if (val!=0){
				val=Math.log(val);
		//		console.log(val);
				colorindex=parseInt(254*(val-minval)/(1.0*(maxval-minval)));
				//console.log(colorindex);
				var color=colormap[colorindex];
				//console.log(color);
				var s="rgb("+color[0]+","+color[1]+","+color[2]+")";
				//console.log('#r'+key+'_1',s);
				el_ids=shape_ids[key];
				for (i=0; i<el_ids.length; i++) {
					el_id='#'+el_ids[i];				
					el=$(el_id);
					c=$(el).children();
					for (j=0; j<c.length; j++){
						c_j=c[j];
						$(c_j).css('fill',s);
						$(c_j).css('color',s);
						}
					}			
			}
		}
	}
}

function setup_vars () {
	var html='';
	for (i=1; i<varnames.length; i++) {
		var varname=varnames[i];
		html+='<li class="varnameli"> <a href="#" id="v_'+varname+'_'+i+'"" class="varname">'+varname  + '</a></li>';
	
	}
	$('#varlist').html(html);
	$('.varname').on('click',change_var);
}

function init_svg(){
	$('.outline').on('click',click_regio);
	setup_vars();
	colormap=colormap_hot(256);
	//console.log(colormap);
}


$( document ).ready(init_svg);