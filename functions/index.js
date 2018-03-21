const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const request = require('request');
const crypto = require('crypto');

function md5(obj) {
  return crypto.createHash('md5').update(JSON.stringify(obj)).digest("hex");
}

admin.initializeApp({
  credential: admin.credential.cert(require("./serviceAccountKey.json")),
  databaseURL: functions.config().firebase.databaseURL
});

const app = express();
const POS_API_ENDPOINT = 'https://positioning-api.indooratlas.com/v1/'

// Automatically allow cross-origin requests
app.use(cors());

app.put('/:apikey/report/:agentId', (req, res) => {
  const agentId = req.params.agentId;
  const apikey = req.params.apikey;

  // TODO: validate agent id...

  const msg = req.body;

  // empty request should be OK...
  if (!msg.wifis || msg.wifis.length === 0) {
    console.warn(`empty wifi scan from ${agentId}`);
    return res.status(200).send('ok, but empty');
  }

  return request({
    method: 'POST',
    url: POS_API_ENDPOINT + 'locate?key='+apikey,
    json: msg
  }, (err, response, body) => {
    if (err || !response) {
      console.error(`pos API error ${err} for ${agentId}`);
      return res.status(500).send(err);
    }
    else if (response.statusCode >= 400) {
      console.error(`client error ${response.statusCode} ${body} for ${agentId}`);
      return res.status(response.statusCode).send(body);
    }

    if (!body.location) {
      // location not detected
      console.log(`location of ${agentId} not detected`);
      return res.status(200).send('ok, but not detected');
    }

    return admin.database()
      .ref(`${apikey}/agent_locations/${agentId}`)
      .set(body)
      .then((snapshot) => {
        console.log(`new location for ${agentId} (${md5(msg)} -> ${md5(body)})`);
        return res.status(200).send('ok');
      })
      .catch((error) => {
        res.status(500).send(err);
      });
  });
});

// dummy authentication to disable listing all data
app.post('/:apikey/auth', (req, res) => {
  admin.auth().createCustomToken(req.params.apikey)
    .then((customToken) => {
      // Send token back to client
      console.log(`authentication token for ${req.params.apikey}`);
      return res.status(200).send(customToken);
    })
    .catch((error) => {
      console.error("Error creating custom token:", error);
    });
});

app.get('/:apikey/floor_plans/:floorPlanId', (req, res) => {
  const fpId = req.params.floorPlanId;
  const fpUrl = POS_API_ENDPOINT + 'floor_plans/'+fpId;
  console.log(`get floor plan ${fpId}`);
  request(fpUrl + '?key=' + req.params.apikey).pipe(res);
});

app.get('/:apikey/venues/:venueId', (req, res) => {
  const venueId = req.params.venueId;
  const fpUrl = POS_API_ENDPOINT + 'venues/'+venueId;
  console.log(`get venue ${venueId}`);
  request(fpUrl + '?key=' + req.params.apikey).pipe(res);
});

exports.api = functions.https.onRequest(app);
