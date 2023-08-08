// @ts-nocheck

import GoogleLoginProvider from '../login-providers/google-login-provider';

// This is a base class for a kepler.gl CloudProvider based on Google account login
export default class GoogleProvider {
  // Create a new Google Account provider
  // To access Google Drive, specify it in scopes
  // @param scopes = ['https://www.googleapis.com/auth/drive'];
  constructor({appName, name, icon, clientId, discoveryDocs, scopes = []}) {
    // All cloud-providers providers must implement the following properties
    this.appName = appName;
    this.name = name;
    this.icon = icon;

    this.accessToken = null;

    // Init the google account
    this.googleAccount = new GoogleLoginProvider({
      clientId,
      discoveryDocs,
      scopes,
      onLoginChange: this._onLoginChange.bind(this)
    });
  }

  /**
   * This method will handle the oauth flow by performing the following steps:
   * - Opening a popup window and letting the user select google account
   * - If already signed in to the browser, the window will disappear immediately
   * @returns {Promise<void>}
   */
  async login(onLoginSuccess) {
    const googleUser = await this.googleAccount.login();
    onLoginSuccess(this.name, googleUser, this.user);
    // TODO - also needs a callback to update the app UI...
  }

  /**
   * Provides the current auth token.
   * @returns {any}
   */
  getAccessToken() {
    const token = this.accessToken;
    return (token || '') !== '' ? token : null;
  }

  // FOR DERIVED CLASSES
  _onLoginChange(user) {
    this.user = user;
    this.accessToken = user ? user.accessToken : null;
  }
}
