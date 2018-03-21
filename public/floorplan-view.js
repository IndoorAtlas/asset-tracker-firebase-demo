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

    // auto-center
    map.setView(L.latLng(
      floorPlan.image.center.lat,
      floorPlan.image.center.lon));
  }

  this.hide = function(floorPlan) {
    var id = floorPlan.id;
    if (!visibleFloorPlans[id]) return;
    layers[id].remove();
    visibleFloorPlans[id] = false;
  }
}

// handles caching of floor plan metadata and fetching it from the IA Cloud
function FloorPlanCache(fetchFromVenueApi) {

  function PromiseCache() {
    const pending = {};
    const values = {};

    this.get = (key, promiseGetter) => {
      if (values[key]) {
        return Promise.resolve(values[key]);
      }
      if (pending[key]) {
        return pending[key];
      }
      pending[key] = promiseGetter(key).then(value => {
        delete pending[key];
        values[key] = value;
        return value;
      });
      return pending[key];
    };

    this.set = (key, value) => {
      values[key] = value;
    };
  };

  const floorPlans = new PromiseCache();
  const venues = new PromiseCache();

  this.getFloorPlan = function (id, callback) {
    floorPlans.get(id, () => fetchFromVenueApi('floor_plans/' + id))
    .then(callback)
    .catch(error => {
      console.error("Failed to fetch floor plan with ID "+id+": "+JSON.stringify(error));
    });
  };

  this.getVenue = function (venueId, callback) {
    venues.get(venueId, () => fetchFromVenueApi('venues/' + venueId))
    .then(venue => {
      venue.floorPlans.forEach((floorPlan) => {
        floorPlans.set(floorPlan.id, floorPlan);
      });
      callback(venue);
    })
    .catch(error => {
      console.error("Failed to fetch venue with ID "+venueId+": "+JSON.stringify(error));
    });
  }
}

// handles fetching of floor plan metadata from IA cloud & showing
// a single floor plan
function FloorPlanManager(map, fetchFromVenueApi) {
  var floorPlanView = new FloorPlanView(map);
  this.floorPlanCache = new FloorPlanCache(fetchFromVenueApi);

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

  this.onExitFloorPlan = (id) => {
    currentFloorPlanId = null;

    setTimeout(() => {
      // don't hide immediately if the callback is followed by
      // another enter floor plan event
      if (!currentFloorPlanId && visibleFloorPlan) {
        this.hide();
      }
    }, 100);
  };

  this.onEnterFloorPlan = (id) => {
    currentFloorPlanId = id;
    this.floorPlanCache.getFloorPlan(id, function (floorPlan) {
      if (currentFloorPlanId != id) return;
      showFloorPlan(floorPlan);
    });
  };
}
