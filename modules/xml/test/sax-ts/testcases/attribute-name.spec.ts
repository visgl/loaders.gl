// SPDX-License-Identifier: ISC
import { expect, test } from "vitest";
import { testSax } from '../utils/test-utils';
test('SAXParser#attribute-name', () => {
    testSax({
        xml: '<root length=\'12345\'></root>',
        expect: [
            ['opentagstart', { name: 'root', attributes: {}, ns: {} }],
            [
                'attribute',
                {
                    name: 'length',
                    value: '12345',
                    prefix: '',
                    local: 'length',
                    uri: ''
                }
            ],
            [
                'opentag',
                {
                    name: 'root',
                    prefix: '',
                    local: 'root',
                    uri: '',
                    attributes: {
                        length: {
                            name: 'length',
                            value: '12345',
                            prefix: '',
                            local: 'length',
                            uri: ''
                        }
                    },
                    ns: {},
                    isSelfClosing: false
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
