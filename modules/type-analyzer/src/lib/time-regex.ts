// Forked from https://github.com/uber-web/type-analyzer under MIT license
// Copyright (c) 2017 Uber Technologies, Inc.

/**
 * Given an array of regexes to union, build a string of them
 * @param {Array} arr - an array of regexes to be unioned
 * @return {String} the unioned dstring
 */
function union(arr) {
  return `(${arr.join('|')})`;
}

// GENERATE ALL OF THE TIME REGEXES
const HH = '\\d{1,2}';
const H = '\\d{1,2}';
const h = '\\d{1,2}';
const m = '\\d{1,2}';
const s = '\\d{1,2}';
const ss = '\\d{2}';
const SSSS = '(\\.\\d{1,6})';
const mm = '\\d{2}';
const Z = '(\\+|-)\\d{1,2}:\\d{1,2}';
const ZZ = '(\\+|-)(\\d{4}|\\d{1,2}:\\d{2})';
const a = '(am|pm)';

// 1513629453477
const X = '\\b\\d{12,13}\\b';

// 123456789 123456789.123
const x = '\\b\\d{9,10}(\\.\\d{1,3})?\\b';

const TIME_FORMAT_STRINGS = [
  'X',
  'x',
  'H:m',
  'HH:mmZ',
  'h:m a',
  'H:m:s',
  'h:m:s a',
  'HH:mm:ssZZ',
  'HH:mm:ss.SSSS',
  'HH:mm:ss.SSSSZZ'
].reverse();

// the reverse is important to put the more specific regexs higher in the order
const TIME_FORMAT_REGEX_STRINGS = [
  X,
  x,
  `${H}:${m}`,
  `${HH}:${mm}${Z}`,
  `${h}:${m} ${a}`,
  `${H}:${m}:${s}`,
  `${H}:${m}:${s} ${a}`,
  `${HH}:${mm}:${ss}${ZZ}`,
  `${HH}:${mm}:${ss}${SSSS}`,
  `${HH}:${mm}:${ss}${SSSS}${ZZ}`
].reverse();

// something like:
// {'(\d{2)....': 'M-D-YYYY'}
export const TIME_FORMAT_REGEX_MAP = TIME_FORMAT_STRINGS.reduce(function generateRegexMap(
  timeFormats,
  str,
  index
) {
  timeFormats[TIME_FORMAT_REGEX_STRINGS[index]] = str;
  return timeFormats;
},
{});

const ALL_TIME_FORMAT_REGEX_STR = union(Object.keys(TIME_FORMAT_REGEX_MAP));
export const ALL_TIME_FORMAT_REGEX = new RegExp(`^${ALL_TIME_FORMAT_REGEX_STR}$`, 'i');

// GENERATE ALL DATE FORMATS
const YYYY = '\\d{2,4}';
const M = '\\d{1,2}';
const MMM = union([
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
]);
const MMMM = union([
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
]);
const D = '\\d{1,2}';
const DD = '\\d{2}';
const Do = '\\d{1,2}(st|nd|rd|th)';

const dateFormatRegexStrings = [
  `${YYYY}-${M}-${D}`,
  `${YYYY}\\/${M}\\/${D}`,
  `${M}\\/${D}\\/${YYYY}`,
  `${MMMM} ${DD}, ${YYYY}`,
  `${MMM} ${DD}, ${YYYY}`,
  `${MMMM} ${Do}, ${YYYY}`,
  `${MMM} ${Do}, ${YYYY}`
];

const dateFormatStrings = [
  'YYYY-M-D',
  'YYYY/M/D',
  'M/D/YYYY',
  'MMMM DD, YYYY',
  'MMM DD, YYYY',
  'MMMM Do, YYYY',
  'MMM Do, YYYY'
];
export const DATE_FORMAT_REGEX = new RegExp(`^${union(dateFormatRegexStrings)}$`, 'i');

// something like:
// {'(\d{2)....': 'M-D-YYYY'}
export const DATE_FORMAT_REGEX_MAP = dateFormatStrings.reduce(function generateRegexMap(
  dateFormats,
  str,
  index
) {
  dateFormats[dateFormatRegexStrings[index]] = str;
  return dateFormats;
},
{});

// COMPUTE THEIR CROSS PRODUCT

// {'SOME HELLISH REGEX': 'YYYY HH:MM:SS'}
export const DATE_TIME_MAP = Object.keys(DATE_FORMAT_REGEX_MAP).reduce(function reduceDate(
  dateTimes,
  dateRegex
) {
  const dateStr = DATE_FORMAT_REGEX_MAP[dateRegex];
  Object.keys(TIME_FORMAT_REGEX_MAP).forEach(function loopAcrosTimes(timeRegex) {
    const timeStr = TIME_FORMAT_REGEX_MAP[timeRegex];
    dateTimes[`${dateRegex} ${timeRegex}`] = `${dateStr} ${timeStr}`;
    dateTimes[`${dateRegex}T${timeRegex}`] = `${dateStr}T${timeStr}`;
    dateTimes[`${timeRegex}T${dateRegex}`] = `${timeStr}T${dateStr}`;
    dateTimes[`${timeRegex} ${dateRegex}`] = `${timeStr} ${dateStr}`;
  });
  return dateTimes;
},
{});

export const ALL_DATE_TIME_REGEX = new RegExp(union(Object.keys(DATE_TIME_MAP)));
