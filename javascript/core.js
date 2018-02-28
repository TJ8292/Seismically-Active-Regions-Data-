var container = document.getElementById('popup');
var content = document.getElementById('popup-content');
var closer = document.getElementById('popup-closer');

var osm = new ol.layer.Tile({
source: new ol.source.OSM()
});

var popStyle = new ol.style.Style({
	stroke: new ol.style.Stroke({
		color: [0, 0, 255, 1.0],
		width: 1
	})
});

var popSelected = new ol.style.Style({
	stroke: new ol.style.Stroke({
		color: [0, 255, 255, 1.0],
		width: 1
	})
});

var sweadmStyle = new ol.style.Style({
	stroke: new ol.style.Stroke({
		color: [0, 0, 255, 1.0],
		width: 1
	}),
	fill: new ol.style.Fill({
		color: [200, 100, 1, .7]
	})
});

var sweAdmSelected = new ol.style.Style({
	stroke: new ol.style.Stroke({
		color: [0, 0, 255, 1.0],
		width: 2
	})
});

var vectorSource = new ol.source.Vector();
	var vector = new ol.layer.Vector({
	source: vectorSource
});

var vectorSource2 = new ol.source.Vector();
	var vector2 = new ol.layer.Vector({
	source: vectorSource2,
	style: sweadmStyle
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


//creating style of point
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

//point's definition and coordinates
var pointFeature = new ol.Feature(
new ol.geom.Point(ol.proj.transform([-99.4411447,38.495586],'EPSG:4326','EPSG:900913'))
);

//attaching style to a point
pointFeature.setStyle(pointStyle);

//creation of point layer
var vectorPoint= new ol.layer.Vector({
source: new ol.source.Vector({
features: [pointFeature]
})
});
		
/* Add layer of point features */
var pointsLayer = new ol.layer.Vector({
title: 'points',
source : new ol.source.Vector({
url : 'geojson/pop-us.geojson',
format : new ol.format.GeoJSON()
})
});

var featureRequest = new ol.format.WFS().writeGetFeature({
	srsName: 'EPSG:3857',
	featureNS: 'usa',
	featurePrefix: 'usa',
	featureTypes: ['pop-us'],
	outputFormat: 'application/json',
});

fetch('http://localhost:8080/geoserver/wfs', {
	method: 'POST',
	body: new XMLSerializer().serializeToString(featureRequest)
}).then(function(response) {
return response.json();
}).then(function(json) {
	var features = new ol.format.GeoJSON().readFeatures(json);
	vectorSource.addFeatures(features);
	extent_swe = vectorSource.getExtent();
});

var featureRequest2 = new ol.format.WFS().writeGetFeature({
	srsName: 'EPSG:3857',
	featureNS: 'usa',
	featurePrefix: 'usa',
	featureTypes: ['states'],
	outputFormat: 'application/json',
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

//creation of a new vector layer, which will store drawing of buffer
var vectorBuffers= new ol.layer.Vector({
source: new ol.source.Vector({})
});

var map = new ol.Map({
layers: [osm,vector2,vector,vectorPoint,vectorBuffers],
overlays: [overlay],
target: 'map',
view: new ol.View({
center: ol.proj.transform([-99.4411447,38.495586],'EPSG:4326','EPSG:900913'),
zoom: 4
})
});

        var selectInteraction = new ol.interaction.Select({
            layers: function(layer) {
                return layer.get('selectable') == true;
            },
            style: [popSelected, sweAdmSelected]
        });
		
        vector.set('selectable', true);
        vector2.set('selectable', true);
        map.getInteractions().extend([selectInteraction]);

        selectInteraction.on('select', function(e) {
            var s = e.selected[0].getGeometry().getExtent();
            console.log(s);

            var featureRequest3 = new ol.format.WFS().writeGetFeature({
                srsName: 'EPSG:3857',
                featureNS: 'usa',
                featurePrefix: 'usa',
                featureTypes: ['pop-us'],
                outputFormat: 'application/json',
                filter: new ol.format.filter.Bbox('the_geom', s, 'EPSG:3857')
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
                vectorSource.clear();
                vectorSource.addFeatures(features3);
                map.addLayer(vector);
                extent_swe = vectorSource.getExtent();
            });
        });

//button on the html that triggers the function bufferit
document.getElementById('bufferit').onclick = function (){
var bufferRadius = 1000000;
bufferit(bufferRadius)
};

//function that uses point's geometry
//and draws a polygon around it,
//then the drawn features are added to the vectorBuffers
function bufferit(radius){
var poitnExtent = pointFeature.getGeometry().getExtent();
//var poitnExtent = pointsLayer.getSource().getExtent();
var bufferedExtent = new ol.extent.buffer(poitnExtent,radius);
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
vectorBuffers.getSource().addFeature(bufferedFeature);
}