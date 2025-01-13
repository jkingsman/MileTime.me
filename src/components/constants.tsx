export const MARATHON_DISTANCE = 42.195;
export const KM_TO_MILES = 0.621371;
export const MILE_TO_KM = 1 / KM_TO_MILES;
export const STORAGE_KEY = "paceCalculatorPreferences";

export const STORAGE_VERSION_KEY = "storageVersion";
export const STORAGE_VERSION = 5;

export const STANDARD_DISTANCES = [
  {
    id: "5k",
    name: "5 km",
    distance: 5,
    important: true,
    defaultEnabled: true,
  },
  {
    id: "10k",
    name: "10 km",
    distance: 10,
    defaultEnabled: true,
  },
  { id: "15k", name: "15 km", distance: 15 },
  { id: "20k", name: "20 km", distance: 20, defaultEnabled: true },
  {
    id: "hm",
    name: "HM",
    distance: MARATHON_DISTANCE / 2,
    important: true,
    defaultEnabled: true,
  },
  { id: "25k", name: "25 km", distance: 25 },
  { id: "30k", name: "30 km", distance: 30, defaultEnabled: true },
  { id: "35k", name: "35 km", distance: 35 },
  { id: "40k", name: "40 km", distance: 40 },
  {
    id: "m",
    name: "M",
    distance: MARATHON_DISTANCE,
    important: true,
    defaultEnabled: true,
  },
  { id: "45k", name: "45 km", distance: 45 },
  { id: "50k", name: "50 km", distance: 50 },
  { id: "100k", name: "100 km", distance: 100 },
];

export const DEFAULT_PREFERENCES = {
  paceUnit: "min/km",
  displayUnit: "both",
  selectedDistances: STANDARD_DISTANCES.filter((d) => d.defaultEnabled).map(
    (d) => d.id
  ),
  customDistance: {
    enabled: false,
    value: 5,
    unit: "mi",
  },

  // duplicates for validation
  intervalValue: "0.1",
  intervalInput: "0.1",
  minPaceValue: "2:51",
  minPaceInput: "2:51",
  maxPaceValue: "8:34",
  maxPaceInput: "8:34",

  intervalUnit: "km/h",
  highlightedSpeeds: [],
};

export interface CustomDistance {
  enabled?: boolean;
  value?: number;
  unit?: string;
}
