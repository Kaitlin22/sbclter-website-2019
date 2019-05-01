// Javascript for creating google maps
// Loads the kml layers

var map;
var site_url = 'http://sbc.lternet.edu/';
var layers = {};  // Holds all layer objects that map to URL's

function initMap() {
	// Get all checkboxes on the screen
	// Boxes generated by sampling data layers
	var boxes = document.getElementsByClassName("layer_box");

	// Set up the google map
	map = new google.maps.Map(document.getElementById("map"),
		{
		center:new google.maps.LatLng(34.3, - 120.000),
		zoom: 9,
		mapTypeId: google.maps.MapTypeId.TERRAIN
		}
	);

	// Create all url's for the data layers
	for(var i=0; i < boxes.length; i++){
		layer_url = site_url + "kml/sampling/layers/" + boxes[i].id + ".kml";

		layers[boxes[i].id] = new google.maps.KmlLayer(layer_url, {
			preserveViewport: false,
			map: null
		})
	}

}

// Display the layer with the given id on the map
function show_layer(id){
	layers[id].setMap(map);
}

// Hide the layer with given id on the map
function hide_layer(id){
	layers[id].setMap(null);
}

// This will toggle the boxes layer on the map
// given state true=on false=off and id to hide
function toggle_layer(on, id){
	if(on){  // Show
		show_layer(id);
	}else{  // Hide
		hide_layer(id);
	}
}

// Tracks changes to any of the boxes on the page
$('.layer_box').change(function() {
	toggle_layer(this.checked, this.id);
})

// Toggles on all checkboxes of specific id to on
$('.btn_on').click(function() {
	check_class = "chkbox_" + this.id;
	$("." + check_class).prop('checked', true);

	// For bootstrap to show toggle
 	$("." + check_class).parent().attr('class', "toggle btn btn-info");

 	// Show data on map
 	boxes = document.getElementsByClassName(check_class);
 	for(var i = 0; i < boxes.length; i++){  // Show all layers
 		toggle_layer(true, boxes[i].id);
 	}
})

// Toggles off all checkboxes of specific id to on
$('.btn_off').click(function() {
	check_class = "chkbox_" + this.id;
	$("." + check_class).prop('checked', false);

	// For bootstrap to show toggle
 	$("." + check_class).parent().attr('class', "toggle btn btn-outline-secondary off");

 	// Show data on map
 	boxes = document.getElementsByClassName(check_class);
 	for(var i = 0; i < boxes.length; i++){  // Show all layers
 		toggle_layer(false, boxes[i].id);
 	}
})