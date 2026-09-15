// `<input type="date">` only displays a value in strict YYYY-MM-DD form.
// The API returns dates as "Y-m-d H:i:s" (and created_at as ISO), so trim to
// the date part instead of round-tripping through `Date`, which shifts the day
// backwards for early-morning times in UTC+ timezones.
export const toDateInputValue = (value) => {
  if (!value) return ''
  const m = String(value).match(/^\d{4}-\d{2}-\d{2}/)
  return m ? m[0] : ''
}
