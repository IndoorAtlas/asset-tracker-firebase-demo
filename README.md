# IndoorAtlas asset tracker demo with Firebase

### Setup

 1. `npm install -g firebase-tools`
 1. Make sure you have access to this project on Firebase
 1. `firebase login`
 1. Get a [Firebase Service Account key](https://firebase.google.com/docs/admin/setup#add_firebase_to_your_app)
and download it as `function/serviceAccountKey.json` (which is gitignored)
 1. Create `functions/indooratlas-tokens.json` utilizing the example

### Deployment

    firebase deploy
