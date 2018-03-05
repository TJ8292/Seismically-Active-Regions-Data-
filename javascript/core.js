var container = document.getElementById('popup');
var content = document.getElementById('popup-content');
var closer = document.getElementById('popup-closer');

var sweadmStyle = new ol.style.Style({
stroke: new ol.style.Stroke({
color: [0, 0, 255, 1.0],
width: 1
}),
fill: new ol.style.Fill({
color: [102, 102, 153, .7]
})
});

var sweAdmSelected = new ol.style.Style({
stroke: new ol.style.Stroke({
color: [0, 0, 255, 1.0],
width: 2
})
});

var nukeStyle = new ol.style.Style({
image: new ol.style.Circle({
fill: new ol.style.Fill({
color: 'green'
}),
stroke: new ol.style.Stroke({
color: 'black'
}),
radius: 8
})
});

var quakeStyle = new ol.style.Style({
image: new ol.style.Circle({
fill: new ol.style.Fill({
color: 'purple'
}),
stroke: new ol.style.Stroke({
color: 'black'
}),
radius: 9
})
});

var popStyle = new ol.style.Style({
image: new ol.style.Circle({
fill: new ol.style.Fill({
color: 'red'
}),
stroke: new ol.style.Stroke({
color: 'black'
}),
radius: 5
})
});

var popSelected = new ol.style.Style({
image: new ol.style.Circle({
fill: new ol.style.Fill({
color: 'yellow'
}),
stroke: new ol.style.Stroke({
color: 'black'
}),
radius: 8
})
});

var vectorSourcePop = new ol.source.Vector();
var vectorPop = new ol.layer.Vector({
source: vectorSourcePop,
style: popStyle

});
var vectorSource2 = new ol.source.Vector();
var vector2 = new ol.layer.Vector({
source: vectorSource2

});

var vectorSourceNuclear = new ol.source.Vector();
var vectorNuclear = new ol.layer.Vector({
	source: vectorSourceNuclear,
	style: nukeStyle
});

var vectorSourceQuake = new ol.source.Vector();
var vectorQuake = new ol.layer.Vector({
	source: vectorSourceQuake,
	style: quakeStyle
});
 
/**
* Create an overlay to anchor the popup to the map.
*/
var overlay = new ol.Overlay( /** @type {olx.OverlayOptions} */
({
element: container,
autoPan: true,
autoPanAnimation: {
duration: 250
}
}));
/**
* Add a click handler to hide the popup.
* @return {boolean} Don't follow the href.
*/
closer.onclick = function() {
overlay.setPosition(undefined);
closer.blur();
return false;
};


var pointStyle = new ol.style.Style({
image: new ol.style.Circle({
fill: new ol.style.Fill({
color: 'yellow'
}),
stroke: new ol.style.Stroke({
color: 'magenta'
}),
radius: 16
})
});

var osm = new ol.layer.Tile({
source: new ol.source.Stamen({
	layer: 'terrain'
})
});

var map = new ol.Map({
layers: [osm, vectorPop, vectorNuclear, vectorQuake],
overlays: [overlay],
target: document.getElementById('map'),
view: new ol.View({
center: ol.proj.transform([-99.4411447,38.495586],'EPSG:4326','EPSG:900913'),
maxZoom: 25,
zoom: 4,
units: 'm'
})
});

var featureRequest = new ol.format.WFS().writeGetFeature({
srsName: 'EPSG:3857',
featureNS: 'usa',
featurePrefix: 'usa',
featureTypes: ['pop-us'],
outputFormat: 'application/json'
});

fetch('http://localhost:8080/geoserver/wfs', {
method: 'POST',
body: new XMLSerializer().serializeToString(featureRequest)
}).then(function(response) {
return response.json();
}).then(function(json) {
var features = new ol.format.GeoJSON().readFeatures(json);
vectorSourcePop.addFeatures(features);
extent_swe = vectorSourcePop.getExtent();
});

var featureRequest2 = new ol.format.WFS().writeGetFeature({
srsName: 'EPSG:3857',
featureNS: 'usa',
featurePrefix: 'usa',
featureTypes: ['states'],
outputFormat: 'application/json'
});

fetch('http://localhost:8080/geoserver/wfs', {
method: 'POST',
body: new XMLSerializer().serializeToString(featureRequest2)
}).then(function(response2) {
return response2.json();
}).then(function(json2) {
var features2 = new ol.format.GeoJSON().readFeatures(json2);
vectorSource2.addFeatures(features2);
extent_swe = vectorSource2.getExtent();
});

var featureRequestNuclear = new ol.format.WFS().writeGetFeature({
srsName: 'EPSG:3857',
featureNS: 'usa',
featurePrefix: 'usa',
featureTypes: ['nuclear-facilities'],
outputFormat: 'application/json'
});

fetch('http://localhost:8080/geoserver/wfs', {
method: 'POST',
body: new XMLSerializer().serializeToString(featureRequestNuclear)
}).then(function(responseNuke) {
return responseNuke.json();
}).then(function(jsonNuke) {
var featuresNuke = new ol.format.GeoJSON().readFeatures(jsonNuke);
vectorSourceNuclear.addFeatures(featuresNuke);
extent_swe = vectorSourceNuclear.getExtent();
});


var featureRequestQuake = new ol.format.WFS().writeGetFeature({
srsName: 'EPSG:3857',
featureNS: 'usa',
featurePrefix: 'usa',
featureTypes: ['earthquake'],
outputFormat: 'application/json'
});

