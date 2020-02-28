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

// In practice, the lambda containers are reused for some time so this cache works
const apiKeyCache = {
  valid: {},
  invalid: {}
};

// Checks that an IndoorAtlas API key has access to positioning API
function validateIndoorAtlasApiKey(apikey) {
  console.log(`validating API key ${apikey}`);
  return new Promise((resolve, reject) => {
    if (apiKeyCache.valid[apikey]) {
      console.log("API key was valid (cached)");
      return resolve('ok');
    } else if (apiKeyCache.invalid[apikey]) {
      console.log("API key is still invalid (cached)");
      return reject(new Error('forbidden'));
    }

    return request(INDOORATLAS_POS_API_ENDPOINT + 'venues?key=' + apikey, (err, response, body) => {
      if (err || !response) {
        console.error(`authentication pos API error ${err}`);
        return reject(new Error('authentication error'));
      }
      else if (response.statusCode >= 400) {
        console.warn(`authentication HTTP error ${response.statusCode} ${JSON.stringify(body)}`);
        apiKeyCache.invalid[apikey] = true;
        return reject(new Error('forbidden'));
      }
      console.log("valid IndoorAtlas API key");
      apiKeyCache.valid[apikey] = true;
      resolve('ok');
    });
  });
}

// Automatically allow cross-origin requests
app.use(cors());

function stripAgentId(agentId) {
  // Replace Forbidden Firebase characters with underscores
  return agentId.replace(/[.$[\]#/]/g, '_');
}

function stripAndValidateResponseBody(body) {
  // TODO: should use a JSON schema validator instead
  // NOTE: Fields set to "undefined" will break Firebase, therefore all
  // missing fields need to be set to null instead
  try {
    let {
      location: { accuracy, floorNumber, coordinates: { lat, lon } },
      context = null
    } = body;

    Object.entries({ lat, lon, accuracy, floorNumber }).forEach(([key, value]) => {
      if (typeof value !== 'number') throw Error(`${key} = ${value} is not a number`);
    });

    if (context) {
      const { indooratlas: { floorPlanId = null, traceId = null, venueId = null } = {}  } = context;
      Object.entries({ floorPlanId, traceId, venueId }).forEach(([key, value]) => {
        if (value && typeof value !== 'string') throw Error(`${key} = ${value} is not a string`);
      });
      context = { indooratlas: { floorPlanId, traceId, venueId }  };
    }

    return {
      body: {
        location: {
          accuracy,
          floorNumber,
          coordinates: { lat, lon }
        },
        context
      }
    };
  } catch (error) {
    return { error: error.message };
  }
}

app.put('/:apikey/report/:agentId', (req, res) => {
  const agentId = stripAgentId(req.params.agentId);
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

    const { error } = stripAndValidateResponseBody(body);
    if (error) return res.status(500).send(error);

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

app.put('/:apikey/locations/:agentId', (req, res) => {
  const apikey = req.params.apikey;
  return validateIndoorAtlasApiKey(apikey).then(() => {
    const agentId = stripAgentId(req.params.agentId);
    const { body, error } = stripAndValidateResponseBody(req.body);

    // TODO: validate better
    if (error) {
      // location not detected
      console.log(`missing or invalid location for ${agentId}: ${error}`);
      return res.status(400).send(`invalid or missing location ${error}`);
    }

    return admin.database()
      .ref(`${apikey}/agent_locations/${agentId}`)
      .set(body)
      .then((snapshot) => {
        console.log(`new directly reported location for ${agentId} (${md5(body)})`);
        return res.status(200).send('ok');
      })
      .catch(err => {
        console.error(err);
        return res.status(500).send('Internal server error');
      });
  }, err => {
    return res.status(403).send(err);
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
