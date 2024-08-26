export const debounce = (cb, wait = 100) => {
  let handler = null;
  const callable = (...args) => {
    if (handler) {
      clearTimeout(handler);
    }
    handler = setTimeout(() => cb(...args), wait);
  };
  return callable;
};
