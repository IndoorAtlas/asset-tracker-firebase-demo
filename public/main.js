function startApp(user) {
  //let app = firebase.app();
  //console.log(app);
  //console.log(user);

  const db = firebase.database();
  const groupId = user.uid;

  console.log(`viewing group ${groupId}`);

  db.ref(`${groupId}/agent_messages`).on('value', (snapshot) => {
    console.log(snapshot.val());
  });
}
