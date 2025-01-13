import { useMemo, useState, useEffect } from "react";

import {KM_TO_MILES, MILE_TO_KM, STORAGE_KEY, STORAGE_VERSION_KEY, STORAGE_VERSION, STANDARD_DISTANCES, DEFAULT_PREFERENCES} from "./constants";
import {
  formatPace,
  parsePace,
  formatTime,
  resetPage,
  countDecimals,
} from "./utils";
import { DistanceNameDisplay } from "./ui_helpers";
import { CustomDistance } from "./types";

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
  const [hightlightedSpeeds, setHightlightedSpeeds] = useState(
    () => new Set(loadPreferences().hightlightedSpeeds)
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
      hightlightedSpeeds: Array.from(hightlightedSpeeds),
    };

    try {
      localStorage.setItem(
        STORAGE_VERSION_KEY,
        JSON.stringify(STORAGE_VERSION)
      );
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
    intervalInput,
    intervalUnit,
    hightlightedSpeeds,
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
      setMinPaceValue(value);
      setMinPaceInput(value);
    }
  };

  const handleMaxPaceChange = (value: string) => {
    setMaxPaceInput(value);
    const parsed = parsePace(value);
    if (!isNaN(parsed) && parsed > 0) {
      setMaxPaceValue(value);
      setMaxPaceInput(value);
    }
  };

  const handleHighlightToggle = (speed: string) => {
    const newHighlightedSpeeds = new Set(hightlightedSpeeds);
    if (newHighlightedSpeeds.has(speed)) {
      newHighlightedSpeeds.delete(speed);
    } else {
      newHighlightedSpeeds.add(speed);
    }
    setHightlightedSpeeds(newHighlightedSpeeds);
    console.log(newHighlightedSpeeds);
  };

  const paceData = useMemo(() => {
    const getEffectiveInterval = () => {
      const value = parseFloat(intervalValue);
      return intervalUnit === "mi/h" ? value * MILE_TO_KM : value;
    };

    const data = [];
    const interval = getEffectiveInterval();

    const paceModifier = paceUnit === "min/km" ? 1 : MILE_TO_KM;
    const minPaceValueParsed = (60 / parsePace(minPaceValue)) * paceModifier;
    const maxPaceValueParsed = (60 / parsePace(maxPaceValue)) * paceModifier;

    for (
      let kph = maxPaceValueParsed;
      kph <= minPaceValueParsed;
      kph += interval
    ) {
      kph = Number(kph.toFixed(countDecimals(interval)));

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
        kph: kph.toFixed(countDecimals(interval)),
        mph: mph.toFixed(countDecimals(interval)),
        minPerKm: formatPace(minPerKm * 60),
        minPerMile: formatPace(minPerMile * 60),
        minPerKmRaw: minPerKm,
        minPerMileRaw: minPerMile,
        standardTimes: standardTimes.map(formatTime),
        customTime: customTime ? formatTime(customTime) : null,
      });
    }
    return data;
  }, [
    intervalValue,
    intervalUnit,
    customDistance,
    minPaceValue,
    maxPaceValue,
    paceUnit,
  ]);

  return (
    <div>
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
                minPaceInput === minPaceValue ? "bg-white" : "bg-red-50"
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
                maxPaceInput === maxPaceValue ? "bg-white" : "bg-red-50"
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
              intervalInput === intervalValue ? "bg-white" : "bg-red-50"
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
                  aria-label={dist.longName ?? dist.name}
                  type="checkbox"
                  checked={selectedDistances.has(dist.id)}
                  onChange={() => handleDistanceToggle(dist.id)}
                />
                <DistanceNameDisplay dist={dist} />
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
            <button
              onClick={resetPage}
              className="text-xs font-medium bg-transparent hover:bg-yellow-500 text-yellow-700 font-semibold hover:text-white py-2 px-4 border border-yellow-500 hover:border-transparent rounded"
            >
              Reset Page
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto table-container">
        <table className="min-w-full border-collapse table-fixed text-xs md:text-sm">
          <thead>
            <tr>
              {displayUnit !== "mi" && (
                <>
                  <th className="border p-2 bg-teal-100 w-[5vw]">
                    Pace
                    <br />
                    (min/km)
                  </th>
                  <th className="border p-2 bg-sky-100 w-[5vw]">
                    Speed
                    <br />
                    (km/h)
                  </th>
                </>
              )}
              {displayUnit !== "km" && (
                <>
                  <th className="border p-2 bg-teal-100 w-[5vw]">
                    Pace
                    <br />
                    (min/mi)
                  </th>
                  <th className="border p-2 bg-sky-100 w-[5vw]">
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
                      className={`border p-2 w-[10vw] ${
                        dist.important ? "font-bold" : ""
                      }`}
                    >
                      <DistanceNameDisplay dist={dist} />
                    </th>
                  )
              )}
              {customDistance.enabled && (
                <th className="border p-2 w-[10vw]">
                  {customDistance.value} {customDistance.unit}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {paceData.map((row, index) => (
              <tr
                key={row.kph}
                className={
                  hightlightedSpeeds.has(row.kph)
                    ? "bg-yellow-200"
                    : index % 2 === 0
                    ? "bg-white"
                    : "bg-gray-50"
                }
                onClick={() => handleHighlightToggle(row.kph)}
              >
                {displayUnit !== "mi" && (
                  <>
                    <td
                      className={
                        hightlightedSpeeds.has(row.kph)
                          ? "border p-2 text-center bg-yellow-100"
                          : index % 2 === 0
                          ? "border p-2 text-center bg-teal-50"
                          : "border p-2 text-center bg-teal-100"
                      }
                    >
                      {row.minPerKm}
                    </td>
                    <td
                      className={
                        hightlightedSpeeds.has(row.kph)
                          ? "border p-2 text-center bg-yellow-100"
                          : index % 2 === 0
                          ? "border p-2 text-center bg-sky-50"
                          : "border p-2 text-center bg-sky-100"
                      }
                    >
                      {row.kph}
                    </td>
                  </>
                )}
                {displayUnit !== "km" && (
                  <>
                    <td
                      className={
                        hightlightedSpeeds.has(row.kph)
                          ? "border p-2 text-center bg-yellow-100"
                          : "border p-2 text-center bg-teal-50"
                      }
                    >
                      {row.minPerMile}
                    </td>
                    <td
                      className={
                        hightlightedSpeeds.has(row.kph)
                          ? "border p-2 text-center bg-yellow-100"
                          : "border p-2 text-center bg-sky-50"
                      }
                    >
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
    </div>
  );
};

export default PaceCalculator;
