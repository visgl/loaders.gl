import {expect, test} from 'vitest';
import {I3SPendingTilesRegister} from '../../../src/tileset-3d/format-i3s/i3s-pending-tiles-register';
test('I3SPendingTilesRegister | one viewport', () => {
  const register = new I3SPendingTilesRegister();
  const frameNumber = 0;
  const viewportId = 'default';
  for (let i = 0; i < 500; i++) {
    register.register(viewportId, frameNumber);
  }
  expect(register.isZero(viewportId, frameNumber)).toBeFalsy();
  expect(register.isZero(viewportId, frameNumber + 1)).toBeTruthy();
  expect(register.isZero('wrong viewport id', frameNumber)).toBeTruthy();
  for (let i = 0; i < 499; i++) {
    register.deregister(viewportId, frameNumber);
  }
  expect(register.isZero(viewportId, frameNumber)).toBeFalsy();
  register.deregister(viewportId, frameNumber);
  expect(register.isZero(viewportId, frameNumber)).toBeTruthy();
});
test('I3SPendingTilesRegister | two viewports', () => {
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
  expect(register.isZero(mainViewportId, frameNumber)).toBeFalsy();
  expect(register.isZero(minimapViewportId, frameNumber)).toBeFalsy();
  for (let i = 0; i < 100; i++) {
    register.deregister(mainViewportId, frameNumber);
    register.deregister(minimapViewportId, frameNumber);
  }
  expect(register.isZero(minimapViewportId, frameNumber)).toBeTruthy();
  expect(register.isZero(mainViewportId, frameNumber)).toBeFalsy();
  for (let i = 0; i < 400; i++) {
    register.deregister(mainViewportId, frameNumber);
  }
  expect(register.isZero(mainViewportId, frameNumber)).toBeTruthy();
});
