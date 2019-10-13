import parseXML, {parseXMLSupported} from './lib/xml/parse-xml';

const XML_HEADER = '<?xml';

function testText(text) {
  return text.startsWith(XML_HEADER);
}

export default {
  name: 'KML',
  extensions: ['kml'],
  supported: parseXMLSupported(),
  testText,
  parseTextSync: parseXML,
  browserOnly: true,
  worker: false
};
