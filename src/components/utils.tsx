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
