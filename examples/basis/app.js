/* global document, URL */
import {load} from '@loaders.gl/core';
import {BasisLoader} from '@loaders.gl/basis';

document.getElementById('loadBasis').addEventListener('click', e => {
  const el = document.createElement('input');
  el.type = 'file';
  el.addEventListener('input', async ev => {
    const url = URL.createObjectURL(ev.target.files[0]);
    const data = await load(url, BasisLoader);
    // eslint-disable-next-line
    console.log(data);
  });
  el.click();
});
