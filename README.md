# IndoorAtlas asset tracker demo with Firebase

### Setup instructions

 1. Ensure [IndoorAtlas positioning](https://indooratlas.freshdesk.com/support/solutions/articles/36000079590-indooratlas-positioning-overview)
    has been successfully deployed
 1. Create a new project on [Firebase](https://firebase.google.com/), e.g., "YOUR_ASSET_TRACKER_DEMO".
 1. Create a [Mapbox](https://www.mapbox.com/) access token and set it in `public/config.js` (see `config.js.example`)
 1. Also set your cloud functions URL in `public/config.js`
 1. Run in this folder `npm install -g firebase-tools`
 1. `firebase login`
 1. Associate this folder with the new Firebase project
   * `firebase use --add`
   * select YOUR_ASSET_TRACKER_DEMO from the list
   * alias: type "default"
 1. `cd functions && npm install`
 1. Get a [Firebase Service Account key](https://firebase.google.com/docs/admin/setup#add_firebase_to_your_app)
and download it as `function/serviceAccountKey.json` (which is gitignored)
 1. `firebase deploy`

### Usage

First choose an IndoorAtlas API_KEY with [positioning API scope](https://indooratlas.freshdesk.com/support/solutions/articles/36000051260-positioning-rest-api-overview) enabled.

Point the agents to use the endpoint

    https://us-central1-YOUR_ASSET_TRACKER_DEMO.cloudfunctions.net/api/$API_KEY

so that they PUT locations to

    https://us-central1-YOUR_ASSET_TRACKER_DEMO.cloudfunctions.net/api/$API_KEY/report/$AGENT_ID

Then the agents related to that API_KEY can be inspected in the web address

    https://YOUR_ASSET_TRACKER_DEMO.firebaseapp.com/#$API_KEY

### Notes

This project uses [IndoorAtlas positioning API](https://indooratlas.freshdesk.com/support/solutions/articles/36000051260-positioning-rest-api-overview)
through Firebase functions, which needs a **paid Firebase plan** ("Flame"),
because Firebase does not let one use external cloud services with a free plan.

Authentication is based on IndoorAtlas API keys: A new Firebase user is created
for each API key (see `public/custom-auth.js` and the `/auth` resource) and
Firebase ensures that the users can only access the data associated with the
API key they provide in the when viewing the app. If the user does not know a
valid API key, the cannot access any data.

However, the API key is the only secret part of the system and knowing it gives

 * Access to [IndoorAtlas Positioning API](https://docs.indooratlas.com/positioning-api.html)
    - read floor plan and venue data on the account
    - ability to radio-locate oneself in the mapped areas of the account
 * Ability to read all agent locations reported using the same API key
 * Ability to report one's location as a new agent
 * Ability to impersonate any agent reporting with the same API key

In particular, there is not agent-specific authentication so using this demo
backend in production is not recommeded without implementing more sophisticated
access control.
