



function click_datatable_regio (evt){

// met event aan tr gebonden is responsiever, maar moet dan target oppakken van parent. FIXME.

	var clicked_regio=evt.target.getAttribute('data-regio');  
	console.log('click_datatable_regio:',clicked_regio, selected_chart);

	var timeserie=timeseries[selected_chart];
	timeserie.regiosel=clicked_regio;
	timeserie.update_ts();
	if (cmode=='diff') {					// bij verschil ook timeseries C bijwerken.
		timeseries['c'].update_ts();
	}

}



function Datatable () {

	this.sortorder='up';
	this.prevsortcol='';
	this.sort_l={};
	this.sort_a={};
	this.sort_b={};
	this.sort_c={};
	this.empty_l=[];
	this.empty_a=[];
	this.empty_b=[];
	this.empty_c=[];


	this.click_heading=function (evt) {

			var col=evt.target.getAttribute('data-heading');   // l: label, a,b,c,: data (integers)
			datatable.reorder_datatable(col);
		}

	this.reorder_datatable=function (col) {
			
			var sortorder=datatable.sortorder;
			console.log('reorder_datatable:',col,datatable.prevsortcol, sortorder);
			if (datatable.prevsortcol!=col) {
				sortorder='up';
			} else {
				if (sortorder=='up') {
					sortorder='down';
				} else  { // sortorder=down
					sortorder='up';
				}
			}
			console.log('reorder_datatable:',col,sortorder);
			datatable.sortorder=sortorder;
						
			var keys = [];
			key_html=datatable.sortdata[col];
			for(var k in key_html){
				if (col=='l')
					{keys.push(k);} 
				else
					 {keys.push(parseInt(k));}
				}			

			//console.log(keys);
			if (col=='l') 
				{ keys.sort();
					if (sortorder=='up') {
						keys.reverse();
					}
				}
			else
				{ if (sortorder=='up') {
						keys.sort(function(a,b){return a-b});
						 }
					else {
					keys.sort(function(a,b){return b-a});
					}
				}
			//console.log(keys);


			var s=datatable.header();
			var oddeven='odd';
			var empty=this.empty[col];


			if (sortorder=='up') {
				for (i=0; i<keys.length; i++) {			
					s+=key_html[keys[i]].replace('striping',oddeven);
					if (oddeven=='even') 
						{oddeven='odd';}
					else
						{oddeven='even';}
				}			
				for (i=0; i<empty.length; i++) {
					//console.log(keys[i]);
					s+=empty[i].replace('striping',oddeven);
					if (oddeven=='even') 
						{oddeven='odd';}
					else
						{oddeven='even';}
				}			
			}


			if (sortorder=='down') {
				for (i=0; i<empty.length; i++) {
					//console.log(keys[i]);
					s+=empty[i].replace('striping',oddeven);
					if (oddeven=='even') 
						{oddeven='odd';}
					else
						{oddeven='even';}
				}			
				
				for (i=0; i<keys.length; i++) {			
					s+=key_html[keys[i]].replace('striping',oddeven);
					if (oddeven=='even') 
						{oddeven='odd';}
					else
						{oddeven='even';}
				}
			}



			$('#tabledata').html('<table>'+s+'</table>');
			$('.data_header').on('click',datatable.click_heading);
			datatable.prevsortcol=col;
		}


	this.header=function () {
		var s='<tr> <th class="data_header" data-heading="l"> Label</th> <th  class="data_header" data-heading="a">'+dateformat(charts['a'].datesel, datestyle)+'</th><th  class="data_header" data-heading="b">'+dateformat(charts['b'].datesel, datestyle)+'</th><th   class="data_header" data-heading="c">'+cmode+'</th></tr>';

		return s;
	}

	this.update_datatable=function () {

			console.log('update_datatable');

			this.sort_l={};
			this.sort_a={};
			this.sort_b={};
			this.sort_c={};
			this.empty_l=[];
			this.empty_a=[];
			this.empty_b=[];
			this.empty_c=[];

			this.sortdata={'l':this.sort_l, 
						'a':this.sort_a,
						'b':this.sort_b,
						'c':this.sort_c};
			this.empty={'l':this.empty_l,
						'a':this.empty_a,
						'b':this.empty_b,
						'c':this.empty_c};

			var data_a=charts['a'].chart_data;
			var data_b=charts['b'].chart_data;
			var data_c=charts['c'].chart_data;
			
			var row_a=0;
			var row_b=0;
			var row_c=0;
			var s=datatable.header();
			oddeven='odd';
			for (i=0; i<regio_keys.length; i++){
				regio=regio_keys[i];
				val_a='';
				val_b='';
				val_c='';		
				//console.log(regio, data_a[row_a][regioidx], data_b[row_b][regioidx], data_c[row_c][regioidx], ':::',row_a,row_b, row_c);
				if ((row_a<data_a.length) && (data_a[row_a][regioidx]==regio)) {
					val_a=data_a[row_a][varidx];		
					row_a++;
				}
				if ((row_b<data_b.length) && (data_b[row_b][regioidx]==regio)) {
					val_b=data_b[row_b][varidx];		
					row_b++;
				}
				if ((row_c<data_c.length) && (data_c[row_c][regioidx]==regio)) {
					val_c=data_c[row_c][varidx];		
					row_c++;
				}


				if ((val_a!='') || (val_b!='') || (val_c!='')) {
					line='<tr class="striping data_data"> <th class="data_regio" data-regio="'+regio+'">'+regio_label2key[regio]+'  </th><td>'+val_a+'</td><td>'+val_b+'</td><td>'+val_c+'</td></tr>';							
					this.sort_l[regio_label2key[regio]]=line;
					if (val_a!='') {
						this.sort_a[val_a]=line;
					} else {
						this.empty_a.push(line);
					}
					if (val_b!='') {
						this.sort_b[val_b]=line;
					} else {
						this.empty_b.push(line);
					}
					if (val_c!='') {
						this.sort_c[val_c]=line;
					} else {
						this.empty_c.push(line);
					}

				}
			}			
			//	console.log(rownr_a, ':',rownr_b,'==',data[rownr_a][regioidx], ':',data[rownr_b][regioidx]);


		this.reorder_datatable('l');
		$('.data_regio').on('click',click_datatable_regio);
		$('#tabledata').show();
		
		}

}
