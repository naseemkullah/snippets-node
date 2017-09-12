const functions = require("firebase-functions");
const firestore = require("firebase-functions/lib/providers/datastore");
const Firestore = require("@google-cloud/firestore");

const algoliasearch = require("algoliasearch");

// [START init_algolia]
// Initialize Algolia, requires installing Algolia dependencies:
// https://www.algolia.com/doc/api-client/javascript/getting-started/#install
//
// App ID and API Key are stored in functions config variables
const ALGOLIA_ID = functions.config().algolia.app_id;
const ALGOLIA_ADMIN_KEY = functions.config().algolia.api_key;

const ALGOLIA_INDEX_NAME = "notes";
const client = algoliasearch(ALGOLIA_ID, ALGOLIA_ADMIN_KEY);
// [END init_algolia]

// Initialize Firestore
const firestoreOptions = {
  projectId: process.env.GCLOUD_PROJECT
};
const db = new Firestore(firestoreOptions);

// [START update_index_function]
// Update the search index every time a blog post is written.
exports.onNoteCreated = firestore.document("notes/{noteId}").onCreate(event => {
  // Get the note document
  const note = event.data.data();

  // Add an "objectID" field which Algolia requires
  note.objectID = event.params.postId;

  // Write to the algolia index
  const index = client.initIndex(ALGOLIA_INDEX_NAME);
  return index.saveObject(note);
});
// [END update_index_function]

// [START get_algolia_user_token]
const express = require("express");
const admin = require("admin");
const cors = require("cors");

function getFirebaseUser(req, res, next) {
  console.log("Check if request is authorized with Firebase ID token");

  if (
    !req.headers.authorization ||
    !req.headers.authorization.startsWith("Bearer ")
  ) {
    console.error(
      "No Firebase ID token was passed as a Bearer token in the Authorization header.",
      "Make sure you authorize your request by providing the following HTTP header:",
      "Authorization: Bearer <Firebase ID Token>"
    );
    res.status(403).send("Unauthorized");
    return;
  }

  let idToken;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    console.log("Found 'Authorization' header");
    // Read the ID Token from the Authorization header.
    idToken = req.headers.authorization.split("Bearer ")[1];
  }

  admin
    .auth()
    .verifyIdToken(idToken)
    .then(decodedIdToken => {
      console.log("ID Token correctly decoded", decodedIdToken);
      req.user = decodedIdToken;
      next();
    })
    .catch(error => {
      console.error("Error while verifying Firebase ID token:", error);
      res.status(403).send("Unauthorized");
    });
}

const app = express();
app.use(cors({ origin: true }));
app.use(getFirebaseUser);
app.get("/", (req, res) => {
  const params = {
    hitsPerPage: 20,
    filters: `author:${req.user.user_id}`,
    userToken: req.user.user_id
  };
  const key = search.generateSecuredApiKey(ALGOLIA_SEARCH_KEY, params);
  res.json({ key });
});

exports.getSearchKey = functions.https.onRequest(app);
// [END get_algolia_user_token]