// rather stupid and not very secure

const CLOUD_FUNCTION_URL = 'https://us-central1-ia-asset-tracker-demo.cloudfunctions.net';

function getApikey() {
  let apikey = window.location.hash;
  if (apikey.length > 0) {
    return decodeURIComponent(apikey.substring(1));
  } else {
    alert("authentication info missing from URL");
  }
}

function signIn(apikey, callback) {
  console.log("signing in");
  $.post(CLOUD_FUNCTION_URL+'/api/'+apikey+"/auth", function (token) {
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
  const apikey = getApikey();
  const startApp = user => mainApp.setUser(user);

  if (user && user.uid === apikey) {
    console.log("authenticated correctly");
    startApp(user);
  } else {
    signIn(apikey, startApp);
  }
});
