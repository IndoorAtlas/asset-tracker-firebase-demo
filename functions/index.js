const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

admin.initializeApp(functions.config().firebase); // firebase DB
const app = express();

// Automatically allow cross-origin requests
//app.use(cors());

app.put('/:agentId', (req, res) => {
  const agentId = req.params.agentId;

  const msg = req.body;

  return admin.database()
    .ref(`agent_messages/${agentId}`)
    .set(msg)
    .then((snapshot) => {
      return res.status(200).send('ok');
    })
    .catch((error) => {
      res.status(500).send(err);
    });
});

// Expose Express API as a single Cloud Function:
exports.agent = functions.https.onRequest(app);
