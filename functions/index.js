const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

admin.initializeApp({
  credential: admin.credential.cert(require("./serviceAccountKey.json")),
  databaseURL: functions.config().firebase.databaseURL
});

const app = express();

// secret group ID needed. Knowing this will grant read access to the data
const GROUP_ID = '14040f5e-c8aa-4795-9e99-73492fa392e7';

// Automatically allow cross-origin requests
app.use(cors());

app.put('/:agentId', (req, res) => {
  const agentId = req.params.agentId;
  // TODO: validate agent id...

  const msg = req.body;

  return admin.database()
    .ref(`${GROUP_ID}/agent_messages/${agentId}`)
    .set(msg)
    .then((snapshot) => {
      return res.status(200).send('ok');
    })
    .catch((error) => {
      res.status(500).send(err);
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

// Expose Express API as a single Cloud Function:
exports.agent = functions.https.onRequest(app);

// TODO: silly-method to not have only agent/auth
exports.api = functions.https.onRequest(app);
