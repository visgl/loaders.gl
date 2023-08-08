// Helper functions for gapi, Google's JavaScript API
// - Ensures async functions return clean, "re-entrant" promises
// - Functions for some additional REST endpoints not currently covered by JS API.

/* eslint-disable camelcase */
// @ts-nocheck TODO

/* global gapi */
/* global document */
/* global fetch */

// We load `gapi` at run-time from this URL
const GOOGLE_API_URL = 'https://apis.google.com/js/api.js';

let gapiPromise = null;
let gapiClientLoadPromise = null;
let gapiClientInitPromise = null;
let auth2Promise = null;

// GAPI

// Load the GAPI script re-entrantly
// Alternatively, add <script src="https://apis.google.com/js/api.js"></script> to your html
export async function loadGapi() {
  gapiPromise = gapiPromise || (await loadScript(GOOGLE_API_URL));
  return await gapiPromise;
}

// GAPI.CLIENT

// Load the GAPI JS client library re-entrantly
export async function loadGapiClient() {
  // gapi.load is supposed return a thenable object, but await does not seem to work on it so wrap in Promise instead
  gapiClientLoadPromise =
    gapiClientLoadPromise ||
    (await new Promise((resolve, reject) =>
      gapi.load('client', {callback: resolve, onerror: reject})
    ));
  return await gapiClientLoadPromise;
}

// Intialize the GAPI JS client library
// Usually, the minimum argument is `discoveryDocs`: `gapi.client.init({discoveryDocs})`
// If called multiple times, only the options from the first call are applied.
export async function initGapiClient(options) {
  await loadGapi();
  await loadGapiClient();

  gapiClientInitPromise = gapiClientInitPromise || (await gapi.client.init(options));
  return await gapiClientInitPromise;
}

// GAPI.AUTH2

// Initialize gapi.auth2
// Note: Not always used. Can't use `gapi.auth2.init()` and `gapi.auth2.authorize()` at the same time!
export async function auth2Initialize(options) {
  auth2Promise = auth2Promise || gapi.auth2.init(options);
  return await auth2Promise;
}

// NOTE: We are not using async/await syntax here because:
// - babel's "heavy-handed" transpilation of `async/await` moves this code into a callback
// - but it needs to run directly in the `onClick` handler since it opens a popup
// - and popups that are not a direct result of the user's actions are typically blocked by browser settings.
export function auth2Signin(options) {
  return gapi.auth2.getAuthInstance().signIn(options);
}

export function auth2Authorize(authOptions) {
  return new Promise((resolve, reject) =>
    gapi.auth2.authorize(authOptions, authResponse => {
      const {error} = authResponse;
      if (error) {
        // TODO - more info...
        reject(new Error(error));
        console.error('GOOGLE API LOGIN ERROR', error); // eslint-disable-line
        return;
      }
      resolve(authResponse);
    })
  );
}

// When using `gapi.auth2.authorize`, the user profile needs to be manually fetched
export async function auth2GetUserInfo({access_token}) {
  const response = await fetch('https://www.googleapis.com/oauth2/v1/userinfo', {
    headers: {
      Authorization: `Bearer ${access_token}`
    }
  });

  const userInfo = await response.json();
  return userInfo;
}

// PRIVATE UTILITIES

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}
