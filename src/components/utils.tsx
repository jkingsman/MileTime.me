export const formatPace = (paceInSeconds: number) => {
  const minutes = Math.floor(paceInSeconds / 60);
  const seconds = Math.round(paceInSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export const parsePace = (paceStr: string) => {
  const [minutes, seconds] = paceStr.split(":");
  if (!minutes || !seconds) {
    return NaN;
  }
  return parseFloat(minutes) + parseFloat(seconds) / 60;
};

export const formatTime = (timeInSeconds: number) => {
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

export const resetPage = () => {
  localStorage.clear();
  window.location.reload();
}

export const countDecimals = function (value: number) {
    if(Math.floor(value) === value) return 0;
    return value.toString().split(".")[1].length || 0;
}
