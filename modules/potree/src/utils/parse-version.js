"use strict";
// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseVersion = parseVersion;
function parseVersion(version) {
    var parts = version.split('.').map(Number);
    return { major: parts[0], minor: parts[1] };
}
