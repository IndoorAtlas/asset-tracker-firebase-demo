'use strict';

function LocationView(map) {

  // for auto zoom
  var ZOOM_LEVEL = 20;

  var featureGroup = L.featureGroup().addTo(map);

  // http://leafletjs.com/reference.html#circle
  var accuracyCircleOptions = {
    color: '#000080', // Stroke color
    opacity: 0.7, // Stroke opacity
    weight: 1, // Stroke weight
    fillColor: '#0000ff', // Fill color
    fillOpacity: 0.2 // Fill opacity
  };

  var blueDot = null;

  function show(lat, lon, radius) {
    if (!blueDot) {
      blueDot = L.circle([lat, lon], radius, accuracyCircleOptions).addTo(featureGroup);
      // auto zoom & center on first blue dot
      map.setView(L.latLng(lat, lon), ZOOM_LEVEL);
    } else {
      blueDot.setLatLng([lat, lon]);
      blueDot.setRadius(radius);
    }
  }

  // convenience method
  this.showLocation = function (location) {
    show(location.coordinates.lat, location.coordinates.lon, location.accuracy);
  };
}
