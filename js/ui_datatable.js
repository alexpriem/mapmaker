



function Datatable () {




	this.click_heading=function (evt) {

			var col=evt.target.getAttribute('data-heading');
			datatable.reorder_datatable(col);
		}

	this.reorder_datatable=function (col) {

			console.log('reorder_datatable:',col);
			var keys = [];
			key_html=datatable.sortdata[col];
			for(var k in key_html){
				if (col=='l')
					{keys.push(k);} 
				else
					 {keys.push(parseInt(k));}
				}

			console.log(keys);
			if (col=='l') 
				{ keys.sort();}
			else
				{ keys.sort(function(a,b){return a-b}); }

			console.log(keys);
			var s=this.header();
			for (i=0; i<keys.length; i++) {
				console.log(keys[i]);
				s+=key_html[keys[i]];
			}
			$('#tabledata').html('<table>'+s+'</table>');
			$('.data_header').on('click',this.reorder_datatable);
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
			this.sortdata={'l':this.sort_l, 
						'a':this.sort_a,
						'b':this.sort_b,
						'c':this.sort_c};

			var data_a=charts['a'].chart_data;
			var data_b=charts['b'].chart_data;
			var data_c=charts['c'].chart_data;

			var row_a=0;
			var row_b=0;
			var row_c=0;
			var s=this.header();
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
					line='<tr class="'+oddeven+'"> <th>'+regio_label2key[regio]+'  </th><td>'+val_a+'</td><td>'+val_b+'</td><td>'+val_c+'</td></tr>';							
					if (oddeven=='even') 
						{oddeven='odd';}
					else
						{oddeven='even';}
					this.sort_l[regio_label2key[regio]]=line;
					this.sort_a[val_a]=line;
					this.sort_b[val_b]=line;
					this.sort_c[val_c]=line;
				}
			}
			
			//	console.log(rownr_a, ':',rownr_b,'==',data[rownr_a][regioidx], ':',data[rownr_b][regioidx]);

		this.reorder_datatable('l');
		$('#tabledata').show();
		}




		

}
