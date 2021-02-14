import parseXML, {parseXMLSupported} from './lib/xml/parse-xml';

const XML_HEADER = '<?xml';

export const XMLLoader = {
  name: 'XML',
  extensions: ['zml'],
  supported: parseXMLSupported(),
  testText,
  parseTextSync: parseXML,
  browserOnly: true,
  worker: false
};

function testText(text) {
  return text.startsWith(XML_HEADER);
}
