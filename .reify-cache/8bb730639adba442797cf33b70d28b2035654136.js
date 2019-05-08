"use strict";var parseXML,parseXMLSupported;module.link('./parse-xml',{default(v){parseXML=v},parseXMLSupported(v){parseXMLSupported=v}},0);

const XML_HEADER = '<?xml';

function testText(text) {
  return text.startsWith(XML_HEADER);
}

module.exportDefault({
  name: 'KML',
  extensions: ['kml'],
  supported: parseXMLSupported(),
  testText,
  parseTextSync: parseXML,
  browserOnly: true,
  worker: false
});
