const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.compose'];
const TOKEN_PATH = './util/token.json';
const Base64 = require('js-base64').Base64;
var auth;

fs.readFile('./util/credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  authorize(JSON.parse(content));
});

function authorize(credentials) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  auth = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0]);

  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(auth);
    auth.setCredentials(JSON.parse(token));
  });
}

function getNewToken(auth) {
  const authUrl = auth.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    auth.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      auth.setCredentials(token);
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
    });
  });
}

exports.sendMessage = async(to, message) => {
  await sendMessage("me", "a", to, message);
  return 1;
}


function sendMessage(userId, email, to, message) {
  console.log("called")
  email = Base64.btoa(
    "From: hiiambhanu@gmail.com\r\n" +
    "To:" + to + "\r\n" +
    "Subject: Price Drop \r\n\r\n" +

    "There has been a price drop in your favourite product. Check out the new price of "+ message.price + " at "+  message.url + "."
  ).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const gmail = google.gmail({ version: 'v1', auth });

  var request = gmail.users.messages.send({
    'userId': userId,
    'resource': {
      'raw': email
    }
  }).then((resp) => console.log(resp))
    .catch((err) => console.log(err));
}


exports.list = async () => {
  res = await listLabels(auth);
  return res;
};
