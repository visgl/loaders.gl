// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  GTFSRealtimeAlert,
  GTFSRealtimeCarriageDetails,
  GTFSRealtimeEntity,
  GTFSRealtimeEntitySelector,
  GTFSRealtimeFeed,
  GTFSRealtimeHeader,
  GTFSRealtimeLocalizedImage,
  GTFSRealtimeModification,
  GTFSRealtimeModifiedTrip,
  GTFSRealtimePosition,
  GTFSRealtimeReplacementStop,
  GTFSRealtimeSelectedTrips,
  GTFSRealtimeShape,
  GTFSRealtimeStop,
  GTFSRealtimeStopSelector,
  GTFSRealtimeStopTimeEvent,
  GTFSRealtimeStopTimeProperties,
  GTFSRealtimeStopTimeUpdate,
  GTFSRealtimeTimeRange,
  GTFSRealtimeTranslatedImage,
  GTFSRealtimeTranslatedString,
  GTFSRealtimeTranslation,
  GTFSRealtimeTripDescriptor,
  GTFSRealtimeTripModifications,
  GTFSRealtimeTripProperties,
  GTFSRealtimeTripUpdate,
  GTFSRealtimeVehicleDescriptor,
  GTFSRealtimeVehiclePosition
} from './gtfs-realtime-schema';
import {ProtobufReader} from './protobuf-reader';

/** Reads one field payload of a supported wire type. */
type FieldReader<Value> = {
  /** Expected low three bits of the field tag. */
  wireType: number;
  /** Decodes the payload, returning undefined for unrecognized enum values. */
  read: (reader: ProtobufReader) => Value | undefined;
};

/** Maps proto field numbers to the matching output property and wire reader. */
type MessageFields<Message> = Readonly<{
  [field: number]:
    | {
        [Key in keyof Message]-?: NonNullable<Message[Key]> extends (infer Item)[]
          ? readonly [Key, FieldReader<Item>, true]
          : readonly [Key, FieldReader<NonNullable<Message[Key]>>];
      }[keyof Message]
    | undefined;
}>;

/** Reads one message, keeping omitted optional fields absent unless they have explicit defaults. */
function readMessage<Message extends object>(
  reader: ProtobufReader,
  fields: MessageFields<Message>,
  message: Partial<Message>,
  required: readonly (keyof Message)[]
): Message {
  while (!reader.done) {
    const tag = reader.readTag();
    const field = fields[tag >>> 3];
    if (!field || (tag & 7) !== field[1].wireType) {
      reader.skipField(tag);
      continue;
    }
    const [key, decoder, repeated] = field;
    const value = decoder.read(reader);
    if (repeated) {
      (message[key] as unknown[]).push(value);
    } else if (value !== undefined) {
      Object.assign(message, {[key]: value});
    }
  }
  for (const key of required) {
    if (!Object.hasOwn(message, key)) {
      throw new Error(`Missing GTFS Realtime protobuf field: ${String(key)}`);
    }
  }
  return message as Message;
}

/** Defines a length-delimited message with its own bounds and fresh defaults. */
function messageField<Message extends object>(
  fields: MessageFields<Message>,
  initialize: () => Partial<Message> = () => ({}),
  required: readonly (keyof Message)[] = []
): FieldReader<Message> {
  return {
    wireType: 2,
    read: reader =>
      readMessage(new ProtobufReader(reader.readBytes()), fields, initialize(), required)
  };
}

