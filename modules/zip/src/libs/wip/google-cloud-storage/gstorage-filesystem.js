// MIT LICENSE
// Copyright 2019 Unfolded, Inc.

export default class GStorage {
  /**
   * Create a new Google Storage FileSystem
   * Note: App need to inject google cloud storage instance
   * @example
   * import {Storage} from '@google-cloud/storage';
   * new GStorage(new Storage(), 'MY BUCKET NAME)
   */
  constructor(storage_, bucketName) {
    this.storage = storage_;
    this.bucketName = bucketName;
    this.counter = 0;
    this.fetch = this.fetch.bind(this);
  }

  async fetch(path) {
    // TODO - Can we populate Response with headers?
    // TODO - error handling when not present, 404 etc
    return new Response(this.createReadStream(path));
  }

  // Resource creation

  /**
   * Creates a read stream for given fileName in bucketName.
   * @param {String} fileName Name of the file to create the stream for.
   * @returns {ReadableStream} Readable stream of files contents.
   */
  createReadStream(fileName) {
    const file = this.storage.bucket(this.bucketName).file(fileName);
    return file.createReadStream();
  }

  // Save a file to cloud storage (ATOMIC SAVE)
  async writeFile(path, data, options = {}) {
    const byteLength = data.length || data.byteLength;

    // RESUMABLE UPLOADS
    // Google Cloud: When uploading less than 10MB, it is recommended that resumable feature is disabled.
    // Update: Looks like resumable uploads are now off by default, and require extra config to work
    // https://github.com/googleapis/nodejs-storage/issues/232
    // https://github.com/googleapis/gcs-resumable-upload/#how-it-works
    if (byteLength < 1e7 && !('resumable' in options)) {
      options.resumable = false;
    }

    const file = this.storage.bucket(this.bucketName).file(path);

    return await file.save(data, options);
  }

  async unlink(path) {
    const file = this.storage.bucket(this.bucketName).file(path);
    return await file.delete();
  }

  // CLOUD FILE API

  // Make a file public or private
  //  (public is a reserved word, use underscore...)
  async makePublic(path, public_ = true) {
    const file = this.storage.bucket(this.bucketName).file(path);
    return (await public_) ? file.makePublic() : file.makePrivate();
  }

  // Return signed urls, they are pre-authenticated and only valid for a short time...
  // NOTE: this does NOT validate the user should be able to access the file
  //  - `contentType` if provided, the resulting URL must be requested with that `Content-Type` header
  async makeSignedUrl(path, action, contentType) {
    // TODO - not sure this check belongs in generic wrapper library
    // File name should be a 'user accessible' location
    if (!path.startsWith('userdata/')) {
      throw new Error('Assertion failed. Path prefix is incorrect.');
    }

    // TODO: How to specify how much data can be uploaded for write queries?
    const options = {
      action,
      expires: Date.now() + 1000 * 60 * 30, // 30 minutes
      version: 'v4'
    };

    if (contentType) {
      options.contentType = contentType;
    }

    const file = this.storage.bucket(this.bucketName).file(path);
    // @ts-ignore TS2345: Argument of type '{ action: any; expires: number; version: string; contentType: string; }' is not assignable to parameter of type 'GetSignedUrlConfig'.
    const [url] = await file.getSignedUrl(options);
    return url;
  }

  /*
  // UPLOAD a file to cloud storage (goal is to accept streams and async iterators)
  // TODO - this is still not working as expected - seemingly saves too many bytes>
  async uploadFile(path, data) {
    // TODO - it does not seem well documented...
    // but it appears to possible to avoid writing to local file using Node.js streams
    // https://stackoverflow.com/questions/44945376/how-to-upload-an-in-memory-file-data-to-google-cloud-storage-using-nodejs

    // Create a temporary file since this is what the google storage API requires
    const temporaryFileName = `/tmp/upload${this.counter++}`;
    await fs.writeFileSync(temporaryFileName, data);

    let fileUrl;
    try {
      fileUrl = await this.storage.bucket(this.bucketName).upload(temporaryFileName, {
        destination: path,
        // Support for HTTP requests made with `Accept-Encoding: gzip`
        gzip: true,
        // By setting the option `destination`, you can change the name of the
        // object you are uploading to a bucket.
        metadata: {
          // Enable long-lived HTTP caching headers
          // Use only if the contents of the file will never change
          // (If the contents will change, use cacheControl: 'no-cache')
          // cacheControl: 'public, max-age=31536000',
        }
      });
    } finally {
      // Remove the temporary file
      fs.unlinkSync(temporaryFileName);
    }
    return fileUrl;
  }

  /**
   * STATUS

  * await saveFile(`${location}.save`, data);
  * WORKS:

  * await saveFile(`${location}.resumable`, data, {resumable: true});
  * ISSUE Resumable requires HOME directory setup

  * await uploadFile2`${location}.upload`, data);
  * ISSUE uploadFile currently uploads too much data...
  */
}
