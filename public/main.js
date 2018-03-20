
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
  const markers = {};

  const featureGroup = L.featureGroup().addTo(map);

  const ASSET_COLORS = [
    [0, 0, 255],
    [255, 0, 0],
    [128, 255, 0],
    [0, 128, 255],
    [255, 255, 0]
  ];

  this.update = (agentId, pos) => {
    const coords = pos.location.coordinates;
    const radius = pos.location.accuracy;
    const latLon = [coords.lat, coords.lon];

    let circle = circles[agentId];

    if (!circle) {
      console.log(`rendering ${agentId}`);
      const col = ASSET_COLORS[_.keys(circles).length % ASSET_COLORS.length];
      const toRgb = col => `rgb(${col[0]}, ${col[1]}, ${col[2]})`;

      circle = L.circle(latLon, radius, {
        color: toRgb(col.map(c => Math.round(c/2))), // Stroke color
        opacity: 0.3, // Stroke opacity
        weight: 1, // Stroke weight
        fillColor: toRgb(col),
        fillOpacity: 0.02
      })
      .addTo(featureGroup);

      markers[agentId] = L.marker(latLon, {title: agentId, alt: agentId})
      .addTo(featureGroup);

      circles[agentId] = circle;
    } else {
      circle.setLatLng(latLon);
      circle.setRadius(radius);
      markers[agentId].setLatLng(latLon);
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
      console.log(`showing floor plan ${floorPlanId}`);
      floorPlanManager.onEnterFloorPlan(floorPlanId);
    }
    if (!centerCoords) {
      centerCoords = getFirst(assets, 'location.coordinates');
      if (centerCoords) {
       map.setView(L.latLng(centerCoords.lat, centerCoords.lon), /*ZOOM*/ 20);
      }
    }

    _.keys(assets).sort().forEach(agentId => {
      const pos = assets[agentId];
      if (_.get(pos, 'location.coordinates')) {
        assetView.update(agentId, pos);
      }
    });
  }

  db.ref(`${groupId}/agent_locations`).on('value', (snapshot) => {
    drawAssets(snapshot.val());
  });
}