/** Decodes UTF-8 strings without stripping a BOM inside a field value. */
const textDecoder = new TextDecoder('utf-8', {ignoreBOM: true});
/** Reads a UTF-8 string field. */
const stringField: FieldReader<string> = {
  wireType: 2,
  read: reader => textDecoder.decode(reader.readBytes())
};
/** Reads a protobuf bool. */
const booleanField: FieldReader<boolean> = {
  wireType: 0,
  read: reader => reader.readVarint() !== 0n
};
/** Reads a protobuf uint32. */
const unsignedIntegerField: FieldReader<number> = {
  wireType: 0,
  read: reader => Number(BigInt.asUintN(32, reader.readVarint()))
};
/** Reads a protobuf int32, including negative ten-byte varints. */
const integerField: FieldReader<number> = {
  wireType: 0,
  read: reader => Number(BigInt.asIntN(32, reader.readVarint()))
};
/** Reads a protobuf float. */
const floatField: FieldReader<number> = {wireType: 5, read: reader => reader.readFloat()};
/** Reads a protobuf double. */
const doubleField: FieldReader<number> = {wireType: 1, read: reader => reader.readDouble()};

/** Reads a 64-bit timestamp that can be represented exactly as a JavaScript number. */
function timestampField(signed: boolean): FieldReader<number> {
  return {
    wireType: 0,
    read: reader => {
      const value = reader.readVarint();
      const timestamp = Number(signed ? BigInt.asIntN(64, value) : value);
      if (!Number.isSafeInteger(timestamp)) {
        throw new RangeError('GTFS Realtime timestamp exceeds the safe integer range');
      }
      return timestamp;
    }
  };
}

/** Reads an enum name, preserving proto2 defaults when a value is unknown. */
function enumField(names: Readonly<Record<number, string | undefined>>): FieldReader<string> {
  return {wireType: 0, read: reader => names[Number(reader.readVarint())]};
}

/** Reads an unsigned Unix timestamp. */
const unsignedTimestamp = timestampField(false);
/** Reads a signed Unix timestamp. */
const signedTimestamp = timestampField(true);

/** Names of passenger occupancy states for vehicles, carriages and stop predictions. */
const occupancyStatus = enumField([
  'EMPTY',
  'MANY_SEATS_AVAILABLE',
  'FEW_SEATS_AVAILABLE',
  'STANDING_ROOM_ONLY',
  'CRUSHED_STANDING_ROOM_ONLY',
  'FULL',
  'NOT_ACCEPTING_PASSENGERS',
  'NO_DATA_AVAILABLE',
  'NOT_BOARDABLE'
]);

/** Reads a reference to trip modifications. */
const modifiedTrip = messageField<GTFSRealtimeModifiedTrip>({
  1: ['modificationsId', stringField],
  2: ['affectedTripId', stringField],
  3: ['startTime', stringField],
  4: ['startDate', stringField]
});

/** Reads a trip descriptor from an observation, prediction or alert. */
const tripDescriptor = messageField<GTFSRealtimeTripDescriptor>({
  1: ['tripId', stringField],
  2: ['startTime', stringField],
  3: ['startDate', stringField],
  4: [
    'scheduleRelationship',
    enumField({
      0: 'SCHEDULED',
      1: 'ADDED',
      2: 'UNSCHEDULED',
      3: 'CANCELED',
      5: 'REPLACEMENT',
      6: 'DUPLICATED',
      7: 'DELETED',
      8: 'NEW'
    })
  ],
  5: ['routeId', stringField],
  6: ['directionId', unsignedIntegerField],
  7: ['modifiedTrip', modifiedTrip]
});

/** Reads vehicle identity and wheelchair accessibility. */
const vehicleDescriptor = messageField<GTFSRealtimeVehicleDescriptor>(
  {
    1: ['id', stringField],
    2: ['label', stringField],
    3: ['licensePlate', stringField],
    4: [
      'wheelchairAccessible',
      enumField(['NO_VALUE', 'UNKNOWN', 'WHEELCHAIR_ACCESSIBLE', 'WHEELCHAIR_INACCESSIBLE'])
    ]
  },
  () => ({wheelchairAccessible: 'NO_VALUE'})
);

/** Reads required coordinates and optional motion and odometer observations. */
const position = messageField<GTFSRealtimePosition>(
  {
    1: ['latitude', floatField],
    2: ['longitude', floatField],
    3: ['bearing', floatField],
    4: ['odometer', doubleField],
    5: ['speed', floatField]
  },
  undefined,
  ['latitude', 'longitude']
);

