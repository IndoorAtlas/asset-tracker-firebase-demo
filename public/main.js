"use strict";

function getFirst(assets, path) {
  return _.keys(assets).sort().map(k => assets[k])
    .map(a => _.get(a, path))
    .filter(c => c)[0];
}

function AssetView(map) {
  const markers = {};
  let circle = null;

  const featureGroup = L.featureGroup().addTo(map);

  this.update = (agentId, pos, active) => {
    const coords = pos.location.coordinates;
    const latLon = [coords.lat, coords.lon];

    if (active) {
      const radius = pos.location.accuracy;
      if (!circle) {
        circle = L.circle(latLon, radius, {
          //color: "#000080", // Stroke color
          opacity: 0, // Stroke opacity
          weight: 1, // Stroke weight
          fillColor: "#0000ff",
          fillOpacity: 0.1
        })
        .addTo(featureGroup);
      } else {
        circle.setLatLng(latLon);
        circle.setRadius(radius);
      }
    }

    let marker = markers[agentId];
    if (!marker) {
      console.log(`rendering ${agentId}`);
      marker = markers[agentId] = L.marker(latLon, {title: agentId, alt: agentId})
      .addTo(featureGroup);
    } else {
      markers[agentId].setLatLng(latLon);
    }
    $(marker._icon).toggleClass('inactive-marker', !active);
    $(marker._icon).toggleClass('active-marker', active);
  }
}

function runApp(map, user, vueEl) {
  //let app = firebase.app();
  //console.log(app);
  //console.log(user);

  const db = firebase.database();
  const apikey = user.uid;
  console.log(`viewing ${apikey}`);

  function fetchFromVenueApi(path) {
    const fpUrl = CLOUD_FUNCTION_URL + '/api/'+apikey+'/'+path;
    return new Promise((resolve, reject) => {
      $.getJSON(fpUrl, data => resolve(data)).fail(reject);
    });
  }

  const floorPlanManager = new FloorPlanManager(map, fetchFromVenueApi);
  const floorPlanCache = floorPlanManager.floorPlanCache;
  const assetView = new AssetView(map);
  let assets = {};

  let floorPlanId, centerCoords;

  const vueApp = new Vue({
    el: vueEl,
    data: {
      agents: [],
      activeAgent: null
    },
    methods: {
      activateAgent: function (agentId) {
        console.log("activate agent "+agentId);
        this.activeAgent = agentId;
        drawAssets();
      }
    }
  });

  function drawAssets() {
    if (!floorPlanId) {
      floorPlanId = getFirst(assets, 'context.indooratlas.floorPlanId');
      console.log(`showing floor plan ${floorPlanId}`);
      floorPlanManager.onEnterFloorPlan(floorPlanId);
    }
    if (!centerCoords) {
      centerCoords = getFirst(assets, 'location.coordinates');
      if (centerCoords) {
       map.setView(L.latLng(centerCoords.lat, centerCoords.lon), /*ZOOM*/ 20);
      }
    }

    const vueModels = [];

    _.keys(assets).sort().forEach(agentId => {
      const pos = assets[agentId];
      if (_.get(pos, 'location.coordinates')) {
        const model = {
          agentId,
          pos,
          floorPlan: null,
          venue: null
        };
        vueModels.push(model);
        const context = _.get(pos, 'context.indooratlas');
        if (context.venueId) {
          floorPlanCache.getVenue(context.venueId, (venue) => {
            model.venue = venue;
          });
        }
        if (context.floorPlanId) {
          floorPlanCache.getFloorPlan(context.floorPlanId, (fp) => {
            model.floorPlan = fp;
          });
        }
        assetView.update(agentId, pos, vueApp.activeAgent === agentId);
      }
    });

    vueApp.agents = vueModels;
  }

  db.ref(`${apikey}/agent_locations`).on('value', (snapshot) => {
    assets = snapshot.val();
    drawAssets();
  });
}
