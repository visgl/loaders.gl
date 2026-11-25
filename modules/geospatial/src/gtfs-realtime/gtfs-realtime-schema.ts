// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  COORDINATE_COLUMNS,
  TIMESTAMP_COLUMN,
  type MovingObjectColumn,
  type MovingObjectPosition
} from '../moving-objects/moving-object-table';

/** Decoded GTFS Realtime snapshot. */
export type GTFSRealtimeFeed = {
  /** Discriminator for the decoded feed shape. */
  shape: 'gtfs-realtime-feed';
  /** Snapshot metadata. */
  header: GTFSRealtimeHeader;
  /** Entities in wire order. */
  entity: GTFSRealtimeEntity[];
};

/** Metadata for a GTFS Realtime snapshot. */
export type GTFSRealtimeHeader = {
  /** GTFS Realtime specification version. */
  gtfsRealtimeVersion: string;
  /** Snapshot incrementality enum name. */
  incrementality: string;
  /** Feed creation time in Unix seconds. */
  timestamp?: number;
  /** Corresponding GTFS Schedule feed version. */
  feedVersion?: string;
};

/** Update identified within the feed. */
export type GTFSRealtimeEntity = {
  /** Feed entity identifier. */
  id: string;
  /** Whether the entity is a deletion marker. */
  isDeleted: boolean;
  /** Trip prediction or schedule update. */
  tripUpdate?: GTFSRealtimeTripUpdate;
  /** Vehicle observation. */
  vehicle?: GTFSRealtimeVehiclePosition;
  /** Service alert. */
  alert?: GTFSRealtimeAlert;
};

/** An observation of a transit vehicle. */
export type GTFSRealtimeVehiclePosition = {
  /** Trip being served. */
  trip?: GTFSRealtimeTripDescriptor;
  /** Vehicle identification. */
  vehicle?: GTFSRealtimeVehicleDescriptor;
  /** Reported geographic position. */
  position?: GTFSRealtimePosition;
  /** Stop sequence in the scheduled trip. */
  currentStopSequence?: number;
  /** Vehicle stop status enum name. */
  currentStatus: string;
  /** Observation time in Unix seconds. */
  timestamp?: number;
  /** Congestion level enum name. */
  congestionLevel?: string;
  /** Identifier of the referenced stop. */
  stopId?: string;
  /** Passenger occupancy enum name. */
  occupancyStatus?: string;
  /** Passenger occupancy percentage. */
  occupancyPercentage?: number;
  /** Per-carriage details in direction-of-travel order. */
  multiCarriageDetails: GTFSRealtimeCarriageDetails[];
};

/** Identification for an instance of a trip. */
export type GTFSRealtimeTripDescriptor = {
  /** GTFS Schedule trip identifier. */
  tripId?: string;
  /** GTFS Schedule route identifier. */
  routeId?: string;
  /** GTFS Schedule direction identifier. */
  directionId?: number;
  /** Scheduled service-day start time. */
  startTime?: string;
  /** Scheduled start date in YYYYMMDD form. */
  startDate?: string;
  /** Trip schedule relationship enum name. */
  scheduleRelationship?: string;
  /** Reference to a modified trip. */
  modifiedTrip?: GTFSRealtimeModifiedTrip;
};

/** Reference to a trip affected by a modification. */
export type GTFSRealtimeModifiedTrip = {
  /** Feed entity identifier of the trip modifications. */
  modificationsId?: string;
  /** Identifier of the affected trip. */
  affectedTripId?: string;
  /** Start time of the affected trip. */
  startTime?: string;
  /** Start date of the affected trip. */
  startDate?: string;
};

/** Vehicle identification and accessibility. */
export type GTFSRealtimeVehicleDescriptor = {
  /** Vehicle identifier. */
  id?: string;
  /** Passenger-facing vehicle label. */
  label?: string;
  /** Vehicle license plate. */
  licensePlate?: string;
  /** Wheelchair accessibility enum name. */
  wheelchairAccessible: string;
};

/** Position and movement reported by a transit vehicle. */
export type GTFSRealtimePosition = {
  /** WGS84 latitude in decimal degrees. */
  latitude: number;
  /** WGS84 longitude in decimal degrees. */
  longitude: number;
  /** Degrees clockwise from true north. */
  bearing?: number;
  /** Odometer reading in metres. */
  odometer?: number;
  /** Speed in metres per second. */
  speed?: number;
};

/** Passenger information for one vehicle carriage. */
export type GTFSRealtimeCarriageDetails = {
  /** Carriage identifier. */
  id?: string;
  /** Passenger-facing carriage label. */
  label?: string;
  /** Passenger occupancy enum name. */
  occupancyStatus: string;
  /** Passenger occupancy percentage, or -1 when unknown. */
  occupancyPercentage: number;
  /** Position of this carriage in the vehicle. */
  carriageSequence?: number;
};

/** Realtime schedule and stop predictions for one trip. */
export type GTFSRealtimeTripUpdate = {
  /** Trip being updated. */
  trip: GTFSRealtimeTripDescriptor;
  /** Vehicle serving the trip. */
  vehicle?: GTFSRealtimeVehicleDescriptor;
  /** Stop updates in wire order. */
  stopTimeUpdate: GTFSRealtimeStopTimeUpdate[];
  /** Time of the observation used for this prediction, in Unix seconds. */
  timestamp?: number;
  /** Schedule deviation in seconds. */
  delay?: number;
};