/** Reads the identity, occupancy and sequence of one carriage. */
const carriageDetails = messageField<GTFSRealtimeCarriageDetails>(
  {
    1: ['id', stringField],
    2: ['label', stringField],
    3: ['occupancyStatus', occupancyStatus],
    4: ['occupancyPercentage', integerField],
    5: ['carriageSequence', unsignedIntegerField]
  },
  () => ({occupancyStatus: 'NO_DATA_AVAILABLE', occupancyPercentage: -1})
);

/** Reads a vehicle position entity, including observations without coordinates. */
const vehiclePosition = messageField<GTFSRealtimeVehiclePosition>(
  {
    1: ['trip', tripDescriptor],
    2: ['position', position],
    3: ['currentStopSequence', unsignedIntegerField],
    4: ['currentStatus', enumField(['INCOMING_AT', 'STOPPED_AT', 'IN_TRANSIT_TO'])],
    5: ['timestamp', unsignedTimestamp],
    6: [
      'congestionLevel',
      enumField([
        'UNKNOWN_CONGESTION_LEVEL',
        'RUNNING_SMOOTHLY',
        'STOP_AND_GO',
        'CONGESTION',
        'SEVERE_CONGESTION'
      ])
    ],
    7: ['stopId', stringField],
    8: ['vehicle', vehicleDescriptor],
    9: ['occupancyStatus', occupancyStatus],
    10: ['occupancyPercentage', unsignedIntegerField],
    11: ['multiCarriageDetails', carriageDetails, true]
  },
  () => ({currentStatus: 'IN_TRANSIT_TO', multiCarriageDetails: []})
);

/** Reads arrival or departure predictions. */
const stopTimeEvent = messageField<GTFSRealtimeStopTimeEvent>({
  1: ['delay', integerField],
  2: ['time', signedTimestamp],
  3: ['uncertainty', integerField],
  4: ['scheduledTime', signedTimestamp]
});

/** Names of the pickup and drop-off arrangements at a stop. */
const dropOffPickupType = enumField(['REGULAR', 'NONE', 'PHONE_AGENCY', 'COORDINATE_WITH_DRIVER']);

/** Reads platform assignment and passenger-facing changes for one stop. */
const stopTimeProperties = messageField<GTFSRealtimeStopTimeProperties>({
  1: ['assignedStopId', stringField],
  2: ['stopHeadsign', stringField],
  3: ['pickupType', dropOffPickupType],
  4: ['dropOffType', dropOffPickupType]
});

/** Reads predictions and schedule changes for one stop. */
const stopTimeUpdate = messageField<GTFSRealtimeStopTimeUpdate>(
  {
    1: ['stopSequence', unsignedIntegerField],
    2: ['arrival', stopTimeEvent],
    3: ['departure', stopTimeEvent],
    4: ['stopId', stringField],
    5: ['scheduleRelationship', enumField(['SCHEDULED', 'SKIPPED', 'NO_DATA', 'UNSCHEDULED'])],
    6: ['stopTimeProperties', stopTimeProperties],
    7: ['departureOccupancyStatus', occupancyStatus]
  },
  () => ({scheduleRelationship: 'SCHEDULED'})
);

/** Reads a duplicate trip's identity and overrides for a trip's shape or signage. */
const tripProperties = messageField<GTFSRealtimeTripProperties>({
  1: ['tripId', stringField],
  2: ['startDate', stringField],
  3: ['startTime', stringField],
  4: ['shapeId', stringField],
  5: ['tripHeadsign', stringField],
  6: ['tripShortName', stringField]
});

/** Reads trip-level updates and their stop predictions. */
const tripUpdate = messageField<GTFSRealtimeTripUpdate>(
  {
    1: ['trip', tripDescriptor],
    2: ['stopTimeUpdate', stopTimeUpdate, true],
    3: ['vehicle', vehicleDescriptor],
    4: ['timestamp', unsignedTimestamp],
    5: ['delay', integerField],
    6: ['tripProperties', tripProperties]
  },
  () => ({stopTimeUpdate: []}),
  ['trip']
);

