
function drawAssets(map, assets) {
  console.log(assets);
  const orderedKeys = _.keys(assets).sort();
  const firstFloorPlan = orderedKeys
    .map(k => assets[k])
    .map(a => _.get(a, 'context.indooratlas.floorPlanId'))
    .filter(c => c)[0];

  if (firstFloorPlan) {
    console.log(firstFloorPlan);
  }
}

function getFirst(assets, path) {
  return _.keys(assets).sort().map(k => assets[k])
    .map(a => _.get(a, path))
    .filter(c => c)[0];
}

function AssetView(map) {
  const circles = {};
  const featureGroup = L.featureGroup().addTo(map);

  // http://leafletjs.com/reference.html#circle
  var accuracyCircleOptions =

  this.update = (agentId, pos) => {
    const coords = pos.location.coordinates;
    const radius = pos.location.accuracy;
    const latLon = [coords.lat, coords.lon];

    let circle = circles[agentId];
    if (!circle) {
      console.log(`rendering ${agentId}`);

      circle = L.circle(latLon, radius, {
        color: '#000080', // Stroke color
        opacity: 0.7, // Stroke opacity
        weight: 1, // Stroke weight
        fillColor: '#0000ff', // Fill color
        fillOpacity: 0.2 // Fill opacity
      })
      .addTo(featureGroup);
      circles[agentId] = circle;
    } else {
      circle.setLatLng(latLon);
      circle.setRadius(radius);
    }
  }
}

function runApp(map, user) {
  //let app = firebase.app();
  //console.log(app);
  //console.log(user);

  const db = firebase.database();
  const groupId = user.uid;
  console.log(`viewing group ${groupId}`);

  const floorPlanManager = new FloorPlanManager(map);
  const assetView = new AssetView(map);

  let floorPlanId, centerCoords;

  function drawAssets(assets) {
    if (!floorPlanId) {
      floorPlanId = getFirst(assets, 'context.indooratlas.floorPlanId');
      floorPlanManager.onEnterFloorPlan(floorPlanId);
    }
    if (!centerCoords) {
      centerCoords = getFirst(assets, 'location.coordinates');
      if (centerCoords) {
       map.setView(L.latLng(centerCoords.lat, centerCoords.lon), /*ZOOM*/ 20);
      }
    }
    _.forEach(assets, (pos, agentId) => {
      if (_.get(pos, 'location.coordinates')) {
        assetView.update(agentId, pos);
      }
    });
  }

  db.ref(`${groupId}/agent_locations`).on('value', (snapshot) => {
    drawAssets(snapshot.val());
  });
}
