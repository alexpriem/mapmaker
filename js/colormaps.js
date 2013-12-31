
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


var colormap_red=function colormap_red(N){
	return build_colormap(['white','red'],N);
}

var colormap_hot=function colormap_hot(N){    
	return build_colormap_bezier (['white', 'yellow', 'red', 'black'],N);
}



var colormaps={
	'red':colormap_red,
	'hot':colormap_hot,		
     };