/** Reads an alert's applicability period. */
const timeRange = messageField<GTFSRealtimeTimeRange>({
  1: ['start', unsignedTimestamp],
  2: ['end', unsignedTimestamp]
});

/** Reads a selector for the transit service affected by an alert. */
const entitySelector = messageField<GTFSRealtimeEntitySelector>({
  1: ['agencyId', stringField],
  2: ['routeId', stringField],
  3: ['routeType', integerField],
  4: ['trip', tripDescriptor],
  5: ['stopId', stringField],
  6: ['directionId', unsignedIntegerField]
});

/** Reads one localized string. */
const translation = messageField<GTFSRealtimeTranslation>(
  {1: ['text', stringField], 2: ['language', stringField]},
  undefined,
  ['text']
);

/** Reads every translation in a text or URL field. */
const translatedString = messageField<GTFSRealtimeTranslatedString>(
  {1: ['translation', translation, true]},
  () => ({translation: []})
);

/** Reads an image URL and media type with its optional language tag. */
const localizedImage = messageField<GTFSRealtimeLocalizedImage>(
  {1: ['url', stringField], 2: ['mediaType', stringField], 3: ['language', stringField]},
  undefined,
  ['url', 'mediaType']
);

/** Reads all localized variants of an alert image. */
const translatedImage = messageField<GTFSRealtimeTranslatedImage>(
  {1: ['localizedImage', localizedImage, true]},
  () => ({localizedImage: []})
);

/** Reads a service alert and its localized descriptions. */
const alert = messageField<GTFSRealtimeAlert>(
  {
    1: ['activePeriod', timeRange, true],
    2: ['communicationPeriod', timeRange, true],
    3: ['impactPeriod', timeRange, true],
    5: ['informedEntity', entitySelector, true],
    6: [
      'cause',
      enumField([
        undefined,
        'UNKNOWN_CAUSE',
        'OTHER_CAUSE',
        'TECHNICAL_PROBLEM',
        'STRIKE',
        'DEMONSTRATION',
        'ACCIDENT',
        'HOLIDAY',
        'WEATHER',
        'MAINTENANCE',
        'CONSTRUCTION',
        'POLICE_ACTIVITY',
        'MEDICAL_EMERGENCY',
        'SPECIAL_EVENT'
      ])
    ],
    7: [
      'effect',
      enumField([
        undefined,
        'NO_SERVICE',
        'REDUCED_SERVICE',
        'SIGNIFICANT_DELAYS',
        'DETOUR',
        'ADDITIONAL_SERVICE',
        'MODIFIED_SERVICE',
        'OTHER_EFFECT',
        'UNKNOWN_EFFECT',
        'STOP_MOVED',
        'NO_EFFECT',
        'ACCESSIBILITY_ISSUE'
      ])
    ],
    8: ['url', translatedString],
    10: ['headerText', translatedString],
    11: ['descriptionText', translatedString],
    12: ['ttsHeaderText', translatedString],
    13: ['ttsDescriptionText', translatedString],
    14: ['severityLevel', enumField([undefined, 'UNKNOWN_SEVERITY', 'INFO', 'WARNING', 'SEVERE'])],
    15: ['image', translatedImage],
    16: ['imageAlternativeText', translatedString],
    17: ['causeDetail', translatedString],
    18: ['effectDetail', translatedString]
  },
  () => ({
    activePeriod: [],
    communicationPeriod: [],
    impactPeriod: [],
    informedEntity: [],
    cause: 'UNKNOWN_CAUSE',
    effect: 'UNKNOWN_EFFECT',
    severityLevel: 'UNKNOWN_SEVERITY'
  })
);

/** Reads the feed version, update mode and creation time. */
const feedHeader = messageField<GTFSRealtimeHeader>(
  {
    1: ['gtfsRealtimeVersion', stringField],
    2: ['incrementality', enumField(['FULL_DATASET', 'DIFFERENTIAL'])],
    3: ['timestamp', unsignedTimestamp],
    4: ['feedVersion', stringField]
  },
  () => ({incrementality: 'FULL_DATASET'}),
  ['gtfsRealtimeVersion']
);

