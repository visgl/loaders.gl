import test from 'tape-promise/tape';
import {I3SPendingTilesRegister} from '../../../src/tileset/format-i3s/i3s-pending-tiles-register';

test('I3SPendingTilesRegister | one viewport', (t) => {
  const register = new I3SPendingTilesRegister();
  const frameNumber = 0;
  const viewportId = 'default';
  for (let i = 0; i < 500; i++) {
    register.register(viewportId, frameNumber);
  }
  t.notOk(register.isZero(viewportId, frameNumber));
  t.ok(register.isZero(viewportId, frameNumber + 1));
  t.ok(register.isZero('wrong viewport id', frameNumber));
  for (let i = 0; i < 499; i++) {
    register.deregister(viewportId, frameNumber);
  }
  t.notOk(register.isZero(viewportId, frameNumber));
  register.deregister(viewportId, frameNumber);
  t.ok(register.isZero(viewportId, frameNumber));
  t.end();
});

test('I3SPendingTilesRegister | two viewports', (t) => {
  const register = new I3SPendingTilesRegister();
  const frameNumber = 0;
  const mainViewportId = 'main';
  const minimapViewportId = 'minimap';
  for (let i = 0; i < 500; i++) {
    register.register(mainViewportId, frameNumber);
  }
  for (let i = 0; i < 100; i++) {
    register.register(minimapViewportId, frameNumber);
  }
  t.notOk(register.isZero(mainViewportId, frameNumber));
  t.notOk(register.isZero(minimapViewportId, frameNumber));
  for (let i = 0; i < 100; i++) {
    register.deregister(mainViewportId, frameNumber);
    register.deregister(minimapViewportId, frameNumber);
  }
  t.ok(register.isZero(minimapViewportId, frameNumber));
  t.notOk(register.isZero(mainViewportId, frameNumber));
  for (let i = 0; i < 400; i++) {
    register.deregister(mainViewportId, frameNumber);
  }
  t.ok(register.isZero(mainViewportId, frameNumber));
  t.end();
});
