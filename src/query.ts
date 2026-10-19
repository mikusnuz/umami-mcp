type QueryValue = string | number | boolean | undefined;

/** An omitted named option must not erase the same field supplied in filters. */
export function mergeFilters(
  filters: Record<string, QueryValue> | undefined,
  explicit: Record<string, QueryValue>,
): Record<string, QueryValue> {
  return {
    ...filters,
    ...Object.fromEntries(Object.entries(explicit).filter(([, value]) => value !== undefined)),
  };
}
