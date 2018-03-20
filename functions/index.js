const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const request = require('request');

admin.initializeApp({
  credential: admin.credential.cert(require("./serviceAccountKey.json")),
  databaseURL: functions.config().firebase.databaseURL
});

const app = express();

const iaTokens = require('./indooratlas-tokens.json');
const POS_API_ENDPOINT = 'https://positioning-api.indooratlas.com/v1/'
// secret group ID needed. Knowing this will grant read access to the data
const GROUP_ID = iaTokens.secretAssetGroup;

// Automatically allow cross-origin requests
app.use(cors());

app.put('/:agentId', (req, res) => {
  const agentId = req.params.agentId;
  // TODO: validate agent id...

  const msg = req.body;

  // empty request should be OK...
  if (!msg.wifis || msg.wifis.length === 0) {
    console.warn("empty wifi scan");
    return res.status(200).send('ok, but empty');
  }

  return request({
    method: 'POST',
    url: POS_API_ENDPOINT + 'locate?key='+iaTokens.apikey,
    json: msg
  }, (err, response, body) => {
    if (err || !response) {
      return res.status(500).send(err);
    }
    else if (response.statusCode >= 400) {
      return res.status(response.statusCode).send(body);
    }

    if (!body.location) {
      // location not detected
      console.log("location not detected");
      return res.status(200).send('ok, but not detected');
    }

    return admin.database()
      .ref(`${GROUP_ID}/agent_locations/${agentId}`)
      .set(body)
      .then((snapshot) => {
        return res.status(200).send('ok');
      })
      .catch((error) => {
        res.status(500).send(err);
      });
  });
});

// dummy authentication to disable listing all data
app.get('/auth/:groupId', (req, res) => {
  admin.auth().createCustomToken(req.params.groupId)
    .then((customToken) => {
      // Send token back to client
      return res.status(200).send(customToken);
    })
    .catch((error) => {
      console.error("Error creating custom token:", error);
    });
});

app.get('/floor_plans/:floorPlanId', (req, res) => {
  const fpId = req.params.floorPlanId;
  console.log("fetching floor plan "+fpId);
  const fpUrl = POS_API_ENDPOINT + 'floor_plans/'+fpId;
  request(fpUrl + '?key=' + iaTokens.apikey).pipe(res);
});

// Expose Express API as a single Cloud Function:
exports.agent = functions.https.onRequest(app);

// TODO: silly-method to not have only agent/auth
exports.api = functions.https.onRequest(app);
