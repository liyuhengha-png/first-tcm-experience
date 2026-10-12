// Explicit synthetic-only mode; never silently fall back from Supabase.
process.env.SYNTHETIC_LOCAL_DB = 'true'
process.env.ALLOW_REAL_BOOKING_DATA = 'false'
await import('./main')
export {}
