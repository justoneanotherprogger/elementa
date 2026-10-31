export function createPool(factory, reset) {
  const free = [];

  return {
    acquire() {
      const item = free.pop();
      if (item) return item;
      return factory();
    },
    release(item) {
      reset?.(item);
      free.push(item);
    },
    clear() {
      free.length = 0;
    },
  };
}
