import { StandardDistance } from './types';

export const MARATHON_DISTANCE = 42.195;
export const KM_TO_MILES = 0.621371192;
export const MILE_TO_KM = 1 / KM_TO_MILES;
export const KPH_TO_MS = 1000 / 3600;
export const STORAGE_KEY = 'paceCalculatorPreferences';

export const STORAGE_VERSION_KEY = 'storageVersion';
export const STORAGE_VERSION = 9;

export const STANDARD_DISTANCES: StandardDistance[] = [
  {
    id: '5k',
    name: '5km',
    distance: 5,
    important: true,
    defaultEnabled: true,
  },
  {
    id: '10k',
    name: '10km',
    distance: 10,
    defaultEnabled: true,
  },
  { id: '15k', name: '15km', distance: 15 },
  { id: '20k', name: '20km', distance: 20 },
  {
    id: 'hm',
    name: 'HM',
    longName: 'Half Marathon',
    distance: MARATHON_DISTANCE / 2,
    important: true,
    defaultEnabled: true,
  },
  { id: '25k', name: '25km', distance: 25 },
  { id: '30k', name: '30km', distance: 30, defaultEnabled: true },
  { id: '35k', name: '35km', distance: 35 },
  { id: '40k', name: '40km', distance: 40 },
  {
    id: 'm',
    name: 'M',
    longName: 'Marathon',
    distance: MARATHON_DISTANCE,
    important: true,
    defaultEnabled: true,
  },
  { id: '45k', name: '45km', distance: 45 },
  { id: '50k', name: '50km', distance: 50 },
  { id: '100k', name: '100km', distance: 100 },
];

export const INTERVAL_UNITS = {
  speed: ['km/h', 'mi/h'],
  pace: ['sec/km', 'sec/mi'],
}

export const DEFAULT_PREFERENCES = {
  paceBoundsUnit: 'min/km',
  paceDisplay: 'pace',
  paceDisplayUnit: 'both',
  showMs: false,
  selectedDistances: STANDARD_DISTANCES.filter((d) => d.defaultEnabled).map((d) => d.id),
  emphasizedDistances: STANDARD_DISTANCES.filter((d) => d.important).map((d) => d.id),
  customDistance: {
    enabled: false,
    value: 4.167,
    unit: 'mi',
  },

  // duplicates for validation
  intervalValue: '0.2',
  intervalInput: '0.2',
  minPaceValue: '2:51',
  minPaceInput: '2:51',
  maxPaceValue: '8:34',
  maxPaceInput: '8:34',

  intervalUnit: 'km/h',
  highlightedSpeeds: [],
  sortAsc: true,
};
