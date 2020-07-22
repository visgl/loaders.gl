import {isResponse, isBlob} from '../../javascript-utils/is-type';
import {parseMIMEType, parseMIMETypeFromURL} from './mime-type-utils';

const QUERY_STRING_PATTERN = /\?.*/;

export function getResourceUrlAndType(resource) {
  // If resource is a response, it contains the information directly
  if (isResponse(resource)) {
    const contentType = parseMIMEType(resource.headers.get('content-type'));
    const urlType = parseMIMETypeFromURL(resource.url);
    return {
      url: stripQueryString(resource.url || ''),
      type: contentType || urlType || null
    };
  }

  // If the resource is a Blob or a File (subclass of Blob)
  if (isBlob(resource)) {
    return {
      // File objects have a "name" property. Blob objects don't have any
      // url (name) information
      url: stripQueryString(resource.name || ''),
      type: resource.type || ''
    };
  }

  if (typeof resource === 'string') {
    return {
      // TODO this could mess up data URL but it doesn't matter as it is just used for inference
      url: stripQueryString(resource),
      // If a data url
      type: parseMIMETypeFromURL(resource)
    };
  }

  // Unknown
  return {
    url: '',
    type: ''
  };
}

export function getResourceContentLength(resource) {
  if (isResponse(resource)) {
    return resource.headers['content-length'] || -1;
  }
  if (isBlob(resource)) {
    return resource.size;
  }
  if (typeof resource === 'string') {
    // TODO - handle data URL?
    return resource.length;
  }
  if (resource instanceof ArrayBuffer) {
    return resource.byteLength;
  }
  if (ArrayBuffer.isView(resource)) {
    return resource.byteLength;
  }
  return -1;
}

function stripQueryString(url) {
  return url.replace(QUERY_STRING_PATTERN, '');
}