fetch('http://localhost:8080/geoserver/wfs', {
method: 'POST',
body: new XMLSerializer().serializeToString(featureRequestQuake)
}).then(function(responseQuake) {
return responseQuake.json();
}).then(function(jsonQuake) {
var featuresQuake = new ol.format.GeoJSON().readFeatures(jsonQuake);
vectorSourceQuake.addFeatures(featuresQuake);
extent_swe = vectorSourceQuake.getExtent();
});

var vectorBuffers= new ol.layer.Vector({
source: new ol.source.Vector({
	projection: 'EPSG:3857'
})
});

var selectInteraction = new ol.interaction.Select({
layers: function(layer) {
return layer.get('selectable') == true;
},
style: [popSelected, sweAdmSelected]
});

vectorPop.set('selectable', true);
vector2.set('selectable', true);
vectorNuclear.set('selectable',true);
vectorQuake.set('selectable',true);
map.getInteractions().extend([selectInteraction]);



selectInteraction.on('select', function(e) {
var s = e.selected[0].getGeometry().getExtent();
console.log(s);
var radius= parseFloat(100000);

var bufferedExtent = new ol.extent.buffer(s,radius);
console.log(bufferedExtent);
var bufferPolygon = new ol.geom.Polygon(
[
[[bufferedExtent[0],bufferedExtent[1]],
[bufferedExtent[0],bufferedExtent[3]],
[bufferedExtent[2],bufferedExtent[3]],
[bufferedExtent[2],bufferedExtent[1]],
[bufferedExtent[0],bufferedExtent[1]]]
]
);
console.log("bufferPolygon",bufferPolygon);
var bufferedFeature = new ol.Feature(bufferPolygon);
vectorBuffers.getSource().clear();
vectorBuffers.getSource().addFeature(bufferedFeature);

var featureRequest3 = new ol.format.WFS().writeGetFeature({
srsName: 'EPSG:3857',
featureNS: 'usa',
featurePrefix: 'usa',
featureTypes: ['pop-us'],
outputFormat: 'application/json',
filter: new ol.format.filter.Bbox('the_geom', bufferedExtent, 'EPSG:3857')
});

// then post the request and add the received features to a layer
fetch('http://localhost:8080/geoserver/wfs', {
method: 'POST',
body: new XMLSerializer().serializeToString(featureRequest3)
}).then(function(response3) {
//console.log(response3); //prints out information in console
return response3.json();
}).then(function(json3) {
var features3 = new ol.format.GeoJSON().readFeatures(json3);
vectorSourcePop.clear();
vectorSourcePop.addFeatures(features3);
map.addLayer(vectorPop);
});

var featureRequestNuclear1 = new ol.format.WFS().writeGetFeature({
srsName: 'EPSG:3857',
featureNS: 'usa',
featurePrefix: 'usa',
featureTypes: ['nuclear-facilities'],
outputFormat: 'application/json',
filter: new ol.format.filter.Bbox('the_geom', bufferedExtent, 'EPSG:3857')
});

fetch('http://localhost:8080/geoserver/wfs', {
method: 'POST',
body: new XMLSerializer().serializeToString(featureRequestNuclear1)
}).then(function(responseNuke1) {
return responseNuke1.json();
}).then(function(jsonNuke1) {
var featuresNuke1 = new ol.format.GeoJSON().readFeatures(jsonNuke1);
vectorSourceNuclear.clear();
vectorSourceNuclear.addFeatures(featuresNuke1);
map.addLayer(vectorNuclear);
});


var featureRequestQuake1 = new ol.format.WFS().writeGetFeature({
srsName: 'EPSG:3857',
featureNS: 'usa',
featurePrefix: 'usa',
featureTypes: ['earthquake'],
outputFormat: 'application/json',
filter: new ol.format.filter.Bbox('the_geom', bufferedExtent, 'EPSG:3857')
});

fetch('http://localhost:8080/geoserver/wfs', {
method: 'POST',
body: new XMLSerializer().serializeToString(featureRequestQuake1)
}).then(function(responseQuake1) {
return responseQuake1.json();
}).then(function(jsonQuake1) {
var featuresQuake1 = new ol.format.GeoJSON().readFeatures(jsonQuake1);
vectorSourceQuake.clear();
vectorSourceQuake.addFeatures(featuresQuake1);
map.addLayer(vectorQuake);
});

});
/**
* Add a click handler to the map to render the popup.
*/

map.on('singleclick', function(evt) {
var coordinate = evt.coordinate;
var stringifyFunc = ol.coordinate.createStringXY(2);
var out = stringifyFunc(coordinate);
var lonlat = ol.proj.transform(evt.coordinate, 'EPSG:3857', 'EPSG:4326');
  var lon = lonlat[0];
  var lat = lonlat[1];

  //point's definition and coordinates
var pointFeature = new ol.Feature(
new ol.geom.Point(ol.proj.transform([lon,lat],'EPSG:4326','EPSG:900913'))
);

//attaching style to a point
pointFeature.setStyle(pointStyle);

//creation of point layer
var vectorPoint= new ol.layer.Vector({
source: new ol.source.Vector({
features: [pointFeature]
})
});

//creation of a new vector layer, which will store drawing of buffer
var vectorBuffers= new ol.layer.Vector({
source: new ol.source.Vector({})
});
  
var feature = map.forEachFeatureAtPixel(evt.pixel,
function(feature, layer) {
// do stuff here
content.innerHTML = '<p>Information:</p><code>' +
'<p>Cordinates: ' + lon + ' ' + lat + '</p>' + 'Id: ' + feature.getId() +
'</code>';
overlay.setPosition(coordinate);
});
});