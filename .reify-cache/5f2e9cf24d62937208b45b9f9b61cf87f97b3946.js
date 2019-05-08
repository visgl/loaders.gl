"use strict";module.export({getFullUri:()=>getFullUri});function getFullUri(uri, base) {
  // TODO: Use better logic to handle all protocols plus not delay on data
  const absolute = uri.startsWith('data:') || uri.startsWith('http:') || uri.startsWith('https:');
  return absolute ? uri : base.substr(0, base.lastIndexOf('/') + 1) + uri;
}
