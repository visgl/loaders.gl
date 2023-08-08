// TODO
/* eslint-disable */
// @ts-nocheck

/* global gapi */
import GoogleProvider from './google-provider';

// Array of API discovery doc URLs for APIs
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];

const SCOPES = ['https://www.googleapis.com/auth/drive.file']; // Restricts drive access to files created by kepler

// There is a selection of access scopes for Google Drive, e.g.
// - https://www.googleapis.com/auth/drive	See, edit, create, and delete all of your Google Drive files
// - https://www.googleapis.com/auth/drive.appdata	View and manage its own configuration data in your Google Drive
// - https://www.googleapis.com/auth/drive.file	View and manage Google Drive files and folders that you have opened or created with this app
// See https://developers.google.com/identity/protocols/googlescopes#drivev3

export default class GoogleDriveProvider extends GoogleProvider {
  /**
   * To access Google Drive, specify it in scopes
   * param scopes = ['https://www.googleapis.com/auth/drive.file'];
   */
  constructor(appName, clientId, appKey, scopes = SCOPES, discoveryDocs = DISCOVERY_DOC) {
    super({
      appName,
      clientId,
      appKey,
      name: 'Google Drive',
      discoveryDocs: DISCOVERY_DOCS,
      scopes
    });
  }

    // List files
  // If accessed with scope `https://www.googleapis.com/auth/drive.file` this will only list files created by this app
  async readdir(path) {
    try {
      gapi.client.drive.files
        .list({
          pageSize: 20,
          fields: 'nextPageToken, files(id, name)'
        })
        .then(response => {
          switch (response.status) {
            case 200:
              const files = response.result.files || [];
              return files;
            default:
              console.log('Google Drive File List, ' + response);
              return [];
          }
        });
    } catch (error) {
      console.error('Google Drive File List', error);
      return [];
    }
  }

  /**
   * Uploads a file to Google Drive
   * @param blob to upload
   * @param name if blob doesn't contain a file name, this field is used
   * @param isPublic define whether the file will be available pubblicaly once uploaded
   * @returns {Promise<void>}
   */
  async writeFile(path, data, options = {}) {
    const blob = data
    const {mimeType = 'application/json'} = options;

    // TODO - parse path into name and parents

    // gapi.client.drive doesn't seem to have good stubs for uploading, so we use the Google Drive REST API
    const metadata = {
      name: path, // Filename on Google Drive
      mimeType, // mimeType on Google Drive
      parents: ['root'] // Folder ID at Google Drive
    };

    // The body of the post request will be this form
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], {type: mimeType}));
    form.append('file', blob);
    const accessToken = gapi.auth.getToken().access_token; // Here gapi is used for retrieving the access token.

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
      {
        method: 'POST',
        headers: new Headers({Authorization: `Bearer ${accessToken}`}),
        body: form
      }
    );

    // TODO - check for errors?
    // TODO - return unprocessed response?
    return await response.json();
  }

  async createFile({blob, name, isPublic = true}) {
    name = 'kepler.json';
    try {
      console.log('Uploading file ', name);
      const gapiResponse = await gapi.client.drive.files.create({
        resource: {
          name,
          mimeType: 'application/json',
          parents: ['']
        }
      });

      switch (response.status) {
        case 200:
          var file = response.result;
          console.log('Uploaded file: ', file.id);
          console.log(await this.listFiles());
          break;
        default:
          console.error('Error uploading, ' + response);
          break;
      }

      // TBD - how to share files with Google Drive API?
      // https://github.com/googleapis/google-api-nodejs-client/blob/master/src/apis/drive/v3.ts
      // return !isPublic ? promise : promise.then(shareFile);
    } catch (gapiResponse) {
      const status = gapiResponse.status;
      const message = gapiResponse.result.error.message;
      console.error(`Google Drive upload failed ${name}: ${status} ${message}`);
    }
  }

  // @param parentId /some parentId of a folder under which to create the new folder
  async createFolder(name = 'New Folder', parentId = '') {
    try {
      const gapiResponse = await gapi.client.drive.files.create({
        resource: {
          name,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [parentId]
        }
      });

      switch (gapiResponse.status) {
        case 200:
          var file = response.result;
          console.log('Created Folder Id: ', file.id);
          break;
        default:
          console.error('Error creating the folder, ' + response);
          break;
      }
    } catch (gapiResponse) {
      const status = gapiResponse.status;
      const message = gapiResponse.result.error.message;
      console.error(`Google Drive upload failed ${name}: ${status} ${message}`);
    }
  }
}
