// mm:ss to decimal minutes
export const parsePaceToFractionalMinutes = (paceStr: string) => {
  const [minutes, seconds] = paceStr.split(':');
  if (!minutes || !seconds) {
    return NaN;
  }
  return parseFloat(minutes) + parseFloat(seconds) / 60;
};

// mm:ss to sss
export const parsePaceToSeconds = (paceStr: string) => {
  const [minutes, seconds] = paceStr.split(':');
  if (!minutes || !seconds) {
    return NaN;
  }
  return (parseFloat(minutes) * 60) + parseFloat(seconds);
};

// seconds to mm:ss or hh:mm:ss
export const formatTime = (timeInSeconds: number) => {
  const totalSeconds = Math.round(timeInSeconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};
export const resetPage = () => {
  localStorage.clear();
  window.location.reload();
};

// returns the number of decimal places in a number, or a minimum in case the user didn't give us a decimal number
export const sigFigCount = function (value: number, minSigFigs: number=2) {
  if (Math.floor(value) === value) return minSigFigs;
  return Math.max(value.toString().split('.')[1].length, minSigFigs) || 0;
};

// helper for togglable checkbox sets
export const handleSetToggle = (
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

// helper for numerical inputs -- we accept and display any /input/ that the user provides, but only update the underlying /value/ if it passes validation
// this gives a nice "invalid" UX without chomping on the user's input while they're typing.
// accepts the user's value, always sets the /input/ to that, validates it with the provided validator, and if valid, sets the /value/ to that.
// Also includes a minimum value check as an additional validation so I'm not tempted to write gnarly `(e) => parseFloat(e.target.value) && parseFloat(e.target.value) > 0 ? e.target.value : NaN`
// May rework this later.
export const handleNumericalValidatableChange = (
  value: string,
  validator: (value: string) => number,
  inputSetter: (value: string) => void,
  valueSetter: (value: string) => void,
  minimumValue: number = 0,
) => {
  inputSetter(value);
  const parsed = validator(value);
  if (!isNaN(parsed) && parsed >= minimumValue) {
    valueSetter(value);
    inputSetter(value);
  }
};