/** Reads the identity and encoded polyline of a trip path. */
const shape = messageField<GTFSRealtimeShape>({
  1: ['shapeId', stringField],
  2: ['encodedPolyline', stringField]
});

/** Reads realtime stop metadata and localized passenger information. */
const stop = messageField<GTFSRealtimeStop>(
  {
    1: ['stopId', stringField],
    2: ['stopCode', translatedString],
    3: ['stopName', translatedString],
    4: ['ttsStopName', translatedString],
    5: ['stopDesc', translatedString],
    6: ['stopLat', floatField],
    7: ['stopLon', floatField],
    8: ['zoneId', stringField],
    9: ['stopUrl', translatedString],
    11: ['parentStation', stringField],
    12: ['stopTimezone', stringField],
    13: ['wheelchairBoarding', enumField(['UNKNOWN', 'AVAILABLE', 'NOT_AVAILABLE'])],
    14: ['levelId', stringField],
    15: ['platformCode', translatedString]
  },
  () => ({wheelchairBoarding: 'UNKNOWN'})
);

/** Reads a reference to a stop by sequence or identifier. */
const stopSelector = messageField<GTFSRealtimeStopSelector>({
  1: ['stopSequence', unsignedIntegerField],
  2: ['stopId', stringField]
});

/** Reads a stop to visit as part of a modified trip. */
const replacementStop = messageField<GTFSRealtimeReplacementStop>({
  1: ['travelTimeToStop', integerField],
  2: ['stopId', stringField]
});

/** Reads one modification to a span of stops. */
const modification = messageField<GTFSRealtimeModification>(
  {
    1: ['startStopSelector', stopSelector],
    2: ['endStopSelector', stopSelector],
    3: ['propagatedModificationDelay', integerField],
    4: ['replacementStops', replacementStop, true],
    5: ['serviceAlertId', stringField],
    6: ['lastModifiedTime', unsignedTimestamp]
  },
  () => ({propagatedModificationDelay: 0, replacementStops: []})
);

/** Reads a group of trips affected by the same shape change. */
const selectedTrips = messageField<GTFSRealtimeSelectedTrips>(
  {1: ['tripIds', stringField, true], 2: ['shapeId', stringField]},
  () => ({tripIds: []})
);

/** Reads the trips, service dates and stop changes in a trip modification entity. */
const tripModifications = messageField<GTFSRealtimeTripModifications>(
  {
    1: ['selectedTrips', selectedTrips, true],
    2: ['startTimes', stringField, true],
    3: ['serviceDates', stringField, true],
    4: ['modifications', modification, true]
  },
  () => ({selectedTrips: [], startTimes: [], serviceDates: [], modifications: []})
);

/** Reads one feed entity, including deletion markers. */
const feedEntity = messageField<GTFSRealtimeEntity>(
  {
    1: ['id', stringField],
    2: ['isDeleted', booleanField],
    3: ['tripUpdate', tripUpdate],
    4: ['vehicle', vehiclePosition],
    5: ['alert', alert],
    6: ['shape', shape],
    7: ['stop', stop],
    8: ['tripModifications', tripModifications]
  },
  () => ({isDeleted: false}),
  ['id']
);

/** Supported fields at the root of a GTFS Realtime FeedMessage. */
const feedFields: MessageFields<GTFSRealtimeFeed> = {
  1: ['header', feedHeader],
  2: ['entity', feedEntity, true]
};

/** Decodes one binary GTFS Realtime FeedMessage. */
export function parseGTFSRealtime(arrayBuffer: ArrayBuffer): GTFSRealtimeFeed {
  return readMessage<GTFSRealtimeFeed>(
    new ProtobufReader(new Uint8Array(arrayBuffer)),
    feedFields,
    {shape: 'gtfs-realtime-feed', entity: []},
    ['header']
  );
}
