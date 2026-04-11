/** Fixed concurrency pool: workers pull the next index until exhausted. */
export async function runPool<T>(items: T[], concurrency: number, worker: (item: T, index: number) => Promise<void>): Promise<void> {
  if (items.length === 0) return;
  const n = Math.max(1, Math.min(concurrency, items.length));
  let next = 0;
  const run = async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      await worker(items[i], i);
    }
  };
  await Promise.all(Array.from({ length: n }, () => run()));
}
