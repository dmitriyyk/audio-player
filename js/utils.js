export function formatTime (time) {
  return time < 10 ? `0${time}` : time
};

export function toMinAndSec(duration) {
  const minutes = formatTime(Math.floor(duration / 60));
  const seconds = formatTime(Math.floor(duration - minutes * 60));

  return `${minutes}:${seconds}`;
}

export function debounce(func, ms) {
  let timeout;

  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(func.bind(this, ...args), ms);
  };
}

export const isMobileScreen = matchMedia('(width <= 470px)').matches