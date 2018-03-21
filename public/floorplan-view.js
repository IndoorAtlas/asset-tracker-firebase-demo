'use strict';

// form https://github.com/IndoorAtlas/sdk-cordova-examples/blob/master/LeafletExample/www/js/index.js
// can hide an show multiple floor plans on a map
function FloorPlanView(map) {
  var layers = {};
  var visibleFloorPlans = {};

  function asLatLng(coords) {
    return [coords.lat, coords.lon];
  }

  function buildImageOverlay(floorPlan) {
    return L.imageOverlay.rotated(floorPlan.image.url,
      asLatLng(floorPlan.image.topLeft),
      asLatLng(floorPlan.image.topRight),
      asLatLng(floorPlan.image.bottomLeft));
  }

  this.show = function(floorPlan) {
    var id = floorPlan.id;
    if (visibleFloorPlans[id]) return;

    if (!layers[id]) {
      layers[id] = buildImageOverlay(floorPlan);
    }
    layers[id].addTo(map);
    visibleFloorPlans[id] = true;
  }

  this.hide = function(floorPlan) {
    var id = floorPlan.id;
    if (!visibleFloorPlans[id]) return;
    layers[id].remove();
    visibleFloorPlans[id] = false;
  }
}

// handles caching of floor plan metadata and fetching it from the IA Cloud
function FloorPlanCache(fetchFloorPlanWithId) {
  var metadata = {};

  this.fetchById = function (id, callback) {
    // download unless cached or pending
    if (!metadata[id]) {
      metadata[id] = "pending";
      fetchFloorPlanWithId(id, function (floorPlan) {
        metadata[id] = floorPlan;
        callback(floorPlan);
      }, function (error) {
        alert("Failed to fetch floor plan with ID "+id+": "+JSON.stringify(error));
      });
    }
    else if (metadata[id] != "pending") {
      callback(floorPlan);
    }
  };
}

// handles fetching of floor plan metadata from IA cloud & showing
// a single floor plan
function FloorPlanManager(map, fetchFloorPlanWithId) {
  var floorPlanView = new FloorPlanView(map);
  var floorPlanCache = new FloorPlanCache(fetchFloorPlanWithId);

  // which floor plan should be visible
  var currentFloorPlanId = null;

  // which floor plan is visible
  var visibleFloorPlan = null;

  function showFloorPlan(floorPlan) {
    var id = floorPlan.id;
    floorPlanView.show(floorPlan);

    // remove after adding the new floor plan to reduce blinking
    if (visibleFloorPlan && visibleFloorPlan.id != id) {
      floorPlanView.hide(visibleFloorPlan);
    }
    visibleFloorPlan = floorPlan;
  };

  this.hide = function() {
    if (visibleFloorPlan) {
      floorPlanView.hide(visibleFloorPlan);
      visibleFloorPlan = null;
    }
  };

  this.onExitFloorPlan = function(id) {
    currentFloorPlanId = null;

    setTimeout(function () {
      // don't hide immediately if the callback is followed by
      // another enter floor plan event
      if (!currentFloorPlanId && visibleFloorPlan) {
        this.hide();
      }
    }, 100);
  };

  this.onEnterFloorPlan = function(id) {
    currentFloorPlanId = id;
    floorPlanCache.fetchById(id, function (floorPlan) {
      if (currentFloorPlanId != id) return;
      showFloorPlan(floorPlan);
    });
  };
}
