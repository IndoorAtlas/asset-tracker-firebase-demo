// rather stupid and not very secure

const CLOUD_FUNCTION_URL = 'https://us-central1-ia-asset-tracker-demo.cloudfunctions.net';

function getGroupId() {
  let groupId = window.location.hash;
  if (groupId.length > 0) {
    return decodeURIComponent(groupId.substring(1));
  } else {
    alert("authentication info missing from URL");
  }
}

function signIn(groupId, callback) {
  console.log("signing in");
  $.get(CLOUD_FUNCTION_URL+'/api/auth/'+groupId, function (token) {
    console.log("got token, continuing with firebase sign in");
    firebase.auth().signInWithCustomToken(token).catch(function(error) {
      alert(JSON.stringify(error));
    }).then(callback);
  })
  .fail(function() {
    alert( "error" );
  });
}

firebase.auth().onAuthStateChanged(function(user) {
  const groupId = getGroupId();
  const startApp = user => mainApp.setUser(user);

  if (user && user.uid === groupId) {
    console.log("authenticated correctly");
    startApp(user);
  } else {
    signIn(groupId, startApp);
  }
});
