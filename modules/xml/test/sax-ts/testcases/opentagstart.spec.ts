// SPDX-License-Identifier: ISC

import { expect, test } from "vitest";
import { testSax } from '../utils/test-utils';
test('SAXParser#opentagstart', () => {
    testSax({
        xml: '<root length=\'12345\'></root>',
        expect: [
            [
                'opentagstart',
                {
                    name: 'root',
                    ns: {},
                    attributes: {}
                }
            ],
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
    testSax({
        xml: '<root length=\'12345\'></root>',
        expect: [
            [
                'opentagstart',
                {
                    name: 'root',
                    attributes: {}
                }
            ],
            [
                'attribute',
                {
                    name: 'length',
                    value: '12345'
                }
            ],
            [
                'opentag',
                {
                    name: 'root',
                    attributes: {
                        length: '12345'
                    },
                    isSelfClosing: false
                }
            ],
            ['closetag', 'root']
        ],
        saxOptions: {
            strict: true
        }
    });
});
