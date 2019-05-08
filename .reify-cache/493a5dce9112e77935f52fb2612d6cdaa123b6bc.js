"use strict";var parseLAS;module.link('./parse-las',{default(v){parseLAS=v}},0);// LASER (LAS) FILE FORMAT



module.exportDefault({
  name: 'LAZ',
  extensions: ['las', 'laz'], // LAZ is the "compressed" flavor of LAS
  parseSync: parseLAS
});