/** Predictions or schedule changes at one stop. */
export type GTFSRealtimeStopTimeUpdate = {
  /** Stop sequence in the scheduled trip. */
  stopSequence?: number;
  /** Identifier of the stop. */
  stopId?: string;
  /** Arrival prediction. */
  arrival?: GTFSRealtimeStopTimeEvent;
  /** Departure prediction. */
  departure?: GTFSRealtimeStopTimeEvent;
  /** Stop schedule relationship enum name. */
  scheduleRelationship: string;
  /** Expected occupancy on departure, as an enum name. */
  departureOccupancyStatus?: string;
};

/** Timing information for an arrival or departure. */
export type GTFSRealtimeStopTimeEvent = {
  /** Schedule deviation in seconds. */
  delay?: number;
  /** Predicted Unix time in seconds. */
  time?: number;
  /** Prediction uncertainty in seconds. */
  uncertainty?: number;
  /** Scheduled Unix time in seconds. */
  scheduledTime?: number;
};

/** Service alert and all supplied text translations. */
export type GTFSRealtimeAlert = {
  /** Ranges during which the alert is active. */
  activePeriod: GTFSRealtimeTimeRange[];
  /** Ranges during which the alert should be communicated. */
  communicationPeriod: GTFSRealtimeTimeRange[];
  /** Ranges during which service is affected. */
  impactPeriod: GTFSRealtimeTimeRange[];
  /** Schedule entities affected by the alert. */
  informedEntity: GTFSRealtimeEntitySelector[];
  /** Alert cause enum name. */
  cause: string;
  /** Alert effect enum name. */
  effect: string;
  /** Translated URLs with further details. */
  url?: GTFSRealtimeTranslatedString;
  /** Translated alert headlines. */
  headerText?: GTFSRealtimeTranslatedString;
  /** Translated descriptions. */
  descriptionText?: GTFSRealtimeTranslatedString;
};

/** A time range with optional start and end bounds. */
export type GTFSRealtimeTimeRange = {
  /** Inclusive start in Unix seconds. */
  start?: number;
  /** Exclusive end in Unix seconds. */
  end?: number;
};

/** A GTFS Schedule entity or set of entities selected by an alert. */
export type GTFSRealtimeEntitySelector = {
  /** Agency identifier. */
  agencyId?: string;
  /** Route identifier. */
  routeId?: string;
  /** GTFS Schedule route type code. */
  routeType?: number;
  /** Trip selector. */
  trip?: GTFSRealtimeTripDescriptor;
  /** Stop identifier. */
  stopId?: string;
  /** Direction identifier. */
  directionId?: number;
};

/** All translations of a text or URL. */
export type GTFSRealtimeTranslatedString = {
  /** Translations in wire order. */
  translation: GTFSRealtimeTranslation[];
};

/** A localized text or URL. */
export type GTFSRealtimeTranslation = {
  /** Translated text. */
  text: string;
  /** BCP 47 language tag. */
  language?: string;
};

/** One positioned transit vehicle in a GTFS Realtime snapshot. */
export type GTFSRealtimeRow = MovingObjectPosition & {
  /** Feed entity identifier. */
  id: string;
  /** Vehicle identifier. */
  vehicleId: string | null;
  /** Passenger-facing vehicle label. */
  vehicleLabel: string | null;
  /** Trip identifier. */
  tripId: string | null;
  /** Route identifier. */
  routeId: string | null;
  /** Trip direction identifier. */
  directionId: number | null;
  /** Trip start date in YYYYMMDD form. */
  startDate: string | null;
  /** Trip service-day start time. */
  startTime: string | null;
  /** Degrees clockwise from true north. */
  bearing: number | null;
  /** Speed in metres per second. */
  speed: number | null;
  /** Vehicle stop status enum name. */
  currentStatus: string;
  /** Referenced GTFS Schedule stop. */
  stopId: string | null;
  /** Passenger occupancy enum name. */
  occupancyStatus: string | null;
  /** Passenger occupancy percentage. */
  occupancyPercentage: number | null;
};

/** Columns of the realtime vehicle table in output order. */
export const GTFS_REALTIME_COLUMNS = [
  TIMESTAMP_COLUMN,
  {name: 'id', type: 'utf8', nullable: false},
  {name: 'vehicleId', type: 'utf8', nullable: true},
  {name: 'vehicleLabel', type: 'utf8', nullable: true},
  {name: 'tripId', type: 'utf8', nullable: true},
  {name: 'routeId', type: 'utf8', nullable: true},
  {name: 'directionId', type: 'uint32', nullable: true},
  {name: 'startDate', type: 'utf8', nullable: true},
  {name: 'startTime', type: 'utf8', nullable: true},
  ...COORDINATE_COLUMNS,
  {name: 'bearing', type: 'float64', nullable: true, metadata: {unit: 'deg'}},
  {name: 'speed', type: 'float64', nullable: true, metadata: {unit: 'm/s'}},
  {name: 'currentStatus', type: 'utf8', nullable: false},
  {name: 'stopId', type: 'utf8', nullable: true},
  {name: 'occupancyStatus', type: 'utf8', nullable: true},
  {name: 'occupancyPercentage', type: 'uint32', nullable: true, metadata: {unit: '%'}}
] as const satisfies readonly MovingObjectColumn<GTFSRealtimeRow>[];
