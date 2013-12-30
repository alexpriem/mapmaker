


function click_regio() {

	console.log(this.id);	
}


function init_svg(){
	$('.outline').on('click',click_regio);
}


$( document ).ready(init_svg);