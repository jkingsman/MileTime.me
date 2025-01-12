import { useMemo, useState, useEffect } from "react";

const MARATHON_DISTANCE = 42.195;
const KM_TO_MILES = 0.621371;
const MILE_TO_KM = 1 / KM_TO_MILES;
const STORAGE_KEY = "paceCalculatorPreferences";

const STORAGE_VERSION_KEY = "storageVersion";
const STORAGE_VERSION = 4;

const STANDARD_DISTANCES = [
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

const DEFAULT_PREFERENCES = {
  paceUnit: "min/km",
  displayUnit: "both",
  selectedDistances: STANDARD_DISTANCES.filter((d) => d.defaultEnabled).map((d) => d.id),
  customDistance: {
    enabled: false,
    value: 5,
    unit: "mi",
  },

  // duplicates for validation
  intervalValue: "0.1",
  intervalInput: "0.1",
  minPaceValue: "2'52\"",
  minPaceInput: "2'52\"",
  maxPaceValue: "8'34\"",
  maxPaceInput: "8'34\"",

  intervalUnit: "km/h",
};

interface CustomDistance {
  enabled?: boolean;
  value?: number;
  unit?: string;
}

const formatPace = (paceInSeconds: number) => {
  const minutes = Math.floor(paceInSeconds / 60);
  const seconds = Math.round(paceInSeconds % 60);
  return `${minutes}'${seconds.toString().padStart(2, "0")}"`;
};

const parsePace = (paceStr: string) => {
  const [minutes, seconds] = paceStr.split("'");
  if (!minutes || !seconds) {
    return NaN;
  }
  return parseFloat(minutes) + parseFloat(seconds.replace('"', "")) / 60;
};

const formatTime = (timeInSeconds: number) => {
  const hours = Math.floor(timeInSeconds / 3600);
  const minutes = Math.floor((timeInSeconds % 3600) / 60);
  const seconds = Math.round(timeInSeconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};


const resetPage = () => {
  localStorage.clear();
  window.location.reload();
}

const PaceCalculator = () => {
  // Load preferences from localStorage or use defaults
  const loadPreferences = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);

      const storedStorageVersion = localStorage.getItem(STORAGE_VERSION_KEY);
      const storedVersionMatches =
        storedStorageVersion &&
        JSON.parse(storedStorageVersion) == STORAGE_VERSION;

      if (storedVersionMatches && stored) {
        const parsed = JSON.parse(stored);
        return {
          ...DEFAULT_PREFERENCES,
          ...parsed,
        };
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
    }
    return DEFAULT_PREFERENCES;
  };

  const [minPaceValue, setMinPaceValue] = useState(() => loadPreferences().minPaceValue);
  const [minPaceInput, setMinPaceInput] = useState(() => loadPreferences().minPaceInput);
  const [maxPaceValue, setMaxPaceValue] = useState(() => loadPreferences().maxPaceValue);
  const [maxPaceInput, setMaxPaceInput] = useState(() => loadPreferences().maxPaceInput);

  const [paceUnit, setPaceUnit] = useState(() => loadPreferences().paceUnit);
  const [displayUnit, setDisplayUnit] = useState(
    () => loadPreferences().displayUnit
  );
  const [selectedDistances, setSelectedDistances] = useState(
    () => new Set(loadPreferences().selectedDistances)
  );
  const [customDistance, setCustomDistance] = useState(
    () => loadPreferences().customDistance
  );
  const [intervalValue, setIntervalValue] = useState(
    () => loadPreferences().intervalValue
  );
  const [intervalInput, setIntervalInput] = useState(
    () => loadPreferences().intervalInput
  );
  const [intervalUnit, setIntervalUnit] = useState(
    () => loadPreferences().intervalUnit
  );

  useEffect(() => {
    const preferences = {
      minPaceValue,
      maxPaceValue,
      minPaceInput,
      maxPaceInput,
      paceUnit,
      displayUnit,
      selectedDistances: Array.from(selectedDistances),
      customDistance,
      intervalValue,
      intervalInput,
      intervalUnit,
    };

    try {
      localStorage.setItem(STORAGE_VERSION_KEY, JSON.stringify(STORAGE_VERSION));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error("Error saving preferences:", error);
    }
  }, [
    minPaceValue,
    maxPaceValue,
    minPaceInput,
    maxPaceInput,
    paceUnit,
    displayUnit,
    selectedDistances,
    customDistance,
    intervalValue,
    intervalUnit,
  ]);

  const handleDistanceToggle = (distanceId: string) => {
    const newSelected = new Set(selectedDistances);
    if (newSelected.has(distanceId)) {
      newSelected.delete(distanceId);
    } else {
      newSelected.add(distanceId);
    }
    setSelectedDistances(newSelected);
  };

  const handleIntervalChange = (value: string) => {
    setIntervalInput(value);
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed > 0) {
      setIntervalValue(parsed);
      setIntervalInput(parsed);
    }
  };

  const handleMinPaceChange = (value: string) => {
    setMinPaceInput(value);
    const parsed = parsePace(value);
    if (!isNaN(parsed) && parsed > 0) {
      console.log(`Setting as valid ${parsed}`)
      setMinPaceValue(value);
      setMinPaceInput(value);
    }
  };

  const handleMaxPaceChange = (value: string) => {
    setMaxPaceInput(value);
    const parsed = parsePace(value);
    if (!isNaN(parsed) && parsed > 0) {
      console.log(`Setting as valid ${parsed}`)
      setMaxPaceValue(value);
      setMaxPaceInput(value);
    }
  };

  const paceData = useMemo(() => {
    const getEffectiveInterval = () => {
      const value = parseFloat(intervalValue);
      return intervalUnit === "mi/h" ? value * MILE_TO_KM : value;
    };

    const data = [];
    const interval = getEffectiveInterval();
    for (let kph = 7.0; kph <= 21.0; kph += interval) {
      kph = Number(kph.toFixed(3));

      const mph = kph * KM_TO_MILES;
      const minPerKm = 60 / kph;
      const minPerMile = 60 / mph;

      const standardTimes = STANDARD_DISTANCES.map(
        (dist) => (dist.distance / kph) * 3600
      );

      const customTime = customDistance.enabled
        ? ((customDistance.unit === "mi"
            ? customDistance.value * MILE_TO_KM
            : customDistance.value) /
            kph) *
          3600
        : null;

      data.push({
        kph,
        mph: mph.toFixed(1),
        minPerKm: formatPace(minPerKm * 60),
        minPerMile: formatPace(minPerMile * 60),
        minPerKmRaw: minPerKm,
        minPerMileRaw: minPerMile,
        standardTimes: standardTimes.map(formatTime),
        customTime: customTime ? formatTime(customTime) : null,
      });
    }
    return data;
  }, [intervalValue, intervalUnit, customDistance]);

  const filteredData = useMemo(() => {
    const minPaceValueParsed = parsePace(minPaceValue);
    const maxPaceValueParsed = parsePace(maxPaceValue);

    return paceData.filter((row) => {
      const rowPace =
        paceUnit === "min/km" ? row.minPerKmRaw : row.minPerMileRaw;
      return rowPace >= minPaceValueParsed && rowPace <= maxPaceValueParsed;
    });
  }, [paceData, minPaceValue, maxPaceValue, paceUnit]);

  return (
    <div className="w-full max-w-full space-y-4">
      <div className="space-y-4 p-4 bg-gray-50 rounded-lg controls-container">
        {/* Pace Controls */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="minPace" className="text-sm font-medium">
              Min Pace:
            </label>
            <input
              id="minPace"
              type="text"
              value={minPaceInput}
              onChange={(e) => handleMinPaceChange(e.target.value)}
              className={`border rounded px-2 py-1 w-24 ${
                minPaceInput === minPaceValue ? 'bg-white' : 'bg-red-50'
              }`}
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="maxPace" className="text-sm font-medium">
              Max Pace:
            </label>
            <input
              id="maxPace"
              type="text"
              value={maxPaceInput}
              onChange={(e) => handleMaxPaceChange(e.target.value)}
              className={`border rounded px-2 py-1 w-24 ${
                maxPaceInput === maxPaceValue ? 'bg-white' : 'bg-red-50'
              }`}
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="paceUnit" className="text-sm font-medium">
              Min/Max Unit:
            </label>
            <select
              id="paceUnit"
              value={paceUnit}
              onChange={(e) => setPaceUnit(e.target.value)}
              className="border rounded px-2 py-1"
            >
              <option value="min/km">min/km</option>
              <option value="min/mi">min/mi</option>
            </select>
          </div>
        </div>

        {/* Pace Unit Controls */}
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Pace Units:</label>
          <div className="flex gap-4">
            <label htmlFor="kmDisplay" className="flex items-center gap-1">
              <input
                id="kmDisplay"
                type="radio"
                value="km"
                checked={displayUnit === "km"}
                onChange={(e) => setDisplayUnit(e.target.value)}
              />
              Metric
            </label>
            <label htmlFor="miDisplay" className="flex items-center gap-1">
              <input
                id="mileDisplay"
                type="radio"
                value="mi"
                checked={displayUnit === "mi"}
                onChange={(e) => setDisplayUnit(e.target.value)}
              />
              Imperial
            </label>
            <label htmlFor="bothDisplay" className="flex items-center gap-1">
              <input
                id="bothDisplay"
                type="radio"
                value="both"
                checked={displayUnit === "both"}
                onChange={(e) => setDisplayUnit(e.target.value)}
              />
              Both
            </label>
          </div>
        </div>

        {/* Interval Controls */}
        <div className="flex items-center gap-4">
          <label htmlFor="rowInterval" className="text-sm font-medium">
            Row Interval:
          </label>
          <input
            id="rowInterval"
            type="number"
            step="0.1"
            min="0"
            value={intervalInput}
            onChange={(e) => handleIntervalChange(e.target.value)}
            className={`border rounded px-2 py-1 w-24 ${
              intervalInput === intervalValue ? 'bg-white' : 'bg-red-50'
            }`}
          />
          <select
            aria-label="Row interval unit"
            value={intervalUnit}
            onChange={(e) => setIntervalUnit(e.target.value)}
            className="border rounded px-2 py-1"
          >
            <option value="km/h">km/h</option>
            <option value="mi/h">mi/h</option>
          </select>
        </div>

        {/* Distance Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium block">Show Distances:</label>
          <div className="flex flex-wrap gap-4">
            {STANDARD_DISTANCES.map((dist) => (
              <label key={dist.id} className="flex items-center gap-1">
                <input
                  aria-label={dist.name}
                  type="checkbox"
                  checked={selectedDistances.has(dist.id)}
                  onChange={() => handleDistanceToggle(dist.id)}
                />
                {dist.name}
              </label>
            ))}
          </div>
        </div>

        {/* Custom Distance */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              aria-label="Custom distance enable"
              type="checkbox"
              checked={customDistance.enabled}
              onChange={(e) =>
                setCustomDistance((prev: CustomDistance) => ({
                  ...prev,
                  enabled: e.target.checked,
                }))
              }
            />
            <span className="text-sm font-medium">Custom Distance:</span>
          </label>
          <input
            aria-label="Custom distance value"
            type="number"
            min="0.1"
            value={customDistance.value}
            onChange={(e) =>
              setCustomDistance((prev: CustomDistance) => ({
                ...prev,
                value: e.target.value,
              }))
            }
            className="border rounded px-2 py-1 w-24"
            disabled={!customDistance.enabled}
          />
          <select
            aria-label="Custom distance unit"
            value={customDistance.unit}
            onChange={(e) =>
              setCustomDistance((prev: CustomDistance) => ({
                ...prev,
                unit: e.target.value,
              }))
            }
            className="border rounded px-2 py-1"
            disabled={!customDistance.enabled}
          >
            <option value="km">km</option>
            <option value="mi">mi</option>
          </select>
          </div>
          <div className="flex gap-2">
            <button onClick={resetPage} className="text-xs font-medium bg-transparent hover:bg-yellow-500 text-yellow-700 font-semibold hover:text-white py-2 px-4 border border-yellow-500 hover:border-transparent rounded">Reset Page</button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto table-container">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr>
              {displayUnit !== "mi" && (
                <>
                  <th className="border p-2 bg-teal-100">
                    Pace
                    <br />
                    (min/km)
                  </th>
                  <th className="border p-2 bg-sky-100">
                    Speed
                    <br />
                    (km/h)
                  </th>
                </>
              )}
              {displayUnit !== "km" && (
                <>
                  <th className="border p-2 bg-teal-100">
                    Pace
                    <br />
                    (min/mi)
                  </th>
                  <th className="border p-2 bg-sky-100">
                    Speed
                    <br />
                    (mph)
                  </th>
                </>
              )}
              {STANDARD_DISTANCES.map(
                (dist) =>
                  selectedDistances.has(dist.id) && (
                    <th
                      key={dist.id}
                      className={`border p-2 ${
                        dist.important ? "font-bold" : ""
                      }`}
                    >
                      {dist.name}
                    </th>
                  )
              )}
              {customDistance.enabled && (
                <th className="border p-2">
                  {customDistance.value} {customDistance.unit}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, index) => (
              <tr
                key={row.kph}
                className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
              >
                {displayUnit !== "mi" && (
                  <>
                    <td className="border p-2 text-center bg-teal-50">
                      {row.minPerKm}
                    </td>
                    <td className="border p-2 text-center bg-sky-50">
                      {row.kph.toFixed(1)}
                    </td>
                  </>
                )}
                {displayUnit !== "km" && (
                  <>
                    <td className="border p-2 text-center bg-teal-50">
                      {row.minPerMile}
                    </td>
                    <td className="border p-2 text-center bg-sky-50">
                      {row.mph}
                    </td>
                  </>
                )}
                {STANDARD_DISTANCES.map(
                  (dist, i) =>
                    selectedDistances.has(dist.id) && (
                      <td
                        key={dist.id}
                        className={`border p-2 text-center ${
                          dist.important ? "font-bold" : ""
                        }`}
                      >
                        {row.standardTimes[i]}
                      </td>
                    )
                )}
                {customDistance.enabled && (
                  <td className="border p-2 text-center">{row.customTime}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-center text-sm text-gray-600 mx-auto max-w-2xl p-4 footer-print-visible">
        from MileTime.me, made with love and open source by Jack Kingsman
      </div>
      <div className="text-center text-sm text-gray-600 mx-auto max-w-2xl p-4 footer">
        made with love and{" "}
        <a
          href="https://github.com/jkingsman/MileTime.me"
          target="_blank"
          className="text-blue-600 hover:text-blue-800 transition-colors duration-200 underline decoration-gray-300 hover:decoration-blue-800"
        >
          open source
        </a>{" "}
        by{" "}
        <a
          href="https://jacksbrain.com"
          target="_blank"
          className="text-blue-600 hover:text-blue-800 transition-colors duration-200 underline decoration-gray-300 hover:decoration-blue-800"
        >
          Jack Kingsman
        </a>
        .
        <br />
        this site is free, and ad-free, forever;{" "}
        <a
          href="https://ko-fi.com/jackkingsman"
          target="_blank"
          className="text-blue-600 hover:text-blue-800 transition-colors duration-200 underline decoration-gray-300 hover:decoration-blue-800"
        >
          donations to help offset server costs
        </a> are much appreciated :)
      </div>
    </div>
  );
};

export default PaceCalculator;
