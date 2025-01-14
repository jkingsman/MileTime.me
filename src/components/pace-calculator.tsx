import { useMemo, useState, useEffect, useRef } from "react";

import {
  KM_TO_MILES,
  MILE_TO_KM,
  STORAGE_KEY,
  STORAGE_VERSION_KEY,
  STORAGE_VERSION,
  STANDARD_DISTANCES,
  DEFAULT_PREFERENCES,
} from "./constants";
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

  const [minPaceValue, setMinPaceValue] = useState(
    () => loadPreferences().minPaceValue
  );
  const [minPaceInput, setMinPaceInput] = useState(
    () => loadPreferences().minPaceInput
  );
  const [maxPaceValue, setMaxPaceValue] = useState(
    () => loadPreferences().maxPaceValue
  );
  const [maxPaceInput, setMaxPaceInput] = useState(
    () => loadPreferences().maxPaceInput
  );

  const [paceBoundsUnit, setpaceBoundsUnit] = useState(
    () => loadPreferences().paceBoundsUnit
  );
  const [paceDisplayUnit, setpaceDisplayUnit] = useState(
    () => loadPreferences().paceDisplayUnit
  );
  const [paceDisplay, setPaceDisplay] = useState(
    () => loadPreferences().paceDisplay
  );
  const [selectedDistances, setSelectedDistances] = useState<Set<string>>(
    () => new Set(loadPreferences().selectedDistances)
  );
  const [emphasizedDistances, setEmphasizedDistances] = useState<Set<string>>(
    () => new Set(loadPreferences().emphasizedDistances)
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
  const [hightlightedSpeeds, setHightlightedSpeeds] = useState<Set<string>>(
    () => new Set(loadPreferences().hightlightedSpeeds)
  );
  const [sortAsc, setSortAsc] = useState(() => loadPreferences().sortAsc);

  const [settingsExpanded, toggleSettingsExpanded] = useState(false);

  const [hasOverflow, setHasOverflow] = useState(false);
  const tableContainer = useRef(null);

  useEffect(() => {
    const checkOverflow = () => {
      if (tableContainer.current) {
        setHasOverflow(document.body.scrollWidth > document.body.clientWidth);
      }
    };

    const resizeObserver = new ResizeObserver(checkOverflow);

    if (tableContainer.current) {
      resizeObserver.observe(tableContainer.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const preferences = {
      minPaceValue,
      maxPaceValue,
      minPaceInput,
      maxPaceInput,
      paceBoundsUnit,
      paceDisplay,
      paceDisplayUnit,
      selectedDistances: Array.from(selectedDistances),
      emphasizedDistances: Array.from(emphasizedDistances),
      customDistance,
      intervalValue,
      intervalInput,
      intervalUnit,
      hightlightedSpeeds: Array.from(hightlightedSpeeds),
      sortAsc,
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
    paceBoundsUnit,
    paceDisplay,
    paceDisplayUnit,
    selectedDistances,
    emphasizedDistances,
    customDistance,
    intervalValue,
    intervalInput,
    intervalUnit,
    hightlightedSpeeds,
    sortAsc,
  ]);

  const handleSetToggle = (
    setKey: string,
    selectedSet: Set<string>,
    setter: (value: Set<string>) => void
  ) => {
    const newSelected = new Set(selectedSet);
    if (newSelected.has(setKey)) {
      newSelected.delete(setKey);
    } else {
      newSelected.add(setKey);
    }
    setter(newSelected);
  };

  const handleNumericalValidatableChange = (
    value: string,
    validator: (value: string) => number,
    inputSetter: (value: string) => void,
    valueSetter: (value: string) => void
  ) => {
    inputSetter(value);
    const parsed = validator(value);
    if (!isNaN(parsed) && parsed > 0) {
      valueSetter(value);
      inputSetter(value);
    }
  };

  const paceData = useMemo(() => {
    const data = [];

    const interval =
      intervalUnit === "mi/h"
        ? parseFloat(intervalValue) * MILE_TO_KM
        : parseFloat(intervalValue);
    const paceModifier = paceBoundsUnit === "min/km" ? 1 : MILE_TO_KM;
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

      const customTime =
        ((customDistance.unit === "mi"
          ? customDistance.value * MILE_TO_KM
          : customDistance.value) /
          kph) *
        3600;

      data.push({
        kph: kph.toFixed(countDecimals(interval)),
        mph: mph.toFixed(countDecimals(interval)),
        minPerKm: formatPace(minPerKm * 60),
        minPerMile: formatPace(minPerMile * 60),
        minPerKmRaw: minPerKm,
        minPerMileRaw: minPerMile,
        standardTimes: standardTimes.map(formatTime),
        customTime: customDistance.enabled ? formatTime(customTime) : null,
      });
    }
    return data;
  }, [
    intervalValue,
    intervalUnit,
    customDistance,
    minPaceValue,
    maxPaceValue,
    paceBoundsUnit,
  ]);

  return (
    <>
      <div className="text-4xl p-2 bg-gray-50 print:hidden">MileTime.me</div>
      <div className="space-y-4 p-2 bg-gray-50 rounded-lg print:hidden">
        {/* Pace Controls */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="text-md font-medium">Pace Range:</div>
            <input
              aria-label="minimum pace"
              type="text"
              value={minPaceInput}
              onChange={(e) =>
                handleNumericalValidatableChange(
                  e.target.value,
                  parsePace,
                  setMinPaceInput,
                  setMinPaceValue
                )
              }
              className={`border rounded px-2 py-1 w-16 ${
                minPaceInput === minPaceValue ? "bg-white" : "bg-red-50"
              }`}
            />
            to
            <input
              aria-label="maximum pace"
              type="text"
              value={maxPaceInput}
              onChange={(e) =>
                handleNumericalValidatableChange(
                  e.target.value,
                  parsePace,
                  setMaxPaceInput,
                  setMaxPaceValue
                )
              }
              className={`border rounded px-2 py-1 w-16 ${
                maxPaceInput === maxPaceValue ? "bg-white" : "bg-red-50"
              }`}
            />
            <select
              aria-label="pace bounds units"
              id="paceBoundsUnit"
              value={paceBoundsUnit}
              onChange={(e) => setpaceBoundsUnit(e.target.value)}
              className="border rounded px-2 py-1"
            >
              <option value="min/km">min/km</option>
              <option value="min/mi">min/mi</option>
            </select>
          </div>
        </div>
      </div>

      <details
        className="px-2 pb-4 bg-gray-50 print:hidden"
        open={settingsExpanded}
      >
        <summary
          className="text-lg cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            toggleSettingsExpanded(!settingsExpanded);
            return false;
          }}
        >
          {settingsExpanded ? "Hide Configuration" : "Show Configuration"}
        </summary>

        {/* Pace Display Controls */}
        <div className="flex items-center gap-4 p-2 mt-0 space-y-2">
          <label className="text-md font-medium">Pace/Speed:</label>
          <div className="flex gap-4 items-center flex-wrap">
            <label htmlFor="paceAndSpeed" className="flex items-center gap-1">
              <input
                id="paceAndSpeed"
                type="radio"
                value="both"
                checked={paceDisplay === "both"}
                onChange={(e) => setPaceDisplay(e.target.value)}
              />
              pace+speed
            </label>
            <label htmlFor="pace" className="flex items-center gap-1">
              <input
                id="pace"
                type="radio"
                value="pace"
                checked={paceDisplay === "pace"}
                onChange={(e) => setPaceDisplay(e.target.value)}
              />
              pace
            </label>
            <label htmlFor="speedDisplay" className="flex items-center gap-1">
              <input
                id="speedDisplay"
                type="radio"
                value="speed"
                checked={paceDisplay === "speed"}
                onChange={(e) => setPaceDisplay(e.target.value)}
              />
              speed
            </label>
          </div>
        </div>

        {/* Pace Unit Controls */}
        <div className="flex items-center gap-4 p-2 mt-0">
          <label className="text-md font-medium">Pace Units:</label>
          <div className="flex gap-4 flex-wrap">
            <label htmlFor="paceBoth" className="flex items-center gap-1">
              <input
                id="paceBoth"
                type="radio"
                value="both"
                checked={paceDisplayUnit === "both"}
                onChange={(e) => setpaceDisplayUnit(e.target.value)}
              />
              km+mi
            </label>
            <label htmlFor="paceKm" className="flex items-center gap-1">
              <input
                id="paceKm"
                type="radio"
                value="km"
                checked={paceDisplayUnit === "km"}
                onChange={(e) => setpaceDisplayUnit(e.target.value)}
              />
              km
            </label>
            <label htmlFor="paceMi" className="flex items-center gap-1">
              <input
                id="paceMi"
                type="radio"
                value="mi"
                checked={paceDisplayUnit === "mi"}
                onChange={(e) => setpaceDisplayUnit(e.target.value)}
              />
              mi
            </label>
          </div>
        </div>

        {/* Distance Selection */}
          <div className="gap-4 p-2 mt-0 space-y-2">
            <label className="text-md font-medium block">Show Distances:</label>
            <div className="flex flex-wrap gap-4">
              {STANDARD_DISTANCES.map((dist) => (
                <label key={dist.id} className="flex items-center gap-1">
                  <input
                    aria-label={dist.longName ?? dist.name}
                    type="checkbox"
                    checked={selectedDistances.has(dist.id)}
                    onChange={() =>
                      handleSetToggle(
                        dist.id,
                        selectedDistances,
                        setSelectedDistances
                      )
                    }
                  />
                  <DistanceNameDisplay dist={dist} />
                </label>
              ))}
            </div>

          {/* Custom Distance */}
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
              step="0.1"
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

          {/* Distance Emphasis */}
          <div className="space-y-2">
            <label className="text-md font-medium block">
              Emphasize Distances:
            </label>
            <div className="flex flex-wrap gap-4">
              {STANDARD_DISTANCES.filter((dist) =>
                selectedDistances.has(dist.id)
              ).map((dist) => (
                <label key={dist.id} className="flex items-center gap-1">
                  <input
                    aria-label={dist.longName ?? dist.name}
                    type="checkbox"
                    checked={emphasizedDistances.has(dist.id)}
                    onChange={() =>
                      handleSetToggle(
                        dist.id,
                        emphasizedDistances,
                        setEmphasizedDistances
                      )
                    }
                  />
                  <DistanceNameDisplay dist={dist} />
                </label>
              ))}
              {customDistance.enabled && (
                <label key="customDist" className="flex items-center gap-1">
                <input
                  aria-label="custom distance"
                  type="checkbox"
                  checked={emphasizedDistances.has("custom")}
                  onChange={() =>
                    handleSetToggle(
                      "custom",
                      emphasizedDistances,
                      setEmphasizedDistances
                    )
                  }
                />
                Custom ({customDistance.value}{customDistance.unit})
              </label>
              )}
            </div>
          </div>
        </div>

        {/* Interval Controls */}
        <div className="p-2 mt-0 space-y-2">
          <div className="flex items-center gap-4">
            <label htmlFor="rowInterval" className="text-md font-medium">
              Row Interval:
            </label>
            <input
              id="rowInterval"
              type="number"
              step="0.1"
              min="0"
              value={intervalInput}
              onChange={(e) =>
                handleNumericalValidatableChange(
                  e.target.value,
                  parseFloat,
                  setIntervalInput,
                  setIntervalValue
                )
              }
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

          {/* Order Controls */}
          <div className="flex items-center gap-4">
            <label className="text-md font-medium">Table Order:</label>
            <div className="flex gap-4 flex-wrap">
              <label htmlFor="sortDesc" className="flex items-center gap-1">
                <input
                  id="sortDesc"
                  type="radio"
                  value="descending"
                  checked={!sortAsc}
                  onChange={() => setSortAsc(false)}
                />
                desc
              </label>
              <label htmlFor="sortAsc" className="flex items-center gap-1">
                <input
                  id="sortAsc"
                  type="radio"
                  value="ascending"
                  checked={sortAsc}
                  onChange={() => setSortAsc(true)}
                />
                asc
              </label>
            </div>
          </div>
        </div>
        <div className="p-2 bg-gray-50 flex gap-2 pt-2 print:hidden">
          <button
            onClick={resetPage}
            className="text-xs font-medium bg-transparent hover:bg-yellow-500 text-yellow-700 font-semibold hover:text-white py-2 px-4 border border-yellow-500 hover:border-transparent rounded"
          >
            Reset Page
          </button>
        </div>
      </details>

      {hasOverflow && (
        <div className="text-amber-600 p-2 text-sm">
          Warning! Tables wider than the screen may not display correctly on
          mobile devices. Please use a larger screen or landscape orientation
          for best results.
        </div>
      )}

      <div className="table-container relative">
        <table
          ref={tableContainer}
          className="min-w-full border-collapse table-fixed text-xs md:text-sm overflow-auto"
        >
          <thead className="sticky -top-1 z-50">
            <tr>
              {paceDisplayUnit !== "mi" && (
                <>
                  {(paceDisplay == "both" || paceDisplay == "pace") && (
                    <th className="border p-1 py-2 sm:p-2 bg-emerald-100 w-[5vw]">
                      Pace
                      <br />
                      (min/km)
                    </th>
                  )}
                  {(paceDisplay == "both" || paceDisplay == "speed") && (
                    <th className="border p-1 py-2 sm:p-2 bg-sky-100 w-[5vw]">
                      Speed
                      <br />
                      (km/h)
                    </th>
                  )}
                </>
              )}
              {paceDisplayUnit !== "km" && (
                <>
                  {(paceDisplay == "both" || paceDisplay == "pace") && (
                    <th className="border p-1 py-2 sm:p-2 bg-teal-100 w-[5vw]">
                      Pace
                      <br />
                      (min/mi)
                    </th>
                  )}
                  {(paceDisplay == "both" || paceDisplay == "speed") && (
                    <th className="border p-1 py-2 sm:p-2 bg-cyan-100 w-[5vw]">
                      Speed
                      <br />
                      (mph)
                    </th>
                  )}
                </>
              )}
              {STANDARD_DISTANCES.map(
                (dist) =>
                  selectedDistances.has(dist.id) && (
                    <th
                      key={dist.id}
                      className="border p-1 py-2 bg-white sm:p-2 print:text-lg text-sm md:text-lg w-[10vw]"
                    >
                      <DistanceNameDisplay dist={dist} />
                    </th>
                  )
              )}
              {customDistance.enabled && (
                <th className="border p-1 py-2 bg-white sm:p-2 print:text-lg text-sm md:text-lg w-[10vw]">
                  {customDistance.value}{customDistance.unit}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {/* Not quite ES2023 safe yet... .slice().reverse() instead of .toReverse() */}
            {(sortAsc ? paceData : paceData.slice().reverse()).map(
              (row, index) => (
                <tr
                  key={row.kph}
                  className={
                    hightlightedSpeeds.has(row.kph)
                      ? "bg-yellow-100"
                      : index % 2 === 0
                      ? "bg-white"
                      : "bg-gray-50"
                  }
                  onClick={() =>
                    handleSetToggle(
                      row.kph,
                      hightlightedSpeeds,
                      setHightlightedSpeeds
                    )
                  }
                >
                  {paceDisplayUnit !== "mi" && (
                    <>
                      {(paceDisplay == "both" || paceDisplay == "pace") && (
                        <td
                          className={
                            hightlightedSpeeds.has(row.kph)
                              ? "border p-1 py-2 sm:p-2 text-center bg-yellow-100"
                              : index % 2 === 0
                              ? "border p-1 py-2 sm:p-2 text-center bg-teal-50"
                              : "border p-1 py-2 sm:p-2 text-center bg-teal-100"
                          }
                        >
                          {row.minPerKm}
                        </td>
                      )}
                      {(paceDisplay == "both" || paceDisplay == "speed") && (
                        <td
                          className={
                            hightlightedSpeeds.has(row.kph)
                              ? "border p-1 py-2 sm:p-2 text-center bg-yellow-100"
                              : index % 2 === 0
                              ? "border p-1 py-2 sm:p-2 text-center bg-sky-50"
                              : "border p-1 py-2 sm:p-2 text-center bg-sky-100"
                          }
                        >
                          {row.kph}
                        </td>
                      )}
                    </>
                  )}
                  {paceDisplayUnit !== "km" && (
                    <>
                      {(paceDisplay == "both" || paceDisplay == "pace") && (
                        <td
                          className={
                            hightlightedSpeeds.has(row.kph)
                              ? "border p-1 py-2 sm:p-2 text-center bg-yellow-100"
                              : index % 2 === 0
                              ? "border p-1 py-2 sm:p-2 text-center bg-teal-50"
                              : "border p-1 py-2 sm:p-2 text-center bg-teal-100"
                          }
                        >
                          {row.minPerMile}
                        </td>
                      )}
                      {(paceDisplay == "both" || paceDisplay == "speed") && (
                        <td
                          className={
                            hightlightedSpeeds.has(row.kph)
                              ? "border p-1 py-2 sm:p-2 text-center bg-yellow-100"
                              : index % 2 === 0
                              ? "border p-1 py-2 sm:p-2 text-center bg-sky-50"
                              : "border p-1 py-2 sm:p-2 text-center bg-sky-100"
                          }
                        >
                          {row.mph}
                        </td>
                      )}
                    </>
                  )}
                  {STANDARD_DISTANCES.map(
                    (dist, i) =>
                      selectedDistances.has(dist.id) && (
                        <td
                          key={dist.id}
                          className={`border p-1 py-2 sm:p-2 text-center ${
                            emphasizedDistances.has(dist.id) ? "font-bold" : ""
                          }`}
                        >
                          {row.standardTimes[i]}
                        </td>
                      )
                  )}
                  {customDistance.enabled && (
                    <td className={`border p-1 py-2 sm:p-2 text-center ${
                      emphasizedDistances.has("custom") ? "font-bold" : ""
                    }`}>
                      {row.customTime}
                    </td>
                  )}
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default PaceCalculator;
