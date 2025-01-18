import { useMemo, useState, useEffect, useRef } from 'react';

import {
  KM_TO_MILES,
  MILE_TO_KM,
  STORAGE_KEY,
  STORAGE_VERSION_KEY,
  STORAGE_VERSION,
  STANDARD_DISTANCES,
  DEFAULT_PREFERENCES,
} from './constants';
import { formatPace, parsePace, formatTime, resetPage, countDecimals } from './utils';
import { DistanceNameDisplay } from './ui_helpers';
import { CustomDistance } from './types';

const PaceCalculator = () => {
  // Load preferences from localStorage or use defaults
  const loadPreferences = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);

      const storedStorageVersion = localStorage.getItem(STORAGE_VERSION_KEY);
      const storedVersionMatches =
        storedStorageVersion && JSON.parse(storedStorageVersion) == STORAGE_VERSION;

      if (storedVersionMatches && stored) {
        const parsed = JSON.parse(stored);
        return {
          ...DEFAULT_PREFERENCES,
          ...parsed,
        };
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
    return DEFAULT_PREFERENCES;
  };

  const [minPaceValue, setMinPaceValue] = useState(() => loadPreferences().minPaceValue);
  const [minPaceInput, setMinPaceInput] = useState(() => loadPreferences().minPaceInput);
  const [maxPaceValue, setMaxPaceValue] = useState(() => loadPreferences().maxPaceValue);
  const [maxPaceInput, setMaxPaceInput] = useState(() => loadPreferences().maxPaceInput);

  const [paceBoundsUnit, setpaceBoundsUnit] = useState(() => loadPreferences().paceBoundsUnit);
  const [paceDisplayUnit, setpaceDisplayUnit] = useState(() => loadPreferences().paceDisplayUnit);
  const [paceDisplay, setPaceDisplay] = useState(() => loadPreferences().paceDisplay);
  const [selectedDistances, setSelectedDistances] = useState<Set<string>>(
    () => new Set(loadPreferences().selectedDistances)
  );
  const [emphasizedDistances, setEmphasizedDistances] = useState<Set<string>>(
    () => new Set(loadPreferences().emphasizedDistances)
  );
  const [customDistance, setCustomDistance] = useState(() => loadPreferences().customDistance);
  const [intervalValue, setIntervalValue] = useState(() => loadPreferences().intervalValue);
  const [intervalInput, setIntervalInput] = useState(() => loadPreferences().intervalInput);
  const [intervalUnit, setIntervalUnit] = useState(() => loadPreferences().intervalUnit);
  const [hightlightedSpeeds, setHightlightedSpeeds] = useState<Set<string>>(
    () => new Set(loadPreferences().hightlightedSpeeds)
  );
  const [sortAsc, setSortAsc] = useState(() => loadPreferences().sortAsc);

  const [hasOverflow, setHasOverflow] = useState(false);
  const [displayOverflowMessage, setDisplayOverflowMessage] = useState(false);

  const tableContainer = useRef<HTMLTableElement>(null);

  useEffect(() => {
    const checkOverflow = () => {
      if (tableContainer.current) {
        const rect = tableContainer.current.getBoundingClientRect();
        setHasOverflow(rect.width > document.body.clientWidth);
        setDisplayOverflowMessage(rect.width > document.body.clientWidth + 50);
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
      localStorage.setItem(STORAGE_VERSION_KEY, JSON.stringify(STORAGE_VERSION));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving preferences:', error);
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
      intervalUnit === 'mi/h' ? parseFloat(intervalValue) * MILE_TO_KM : parseFloat(intervalValue);
    const paceModifier = paceBoundsUnit === 'min/km' ? 1 : MILE_TO_KM;
    const minPaceValueParsed = (60 / parsePace(minPaceValue)) * paceModifier;
    const maxPaceValueParsed = (60 / parsePace(maxPaceValue)) * paceModifier;

    for (let kph = maxPaceValueParsed; kph <= minPaceValueParsed; kph += interval) {
      kph = Number(kph.toFixed(countDecimals(interval)));

      const mph = kph * KM_TO_MILES;
      const minPerKm = 60 / kph;
      const minPerMile = 60 / mph;

      const standardTimes = STANDARD_DISTANCES.map((dist) => (dist.distance / kph) * 3600);

      const customTime =
        ((customDistance.unit === 'mi' ? customDistance.value * MILE_TO_KM : customDistance.value) /
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
  }, [intervalValue, intervalUnit, customDistance, minPaceValue, maxPaceValue, paceBoundsUnit]);

  return (
    <>
      <div className="bg-gray-50 p-2 px-4 text-4xl print:hidden">MileTime.me</div>
      <div className="space-y-4 rounded-lg bg-gray-50 p-2 px-4 print:hidden">
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
              className={`w-16 rounded border px-2 py-1 ${
                minPaceInput === minPaceValue ? 'bg-white' : 'bg-red-50'
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
              className={`w-16 rounded border px-2 py-1 ${
                maxPaceInput === maxPaceValue ? 'bg-white' : 'bg-red-50'
              }`}
            />
            <select
              aria-label="pace bounds units"
              id="paceBoundsUnit"
              value={paceBoundsUnit}
              onChange={(e) => setpaceBoundsUnit(e.target.value)}
              className="rounded border px-2 py-1"
            >
              <option value="min/km">min/km</option>
              <option value="min/mi">min/mi</option>
            </select>
          </div>
        </div>
      </div>

      <details className="bg-gray-50 px-4 pb-2 print:hidden">
        <summary className="mb-2 cursor-pointer text-lg font-medium">Customize</summary>

        <div className="text-md flex items-center font-medium">Pace/Speed:</div>

        {/* Pace Display Controls */}
        <div className="ml-4 flex items-center gap-6">
          <label className="text-sm font-medium">Show:</label>
          <div className="flex items-center gap-4">
            <label htmlFor="pace" className="flex items-center gap-1">
              <input
                id="pace"
                type="radio"
                value="pace"
                checked={paceDisplay === 'pace'}
                onChange={(e) => setPaceDisplay(e.target.value)}
              />
              pace
            </label>
            <label htmlFor="speedDisplay" className="flex items-center gap-1">
              <input
                id="speedDisplay"
                type="radio"
                value="speed"
                checked={paceDisplay === 'speed'}
                onChange={(e) => setPaceDisplay(e.target.value)}
              />
              speed
            </label>
            <label htmlFor="paceAndSpeed" className="flex items-center gap-1">
              <input
                id="paceAndSpeed"
                type="radio"
                value="both"
                checked={paceDisplay === 'both'}
                onChange={(e) => setPaceDisplay(e.target.value)}
              />
              both
            </label>
          </div>
        </div>

        {/* Pace Unit Controls */}
        <div className="space-y-2">
          <div className="ml-4 flex items-center gap-6">
            <label className="text-sm font-medium">Units:</label>
            <div className="flex items-center gap-4">
              <label htmlFor="paceKm" className="flex items-center gap-1">
                <input
                  id="paceKm"
                  type="radio"
                  value="km"
                  checked={paceDisplayUnit === 'km'}
                  onChange={(e) => setpaceDisplayUnit(e.target.value)}
                />
                km
              </label>
              <label htmlFor="paceMi" className="flex items-center gap-1">
                <input
                  id="paceMi"
                  type="radio"
                  value="mi"
                  checked={paceDisplayUnit === 'mi'}
                  onChange={(e) => setpaceDisplayUnit(e.target.value)}
                />
                mi
              </label>
              <label htmlFor="paceBoth" className="flex items-center gap-1">
                <input
                  id="paceBoth"
                  type="radio"
                  value="both"
                  checked={paceDisplayUnit === 'both'}
                  onChange={(e) => setpaceDisplayUnit(e.target.value)}
                />
                km+mi
              </label>
            </div>
          </div>
        </div>

        {/* Distance Selection */}
        <div className="mt-1 space-y-0">
          <div className="text-md flex items-center font-medium">Show Distances:</div>
          <div className="ml-4 flex flex-wrap gap-x-4">
            {STANDARD_DISTANCES.map((dist) => (
              <label key={dist.id} className="flex items-center gap-1">
                <input
                  aria-label={dist.longName ?? dist.name}
                  type="checkbox"
                  checked={selectedDistances.has(dist.id)}
                  onChange={() => handleSetToggle(dist.id, selectedDistances, setSelectedDistances)}
                />
                <DistanceNameDisplay dist={dist} />
              </label>
            ))}
          </div>
        </div>

        {/* Custom Distance */}
        <div className="space-y-2">
          <div className="ml-4 flex items-center gap-4">
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
              className="w-24 rounded border px-2 py-1"
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
              className="rounded border px-2 py-1"
              disabled={!customDistance.enabled}
            >
              <option value="km">km</option>
              <option value="mi">mi</option>
            </select>
          </div>
        </div>

        {/* Distance Emphasis */}
        <div className="space-y-2">
          <div className="text-md flex items-center font-medium">Emphasize Distances:</div>
          <div className="ml-4 flex flex-wrap gap-4">
            {STANDARD_DISTANCES.filter((dist) => selectedDistances.has(dist.id)).map((dist) => (
              <label key={dist.id} className="flex items-center gap-1">
                <input
                  aria-label={dist.longName ?? dist.name}
                  type="checkbox"
                  checked={emphasizedDistances.has(dist.id)}
                  onChange={() =>
                    handleSetToggle(dist.id, emphasizedDistances, setEmphasizedDistances)
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
                  checked={emphasizedDistances.has('custom')}
                  onChange={() =>
                    handleSetToggle('custom', emphasizedDistances, setEmphasizedDistances)
                  }
                />
                Custom ({customDistance.value}
                {customDistance.unit})
              </label>
            )}
          </div>
        </div>

        {/* Interval Controls */}
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
            className={`w-24 rounded border px-2 py-1 ${
              intervalInput === intervalValue ? 'bg-white' : 'bg-red-50'
            }`}
          />
          <select
            aria-label="Row interval unit"
            value={intervalUnit}
            onChange={(e) => setIntervalUnit(e.target.value)}
            className="rounded border px-2 py-1"
          >
            <option value="km/h">kph</option>
            <option value="mi/h">mph</option>
          </select>
        </div>

        {/* Order Controls */}
        <div className="flex items-center gap-4">
          <label className="text-md font-medium">Table Order:</label>
          <div className="flex flex-wrap gap-4">
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
        <div className="flex gap-2 bg-gray-50 pt-2 print:hidden">
          <button
            onClick={resetPage}
            className="rounded border border-yellow-500 bg-transparent px-4 py-2 text-xs font-medium font-semibold text-yellow-700 hover:border-transparent hover:bg-yellow-500 hover:text-white"
          >
            Reset Page
          </button>
        </div>
      </details>

      {displayOverflowMessage && (
        <div className="p-1 text-right text-sm text-amber-600">
          Scroll, reduce columns, or go landscape &gt;&gt;&gt;
        </div>
      )}

      <div className={`table-container px-1 relative ${hasOverflow ? 'overflow-x-scroll' : ''}`}>
        <table
          ref={tableContainer}
          className="min-w-full table-fixed border-collapse overflow-auto text-xs md:text-sm"
        >
          <thead className="sticky -top-1 z-50">
            <tr>
              {paceDisplayUnit !== 'mi' && (
                <>
                  {(paceDisplay == 'both' || paceDisplay == 'pace') && (
                    <th className="border bg-emerald-100 p-1 py-2 font-semibold sm:p-2 screen:w-[5vw]">
                      Pace
                      <br />
                      [min/km]
                    </th>
                  )}
                  {(paceDisplay == 'both' || paceDisplay == 'speed') && (
                    <th className="border bg-sky-100 p-1 py-2 font-semibold sm:p-2 screen:w-[5vw]">
                      Speed
                      <br />
                      [kph]
                    </th>
                  )}
                </>
              )}
              {paceDisplayUnit !== 'km' && (
                <>
                  {(paceDisplay == 'both' || paceDisplay == 'pace') && (
                    <th className="border bg-teal-100 p-1 py-2 font-semibold sm:p-2 screen:w-[5vw]">
                      Pace
                      <br />
                      [min/mi]
                    </th>
                  )}
                  {(paceDisplay == 'both' || paceDisplay == 'speed') && (
                    <th className="border bg-blue-100 p-1 py-2 font-semibold sm:p-2 screen:w-[5vw]">
                      Speed
                      <br />
                      [mph]
                    </th>
                  )}
                </>
              )}
              {STANDARD_DISTANCES.map(
                (dist) =>
                  selectedDistances.has(dist.id) && (
                    <th
                      key={dist.id}
                      className={`md:text-lgw-[10vw] border bg-white p-1 py-2 text-sm sm:p-2 print:text-lg ${emphasizedDistances.has(dist.id) ? 'font-extrabold' : 'font-semibold'}`}
                    >
                      <DistanceNameDisplay dist={dist} />
                    </th>
                  )
              )}
              {customDistance.enabled && (
                <th
                  className={`md:text-lgw-[10vw] border bg-white p-1 py-2 text-sm sm:p-2 print:text-lg ${emphasizedDistances.has('custom') ? 'font-extrabold' : 'font-semibold'}`}
                >
                  {customDistance.value}
                  {customDistance.unit}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {/* Not quite ES2023 safe yet... .slice().reverse() instead of .toReverse() */}
            {(sortAsc ? paceData : paceData.slice().reverse()).map((row, index) => (
              <tr
                key={row.kph}
                className={
                  hightlightedSpeeds.has(row.kph)
                    ? 'bg-yellow-100'
                    : index % 2 === 0
                      ? 'bg-white'
                      : 'bg-gray-50'
                }
                onClick={() => handleSetToggle(row.kph, hightlightedSpeeds, setHightlightedSpeeds)}
              >
                {paceDisplayUnit !== 'mi' && (
                  <>
                    {(paceDisplay == 'both' || paceDisplay == 'pace') && (
                      <td
                        className={`"border p-1 py-2 text-center sm:p-2 ${
                          hightlightedSpeeds.has(row.kph)
                            ? 'bg-yellow-100'
                            : index % 2 === 0
                              ? 'bg-emerald-50'
                              : 'bg-emerald-100'
                        }`}
                      >
                        {row.minPerKm}
                      </td>
                    )}
                    {(paceDisplay == 'both' || paceDisplay == 'speed') && (
                      <td
                        className={`"border p-1 py-2 text-center sm:p-2 ${
                          hightlightedSpeeds.has(row.kph)
                            ? 'bg-yellow-100'
                            : index % 2 === 0
                              ? 'bg-sky-50'
                              : 'bg-sky-100'
                        }`}
                      >
                        {row.kph}
                      </td>
                    )}
                  </>
                )}
                {paceDisplayUnit !== 'km' && (
                  <>
                    {(paceDisplay == 'both' || paceDisplay == 'pace') && (
                      <td
                        className={`"border p-1 py-2 text-center sm:p-2 ${
                          hightlightedSpeeds.has(row.kph)
                            ? 'bg-yellow-100'
                            : index % 2 === 0
                              ? 'bg-teal-50'
                              : 'bg-teal-100'
                        }`}
                      >
                        {row.minPerMile}
                      </td>
                    )}
                    {(paceDisplay == 'both' || paceDisplay == 'speed') && (
                      <td
                        className={`"border p-1 py-2 text-center sm:p-2 ${
                          hightlightedSpeeds.has(row.kph)
                            ? 'bg-yellow-100'
                            : index % 2 === 0
                              ? 'bg-blue-50'
                              : 'bg-blue-100'
                        }`}
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
                        className={`border p-1 py-2 text-center sm:p-2 ${
                          emphasizedDistances.has(dist.id) ? 'font-bold' : ''
                        }`}
                      >
                        {row.standardTimes[i]}
                      </td>
                    )
                )}
                {customDistance.enabled && (
                  <td
                    className={`border p-1 py-2 text-center sm:p-2 ${
                      emphasizedDistances.has('custom') ? 'font-bold' : ''
                    }`}
                  >
                    {row.customTime}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default PaceCalculator;
