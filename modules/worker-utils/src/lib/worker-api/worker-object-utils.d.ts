import {WorkerObject} from '../../types';

/**
 * Generate a worker URL based on worker object and options
 * - a published worker on unpkg CDN
 * - a local test worker
 * - overridden by user
 * @returns string
 */
export function getWorkerObjectURL(worker: WorkerObject, options: object): string;

/**
 * Gets worker object's name
 * @param worker
 * @param options
 */
export function getWorkerObjectName(worker: WorkerObject, options: object): string;

/**
 * Check if worker is compatible with this library version
 * @param worker
 * @param libVersion
 * @returns `true` if the two versions are compatible
 */
export function validateWorkerVersion(worker: WorkerObject, libVersion?: string): boolean;

/**
 * Safely stringify JSON (drop non serializable values like functions and regexps)
 * @param value
 */
export function removeNontransferableOptions(object: object): object;
