# IndoorAtlas asset tracker demo with Firebase

### Usage

First choose an API_KEY with positioning API scope enabled.

Point the agents to use the endpoint

    https://us-central1-ia-asset-tracker-demo.cloudfunctions.net/api/$API_KEY

so that they PUT locations to

    https://us-central1-ia-asset-tracker-demo.cloudfunctions.net/api/$API_KEY/agent/$AGENT_ID

Then the agents related to that API_KEY can be inspected in the web address

    https://ia-asset-tracker-demo.firebaseapp.com/#$API_KEY

### Setup

 1. `npm install -g firebase-tools`
 1. Make sure you have access to this project on Firebase
 1. `firebase login`
 1. Get a [Firebase Service Account key](https://firebase.google.com/docs/admin/setup#add_firebase_to_your_app)
and download it as `function/serviceAccountKey.json` (which is gitignored)

### Deployment

    firebase deploy
