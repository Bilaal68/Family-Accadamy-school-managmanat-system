/**
 * Normalizes list API responses: either { count, results } or a legacy plain array.
 */
export function parseListResponse(data) {
  if (Array.isArray(data)) {
    return { count: data.length, results: data };
  }
  return {
    count: data?.count ?? 0,
    results: Array.isArray(data?.results) ? data.results : [],
  };
}
