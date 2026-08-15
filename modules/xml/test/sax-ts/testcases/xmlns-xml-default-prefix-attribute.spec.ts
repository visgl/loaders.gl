import { expect, test } from "vitest";
import { testSax } from '../utils/test-utils';
test('SAXParser#xmlns-xml-default-prefix-attribute', () => {
    testSax({
        xml: '<root xml:lang=\'en\'/>',
        expect: [
            [
                'opentagstart',
                {
                    name: 'root',
                    attributes: {},
                    ns: {}
                }
            ],
            [
                'attribute',
                {
                    name: 'xml:lang',
                    local: 'lang',
                    prefix: 'xml',
                    uri: 'http://www.w3.org/XML/1998/namespace',
                    value: 'en'
                }
            ],
            [
                'opentag',
                {
                    name: 'root',
                    uri: '',
                    prefix: '',
                    local: 'root',
                    attributes: {
                        'xml:lang': {
                            name: 'xml:lang',
                            local: 'lang',
                            prefix: 'xml',
                            uri: 'http://www.w3.org/XML/1998/namespace',
                            value: 'en'
                        }
                    },
                    ns: {},
                    isSelfClosing: true
                }
            ],
            ['closetag', 'root']
        ],
        saxOptions: {
            strict: true,
            xmlns: true
        }
    });
});
