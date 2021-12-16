// Example express application adding the parse-server module to expose Parse
// compatible API routes.
const { FirebaseAuthAdapter } = require('parse-server-firebase-auth');
const express = require('express');
const { default: ParseServer, ParseGraphQLServer } = require('parse-server');
const path = require('path');
const args = process.argv || [];
const test = args.some(arg => arg.includes('jasmine'));

const databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;

if (!databaseUri) {
  console.log('DATABASE_URI not specified, falling back to localhost.');
}
const config = {
  databaseURI:
    databaseUri ||
    'mongodb+srv://chrisk8er:UTW77v4jMLn!Cps@ecommercecluster.tfy3p.mongodb.net/warongdb?retryWrites=true&w=majority',
  cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
  appId: process.env.APP_ID || 'myAppId',
  masterKey: process.env.MASTER_KEY || 'myMasterKey', //Add your master key here. Keep it secret!
  serverURL: process.env.SERVER_URL || 'http://localhost:1337/parse', // Don't forget to change to https if needed
  liveQuery: {
    classNames: ['Posts', 'Comments'], // List of classes to support for query subscriptions
  },
  auth: {
    firebase: new FirebaseAuthAdapter(),
  },
};
// Client-keys like the javascript key or the .NET key are not necessary with parse-server
// If you wish you require them, you can set them as options in the initialization above:
// javascriptKey, restAPIKey, dotNetKey, clientKey

const app = express();

// Serve static assets from the /public folder
app.use('/public', express.static(path.join(__dirname, '/public')));

// Serve the Parse API on the /parse URL prefix
const mountPath = process.env.PARSE_MOUNT || '/parse';
if (!test) {
  const api = new ParseServer(config);

  // instantiate ParseGraphQL Server
  const parseGraphQLServer = new ParseGraphQLServer(api, {
    graphQLPath: '/graphql',
  });

  app.use(mountPath, api.app);
  parseGraphQLServer.applyGraphQL(app); // Mounts the GraphQL API
}

// Parse Server plays nicely with the rest of your web routes
app.get('/', function (req, res) {
  res.status(200).send('Made with ❤️ by chrisk8er');
});

// There will be a test page available on the /test path of your server url
// Remove this before launching your app
app.get('/test', function (req, res) {
  res.sendFile(path.join(__dirname, '/public/test.html'));
});

const port = process.env.PORT || 1337;
if (!test) {
  const httpServer = require('http').createServer(app);
  httpServer.listen(port, function () {
    console.log('REST API running on port ' + port + '.');
    console.log('GraphQL API running on http://your-server-ip:' + port + '/graphql');
    //     console.log('GraphQL Playground running on http://localhost:1337/playground');
  });
  // This will enable the Live Query real-time server
  ParseServer.createLiveQueryServer(httpServer);
}

module.exports = {
  app,
  config,
};
