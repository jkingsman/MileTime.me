import { useMemo, useState, useEffect, useRef } from 'react';

import {
  KM_TO_MILES,
  MILE_TO_KM,
  STORAGE_KEY,
  STORAGE_VERSION_KEY,
  STORAGE_VERSION,
  STANDARD_DISTANCES,
  DEFAULT_PREFERENCES,
  KPH_TO_MS,
  INTERVAL_UNITS,
} from './constants';
import { handleSetToggle, handleNumericalValidatableChange, parsePaceToFractionalMinutes, parsePaceToSeconds, formatTime, resetPage, sigFigCount } from './utils';
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

  // value vs input -- lets us keep track of the typed text box contents vs. last valid value separately
  const [minPaceValue, setMinPaceValue] = useState(() => loadPreferences().minPaceValue);
  const [minPaceInput, setMinPaceInput] = useState(() => loadPreferences().minPaceInput);
  const [maxPaceValue, setMaxPaceValue] = useState(() => loadPreferences().maxPaceValue);
  const [maxPaceInput, setMaxPaceInput] = useState(() => loadPreferences().maxPaceInput);

  const [paceBoundsUnit, setpaceBoundsUnit] = useState(() => loadPreferences().paceBoundsUnit);
  const [paceAndSpeedUnitDisplayList, setPaceAndSpeedUnitDisplayList] = useState<Set<string>>(
    () => new Set(loadPreferences().paceAndSpeedUnitDisplayList)
  );

  const [selectedDistances, setSelectedDistances] = useState<Set<string>>(
    () => new Set(loadPreferences().selectedDistances)
  );
  const [emphasizedDistances, setEmphasizedDistances] = useState<Set<string>>(
    () => new Set(loadPreferences().emphasizedDistances)
  );
  const [customDistance, setCustomDistance] = useState(() => loadPreferences().customDistance);

  // again, separate value vs input
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
      paceAndSpeedUnitDisplayList: Array.from(paceAndSpeedUnitDisplayList),
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
    paceAndSpeedUnitDisplayList,
    selectedDistances,
    emphasizedDistances,
    customDistance,
    intervalValue,
    intervalInput,
    intervalUnit,
    hightlightedSpeeds,
    sortAsc,
  ]);

  const paceData = useMemo(() => {
    // general form here -- build an array of speeds in kph to display, whether that be derived from a pace interval or a speed interval
    // then expand that speed array into a full data set
    let speedArray = [];

    // time/distance mode
    if (INTERVAL_UNITS.pace.includes(intervalUnit)) {
      const paceInterval = parseFloat(intervalValue);
      let minPaceValueParsedToSeconds, maxPaceValueParsedToSeconds;

      // intervals don't convert cleanly between units, so we figure our speeds in the given interval unit (converting the pace range to be in that) then convert to kph if necessary
      if (intervalUnit === 'sec/km') {
        // make sure pace bounds are in seconds/km
        const paceModifier = paceBoundsUnit === 'min/km' ? 1 : KM_TO_MILES;
        minPaceValueParsedToSeconds = parsePaceToSeconds(minPaceValue) * paceModifier;
        maxPaceValueParsedToSeconds = parsePaceToSeconds(maxPaceValue) * paceModifier;
      } else { // intervalUnit === 'sec/mi'
        // make sure pace bounds are in seconds/mi
        const paceModifier = paceBoundsUnit === 'min/mi' ? 1 : MILE_TO_KM;
        minPaceValueParsedToSeconds = parsePaceToSeconds(minPaceValue) * paceModifier;
        maxPaceValueParsedToSeconds = parsePaceToSeconds(maxPaceValue) * paceModifier;
      }

      const preliminarySpeedArray = []; // speeds in seconds per distance
      // loop through the pace range by the pace interval
      for (let timePerDistance = minPaceValueParsedToSeconds; timePerDistance <= maxPaceValueParsedToSeconds; timePerDistance += paceInterval) {
        preliminarySpeedArray.push(timePerDistance)
      }

      // convert the preliminary speed array to kph
      if (intervalUnit == 'sec/km') {
        // sec/km to kph
        speedArray = preliminarySpeedArray.map((timePerDistance) => (1 / timePerDistance) * 3600);
      } else { // intervalUnit == 'sec/mi'
        // sec/mi to kph
        speedArray = preliminarySpeedArray.map((timePerDistance) => (1 / timePerDistance) * 3600 * MILE_TO_KM);
      }

    // distance/time
    } else if (INTERVAL_UNITS.speed.includes(intervalUnit)) {
      let speedInterval;

      // interval loop runs in kph
      if (intervalUnit === 'mi/h') {
        speedInterval = parseFloat(intervalValue) * MILE_TO_KM;
      } else if (intervalUnit === 'm/s') {
        speedInterval = parseFloat(intervalValue) / KPH_TO_MS;
      } else { // intervalUnit === 'km/h'
        speedInterval = parseFloat(intervalValue);
      }

      const paceModifier = paceBoundsUnit === 'min/km' ? 1 : MILE_TO_KM;
      const minPaceValueParsedToSpeed = (60 / parsePaceToFractionalMinutes(minPaceValue)) * paceModifier; // convert min/km to kph
      const maxPaceValueParsedToSpeed = (60 / parsePaceToFractionalMinutes(maxPaceValue)) * paceModifier;

      // loop through the speed range by the speed interval
      for (let kph = maxPaceValueParsedToSpeed; kph <= minPaceValueParsedToSpeed; kph += speedInterval) {
        speedArray.push(Number(kph.toFixed(sigFigCount(speedInterval))));
      }
    } else {
      console.error('Invalid interval unit:', intervalUnit);
      return [];
    }

    // process the speed array into a full data set
    const computedData = [];
    for (const kph of speedArray) {
      const mph = kph * KM_TO_MILES;
      const mps = kph * KPH_TO_MS;
      const minPerKm = 60 / kph;
      const minPerMile = 60 / mph;

      const standardTimes = STANDARD_DISTANCES.map((dist) => (dist.distance / kph) * 3600);

      const customTime =
        ((customDistance.unit === 'mi' ? customDistance.value * MILE_TO_KM : customDistance.value) /
          kph) *
        3600;

      computedData.push({
        kph_raw: kph,
        kph: kph.toFixed(2),
        mph: mph.toFixed(2),
        mps: mps.toFixed(2),
        minPerKm: formatTime(minPerKm * 60),
        minPerMile: formatTime(minPerMile * 60),
        minPerKmRaw: minPerKm,
        minPerMileRaw: minPerMile,
        standardTimes: standardTimes.map(formatTime),
        customTime: customDistance.enabled ? formatTime(customTime) : null,
      });
    }

    return computedData;
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
      <div className="flex flex-col lg:flex-row bg-gray-50 print:hidden">
        <div className="p-2 px-4 text-4xl">MileTime.me</div>
        <div className="hidden md:flex md:items-end p-2 px-4 text-xl italic lg:mt-0">Run your numbers: the missing pace & race time converter</div>
      </div>
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
                  parsePaceToFractionalMinutes,
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
                  parsePaceToFractionalMinutes,
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

        {/* Pace Unit Controls */}
        <div className="ml-4 flex items-center gap-2">
          <label className="text-sm font-medium">Pace:</label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1">
              <input
                aria-label="show min/km"
                type="checkbox"
                checked={paceAndSpeedUnitDisplayList.has('min/km')}
                onChange={() =>
                  handleSetToggle('min/km', paceAndSpeedUnitDisplayList, setPaceAndSpeedUnitDisplayList)
                }
              />
              min/km
            </label>
            <label className="flex items-center">
              <input
                aria-label="show min/mi"
                type="checkbox"
                checked={paceAndSpeedUnitDisplayList.has('min/mi')}
                onChange={() =>
                  handleSetToggle('min/mi', paceAndSpeedUnitDisplayList, setPaceAndSpeedUnitDisplayList)
                }
              />
              min/mi
            </label>
          </div>
        </div>

        {/* Speed Unit Controls */}
        <div className="ml-4 flex items-center gap-2">
          <label className="text-sm font-medium">Speed:</label>
          <div className="flex items-center gap-4">
          <label className="flex items-center gap-1">
              <input
                aria-label="show kph"
                type="checkbox"
                checked={paceAndSpeedUnitDisplayList.has('kph')}
                onChange={() =>
                  handleSetToggle('kph', paceAndSpeedUnitDisplayList, setPaceAndSpeedUnitDisplayList)
                }
              />
              kph
            </label>
            <label className="flex items-center gap-1">
              <input
                aria-label="show mph"
                type="checkbox"
                checked={paceAndSpeedUnitDisplayList.has('mph')}
                onChange={() =>
                  handleSetToggle('mph', paceAndSpeedUnitDisplayList, setPaceAndSpeedUnitDisplayList)
                }
              />
              mph
            </label>
            <label className="flex items-center gap-1">
              <input
                aria-label="show m/s"
                type="checkbox"
                checked={paceAndSpeedUnitDisplayList.has('m/s')}
                onChange={() =>
                  handleSetToggle('m/s', paceAndSpeedUnitDisplayList, setPaceAndSpeedUnitDisplayList)
                }
              />
              m/s
            </label>
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
            step={INTERVAL_UNITS.pace.includes(intervalUnit) ? "1" : "0.1"} // pace intervals are in whole seconds, speed intervals can be in tenths
            min={INTERVAL_UNITS.pace.includes(intervalUnit) ? "1" : "0.1"} // don't go under zero for seconds
            value={intervalInput}
            onChange={(e) =>
              handleNumericalValidatableChange(
                e.target.value,
                parseFloat,
                setIntervalInput,
                setIntervalValue,
                INTERVAL_UNITS.pace.includes(intervalUnit) ? 1 : 0 // sub-second pace intervals are meaningless in our display, but we allow sub-second speed intervals
              )
            }
            className={`w-24 rounded border px-2 py-1 ${
              intervalInput === intervalValue ? 'bg-white' : 'bg-red-50'
            }`}
          />
          <select
            aria-label="Row interval unit"
            value={intervalUnit}
            onChange={(e) => {
              setIntervalUnit(e.target.value);
              // don't wanna deal with sub-second intervals, so if the user selects a pace unit, we set the interval value to at least 1 second
              if (e.target.value === 'sec/km' || e.target.value === 'sec/mi') {
                handleNumericalValidatableChange(
                  String(Math.max(intervalValue, 1)),
                  parseFloat,
                  setIntervalInput,
                  setIntervalValue
                )
              }
            }}
            className="rounded border px-2 py-1"
          >
            <option disabled> -- speed -- </option>
            <option value="km/h">km/hr (kph)</option>
            <option value="mi/h">mi/hr (mph)</option>
            <option value="m/s">m/s</option>
            <option disabled> -- pace -- </option>
            <option value="sec/km">sec/km</option>
            <option value="sec/mi">sec/mi</option>
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

      <div className={`table-container relative px-1 ${hasOverflow ? 'overflow-x-scroll' : ''}`}>
        <table
          ref={tableContainer}
          className="min-w-full table-fixed border-collapse overflow-auto text-xs md:text-sm"
        >
          <thead className="screen:sticky screen:-top-1 screen:z-50">
            <tr>
              {paceAndSpeedUnitDisplayList.has('min/km') && (
                <th className="bg-emerald-100 p-1 py-2 font-semibold sm:p-2 screen:w-[5vw]">
                  Pace
                  <br />
                  [min/km]
                </th>
              )}
              {paceAndSpeedUnitDisplayList.has('kph') && (
                <th className="bg-sky-100 p-1 py-2 font-semibold sm:p-2 screen:w-[5vw]">
                  Speed
                  <br />
                  [kph]
                </th>
              )}

              {paceAndSpeedUnitDisplayList.has('min/mi') && (
                <th className="bg-teal-100 p-1 py-2 font-semibold sm:p-2 screen:w-[5vw]">
                  Pace
                  <br />
                  [min/mi]
                </th>
              )}
              {paceAndSpeedUnitDisplayList.has('mph') && (
                <th className="bg-blue-100 p-1 py-2 font-semibold sm:p-2 screen:w-[5vw]">
                  Speed
                  <br />
                  [mph]
                </th>
              )}
              {paceAndSpeedUnitDisplayList.has('m/s') && (
                <th className="bg-purple-100 p-1 py-2 font-semibold sm:p-2 screen:w-[5vw]">
                  Speed
                  <br />
                  [m/s]
                </th>
              )}
              {paceAndSpeedUnitDisplayList.size === 0 && (
                <th className="bg-red-400 p-1 py-2 font-semibold sm:p-2 screen:w-[5vw]">
                  <i>c</i>
                  <br />
                  [lightspeed]
                </th>
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

                {paceAndSpeedUnitDisplayList.has('min/km') && (
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
                {paceAndSpeedUnitDisplayList.has('kph') && (
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

                {paceAndSpeedUnitDisplayList.has('min/mi') && (
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
                {paceAndSpeedUnitDisplayList.has('mph') && (
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
                {paceAndSpeedUnitDisplayList.has('m/s') && (
                  <td
                    className={`"border p-1 py-2 text-center sm:p-2 ${
                      hightlightedSpeeds.has(row.kph)
                        ? 'bg-yellow-100'
                        : index % 2 === 0
                          ? 'bg-purple-50'
                          : 'bg-purple-100'
                    }`}
                  >
                    {row.mps}
                  </td>
                )}
                {paceAndSpeedUnitDisplayList.size == 0 && (
                  <td
                    className={`"border p-1 py-2 text-center sm:p-2 ${
                      hightlightedSpeeds.has(row.kph)
                        ? 'bg-yellow-100'
                        : index % 2 === 0
                          ? 'bg-red-300'
                          : 'bg-red-400'
                    }`}
                  >
                    {(row.kph_raw * 9.2656693110598E-10).toFixed(20)}
                  </td>
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
