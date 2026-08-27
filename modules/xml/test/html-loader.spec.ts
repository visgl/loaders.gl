import {expect, test} from 'vitest';
// import {validateLoader} from 'test/common/conformance';
import {HTMLLoader} from '@loaders.gl/xml';
import {parse} from '@loaders.gl/core';
const HTML = `
<HTML>
<HEAD>
<TITLE>Your Title Here</TITLE>
</HEAD>
<BODY BGCOLOR="FFFFFF">
<CENTER><IMG SRC="clouds.jpg" ALIGN="BOTTOM"> </CENTER>
<HR>
<a href="http://somegreatsite.com">Link Name</a>
is a link to another nifty site
<H1>This is a Header</H1>
<H2>This is a Medium Header</H2>
Send me mail at <a href="mailto:support@yourcompany.com">
support@yourcompany.com</a>.
<P> This is a new paragraph!
<P> <B>This is a new paragraph!</B>
<BR> <B><I>This is a new sentence without a paragraph break, in bold italics.</I></B>
<HR>
</BODY>
</HTML>
`;
test('HTMLLoader#forecasts.xml', async () => {
  const html = await parse(HTML, HTMLLoader);
  expect(html, 'got result').toBeTruthy();
  expect(html.HTML.BODY.CENTER.IMG.SRC, 'HTML image tag src correct').toBe('clouds.jpg');
});
