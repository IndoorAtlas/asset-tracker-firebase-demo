function getApikey() {
  let apikey = window.location.hash;
  if (apikey.length > 0) {
    return decodeURIComponent(apikey.substring(1));
  } else {
    alert("authentication info missing from URL");
  }
}

// If a Firebase app in open in two browser windows, nasty race conditions can
// occurr if they try to use different login credentials. This attempts to
// handle the situation reasonably
let firstSignInAttempt = true;

function signIn(apikey, callback) {
  if (!firstSignInAttempt) return;
  firstSignInAttempt = false;

  console.log("signing in");
  $.post(CLOUD_FUNCTION_URL+'/api/'+apikey+"/auth", function (token) {
    console.log("got token, continuing with firebase sign in");
    firebase.auth().signInWithCustomToken(token).catch(function(error) {
      alert(JSON.stringify(error));
    }).then(callback);
  })
  .fail(function() {
    alert( "authentication error" );
  });
}

firebase.auth().onAuthStateChanged(function(user) {
  if (!firstSignInAttempt) return;
  const apikey = getApikey();
  const startApp = (u) => mainApp.setUser(u);

  if (user) {
    if (user.uid === apikey) {
      console.log("authenticated correctly");
      firstSignInAttempt = false;
      startApp(user);
    } else {
      if (firstSignInAttempt) {
        console.warn(`changing sign-in api key ${user.uid} -> ${apikey}`);
        firebase.auth().signOut().then(() => {
          console.log("logged out");
          signIn(apikey, startApp);
        });
      }
    }
  } else {
    signIn(apikey, startApp);
  }
});
