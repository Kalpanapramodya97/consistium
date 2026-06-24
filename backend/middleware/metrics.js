/**
 * middleware/metrics.js
 *
 * Prometheus instrumentation for the Consistium backend API.
 *
 * Exposes the following metrics at GET /api/metrics:
 *   http_requests_total          — counter, labelled by method / route / status
 *   http_request_duration_seconds — histogram (p50/p95/p99 latency SLO)
 *   http_requests_in_flight       — gauge (active connections)
 *   nodejs_*                      — default Node.js runtime metrics (heap, GC, event loop)
 *   process_*                     — default process metrics (CPU, RSS)
 *
 * All default prom-client metrics are collected automatically via
 * `collectDefaultMetrics()`, which provides out-of-the-box signals
 * for the SLO recording rules in prometheus/recording-rules.yml.
 */

'use strict';

const client = require('prom-client');

// ── Registry ──────────────────────────────────────────────────────────────────
// Use a fresh registry (not the global one) so tests don't bleed metrics.
const register = new client.Registry();

// Add a global label so every metric is tagged with the service name
register.setDefaultLabels({ service: 'consistium-backend' });

// Collect default Node.js / process metrics (heap, GC, event-loop lag, …)
client.collectDefaultMetrics({ register });

// ── Custom metrics ────────────────────────────────────────────────────────────

/**
 * http_requests_total
 * Counts every completed HTTP request.
 * Labels:
 *   method  — GET, POST, PUT, DELETE …
 *   route   — normalised path (e.g. /api/habits/:id)
 *   status  — HTTP status code (200, 404, 500 …)
 */
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests received',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

/**
 * http_request_duration_seconds
 * Measures response time as a histogram with fine-grained buckets covering
 * the sub-10ms → 10s range.  The le="0.5" bucket feeds the latency SLO
 * recording rule (job:slo_latency_compliance_pct:rate5m).
 */
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request latency in seconds',
  labelNames: ['method', 'route', 'status'],
  // Buckets: 10ms, 25ms, 50ms, 100ms, 200ms, 500ms (SLO), 1s, 2.5s, 5s, 10s
  buckets: [0.01, 0.025, 0.05, 0.1, 0.2, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

/**
 * http_requests_in_flight
 * Active in-flight requests at any point in time.
 */
const httpRequestsInFlight = new client.Gauge({
  name: 'http_requests_in_flight',
  help: 'Number of HTTP requests currently being processed',
  labelNames: ['method'],
  registers: [register],
});

// ── Helper: normalise route ───────────────────────────────────────────────────
/**
 * Express sets req.route.path only after the route handler is matched.
 * We normalise dynamic segments (:id, MongoDB ObjectIds, UUIDs, date keys)
 * to avoid high-cardinality label explosions.
 *
 * Examples:
 *   /api/habits/6650a1b2c3d4e5f6a7b8c9d0   → /api/habits/:id
 *   /api/habits/completions/2025-06-24      → /api/habits/completions/:dateKey
 */
function normaliseRoute(req) {
  // Prefer Express's matched route path (e.g. "/:id")
  const matched =
    req.route && req.route.path !== '/'
      ? (req.baseUrl || '') + req.route.path
      : req.path;

  return matched
    // MongoDB ObjectId (24 hex chars)
    .replace(/\/[0-9a-f]{24}/gi, '/:id')
    // UUID v4
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
    // ISO date keys (YYYY-MM-DD)
    .replace(/\/\d{4}-\d{2}-\d{2}$/, '/:dateKey')
    // Pure numeric IDs
    .replace(/\/\d+/g, '/:id');
}

// ── Express middleware ────────────────────────────────────────────────────────

/**
 * metricsMiddleware
 *
 * Mount before all routes:
 *   app.use(metricsMiddleware);
 *
 * Records duration and increments counters on `res.finish`.
 */
function metricsMiddleware(req, res, next) {
  // Skip the /api/metrics endpoint itself to avoid self-instrumenting noise
  if (req.path === '/api/metrics') return next();

  const end = httpRequestDuration.startTimer({ method: req.method });
  httpRequestsInFlight.inc({ method: req.method });

  res.on('finish', () => {
    const route = normaliseRoute(req);
    const labels = { method: req.method, route, status: res.statusCode };

    end(labels);                               // observe duration
    httpRequestsTotal.inc(labels);             // increment counter
    httpRequestsInFlight.dec({ method: req.method });  // decrement gauge
  });

  next();
}

// ── /api/metrics handler ──────────────────────────────────────────────────────

/**
 * metricsHandler
 *
 * Mount at the metrics path:
 *   app.get('/api/metrics', metricsHandler);
 *
 * Prometheus scrapes this endpoint every `scrape_interval` (15s by default).
 */
async function metricsHandler(req, res) {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err.message);
  }
}

module.exports = { metricsMiddleware, metricsHandler, register };
