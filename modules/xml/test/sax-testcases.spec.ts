// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// These cases stay in separate source modules for readable upstream provenance, but importing
// them through one Vitest entrypoint avoids paying isolated environment setup once per case.
import './sax-ts/testcases/attribute-name.spec';
import './sax-ts/testcases/attribute-no-space.spec';
import './sax-ts/testcases/attribute-unquoted.spec';
import './sax-ts/testcases/bom.spec';
import './sax-ts/testcases/buffer-overrun.spec';
import './sax-ts/testcases/case.spec';
import './sax-ts/testcases/cdata-chunked.spec';
import './sax-ts/testcases/cdata-end-split.spec';
import './sax-ts/testcases/cdata-fake-end.spec';
import './sax-ts/testcases/cdata-multiple.spec';
import './sax-ts/testcases/cdata.spec';
import './sax-ts/testcases/cyrillic.spec';
import './sax-ts/testcases/duplicate-attribute.spec';
import './sax-ts/testcases/emoji.spec';
import './sax-ts/testcases/entities.spec';
import './sax-ts/testcases/entity-mega.spec';
import './sax-ts/testcases/entity-nan.spec';
import './sax-ts/testcases/flush.spec';
import './sax-ts/testcases/issue-23.spec';
import './sax-ts/testcases/issue-35.spec';
import './sax-ts/testcases/issue-47.spec';
import './sax-ts/testcases/issue-49.spec';
import './sax-ts/testcases/issue-84.spec';
import './sax-ts/testcases/issue-86.spec';
import './sax-ts/testcases/not-string.spec';
import './sax-ts/testcases/opentagstart.spec';
import './sax-ts/testcases/parser-position.spec';
import './sax-ts/testcases/script-close-better.spec';
import './sax-ts/testcases/script.spec';
import './sax-ts/testcases/self-closing-child-strict.spec';
import './sax-ts/testcases/self-closing-child.spec';
import './sax-ts/testcases/self-closing-tag.spec';
import './sax-ts/testcases/stand-alone-comment.spec';
import './sax-ts/testcases/stray-ending.spec';
import './sax-ts/testcases/trailing-attribute-no-value.spec';
import './sax-ts/testcases/trailing-non-whitespace.spec';
import './sax-ts/testcases/unclosed-root.spec';
import './sax-ts/testcases/unquoted.spec';
import './sax-ts/testcases/xml-internal-entities.spec';
import './sax-ts/testcases/xml_entities.spec';
import './sax-ts/testcases/xmlns-as-tag-name.spec';
import './sax-ts/testcases/xmlns-rebinding.spec';
import './sax-ts/testcases/xmlns-strict.spec';
import './sax-ts/testcases/xmlns-unbound-element.spec';
import './sax-ts/testcases/xmlns-unbound.spec';
import './sax-ts/testcases/xmlns-xml-default-ns.spec';
import './sax-ts/testcases/xmlns-xml-default-prefix-attribute.spec';
import './sax-ts/testcases/xmlns-xml-default-prefix.spec';
import './sax-ts/testcases/xmlns-xml-default-redefine.spec';
