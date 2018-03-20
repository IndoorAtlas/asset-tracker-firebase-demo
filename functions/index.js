const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const request = require('request');
const crypto = require('crypto');

function md5(obj) {
  return crypto.createHash('md5').update(JSON.stringify(obj)).digest("hex");
}

const appOptions = JSON.parse(process.env.FIREBASE_CONFIG);
appOptions.credential = admin.credential.cert(require("./serviceAccountKey.json"));
admin.initializeApp(appOptions);

const app = express();
const INDOORATLAS_POS_API_ENDPOINT = 'https://positioning-api.indooratlas.com/v1/'

// Checks that an IndoorAtlas API key has access to positioning API
function validateIndoorAtlasApiKey(apikey) {
  console.log(`validating API key ${apikey}`);
  return new Promise((resolve, reject) => {
    request(INDOORATLAS_POS_API_ENDPOINT + 'venues?key=' + apikey, (err, response, body) => {
      if (err || !response) {
        console.error(`authentication pos API error ${err}`);
        reject(new Error('authentication error'));
      }
      else if (response.statusCode >= 400) {
        console.warn(`authentication HTTP error ${response.statusCode} ${JSON.stringify(body)}`);
        reject(new Error('forbidden'));
      }
      console.log("valid IndoorAtlas API key");
      resolve('ok');
    });
  });
}

// Automatically allow cross-origin requests
app.use(cors());

app.put('/:apikey/report/:agentId', (req, res) => {
  const agentId = req.params.agentId;
  const apikey = req.params.apikey;

  const msg = req.body;

  // empty request should be OK...
  if (!msg.wifis || msg.wifis.length === 0) {
    console.warn(`empty wifi scan from ${agentId}`);
    return res.status(200).send('ok, but empty');
  }

  return request({
    method: 'POST',
    url: INDOORATLAS_POS_API_ENDPOINT + 'locate?key='+apikey,
    json: msg
  }, (err, response, body) => {
    if (err || !response) {
      console.error(`pos API error ${err} for ${agentId}`);
      return res.status(500).send(err);
    }
    else if (response.statusCode >= 400) {
      console.warn(`client error ${response.statusCode} ${JSON.stringify(body)} for ${agentId}`);
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

// use IndoorAtlas positioning API for access control
app.post('/:apikey/auth', (req, res) => {
  const uid = req.params.apikey;
  admin.auth().getUser(uid)
    .catch(err => {
      console.log(`login attempt as a new user ${uid}`);
      if (err.code === 'auth/user-not-found') {
        return validateIndoorAtlasApiKey(uid);
      } else {
        console.error(`unexpected error ${err.code}`);
        throw new Error('authentication error');
      }
    })
    .then(() => {
      return admin.auth().createCustomToken(uid);
    })
    .then((customToken) => {
      // Send token back to client
      console.log(`successful login as ${uid}`);
      return res.status(200).send(customToken);
    })
    .catch((error) => {
      console.warn(`Login error for ${uid}: ${error}`);
      res.status(403).send(error);
    });
});

app.get('/:apikey/floor_plans/:floorPlanId', (req, res) => {
  const fpId = req.params.floorPlanId;
  const fpUrl = INDOORATLAS_POS_API_ENDPOINT + 'floor_plans/'+fpId;
  console.log(`get floor plan ${fpId}`);
  request(fpUrl + '?key=' + req.params.apikey).pipe(res);
});

app.get('/:apikey/venues/:venueId', (req, res) => {
  const venueId = req.params.venueId;
  const fpUrl = INDOORATLAS_POS_API_ENDPOINT + 'venues/'+venueId;
  console.log(`get venue ${venueId}`);
  request(fpUrl + '?key=' + req.params.apikey).pipe(res);
});

exports.api = functions.https.onRequest(app);
