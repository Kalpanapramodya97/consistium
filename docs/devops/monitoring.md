# Monitoring & Observability

Even for seemingly simple applications, observability is not a luxury — it is a necessity. Without visibility into how your application behaves in production, you are flying blind. Monitoring enables you to detect issues before users do, understand traffic patterns, plan capacity, and diagnose incidents quickly. Consistium uses a lightweight but powerful observability stack built on industry-standard open-source tools: **Nginx**, **Prometheus**, and **Grafana**. This stack provides real-time metrics collection, persistent time-series storage, and rich visual dashboards — all with minimal resource overhead.

---

## Data Flow

The following diagram illustrates how metrics flow from the Nginx web server through the monitoring pipeline to the Grafana dashboard:

```mermaid
flowchart LR
    A["Nginx\n(Web Server)"] -->|"/stub_status"| B["stub_status\n(Endpoint)"]
    B -->|"HTTP scrape"| C["nginx-prometheus-exporter\n(Port 9113)"]
    C -->|"Prometheus format\n/metrics"| D["Prometheus\n(Port 9090)"]
    D -->|"PromQL queries"| E["Grafana\n(Port 3001)"]

    style A fill:#2d9cdb,stroke:#1a7bb5,color:#fff
    style B fill:#6c757d,stroke:#545b62,color:#fff
    style C fill:#e07a2f,stroke:#b8621f,color:#fff
    style D fill:#e6522c,stroke:#c4431f,color:#fff
    style E fill:#f2a735,stroke:#d4911e,color:#fff
```

**In plain terms:**

1. Nginx exposes a lightweight status page at `/stub_status`.
2. The nginx-prometheus-exporter container scrapes that page and translates it into Prometheus-compatible metrics.
3. Prometheus pulls those metrics every 15 seconds and stores them as time-series data.
4. Grafana connects to Prometheus and renders the data as interactive dashboards.

---

## Architecture

### Nginx (`stub_status` Module)

Nginx's `stub_status` module is a built-in, zero-dependency feature that exposes basic connection and request statistics via a simple HTTP endpoint. It requires no additional software and adds negligible overhead to the server.

The endpoint is typically configured in the Nginx configuration as:

```nginx
location /stub_status {
    stub_status;
    allow 127.0.0.1;
    allow 172.16.0.0/12;  # Docker network
    deny all;
}
```

> [!IMPORTANT]
> The `stub_status` endpoint should **never** be exposed to the public internet. Restrict access to internal networks or localhost only.

### nginx-prometheus-exporter

| Property | Value |
|----------|-------|
| **Image** | `nginx/nginx-prometheus-exporter:1.1.0` |
| **Port** | `9113` |
| **Role** | Metrics translator |

The [nginx-prometheus-exporter](https://github.com/nginxinc/nginx-prometheus-exporter) is the official exporter maintained by Nginx Inc. It connects to the `stub_status` endpoint, parses the plain-text output, and re-exposes the data in Prometheus exposition format at `/metrics` on port `9113`.

### Prometheus

| Property | Value |
|----------|-------|
| **Image** | `prom/prometheus:v2.51.0` |
| **Port** | `9090` |
| **Role** | Metrics collection & storage |

Prometheus is a time-series database and monitoring system. It operates on a **pull model** — it actively scrapes configured targets at regular intervals. Scraped metrics are stored locally with configurable retention and can be queried using **PromQL**, a powerful query language purpose-built for time-series data.

### Grafana

| Property | Value |
|----------|-------|
| **Image** | `grafana/grafana:10.4.1` |
| **Port** | `3001` |
| **Role** | Visualization & dashboarding |

Grafana provides a rich web UI for building dashboards, exploring metrics, and configuring alerts. It connects to Prometheus as a data source and translates PromQL queries into charts, gauges, tables, and more.

---

## Nginx Metrics

The nginx-prometheus-exporter translates the `stub_status` output into the following Prometheus metrics:

| Metric | Type | Description |
|--------|------|-------------|
| `nginx_connections_active` | Gauge | The current number of active client connections, including waiting connections. |
| `nginx_connections_accepted` | Counter | The total number of accepted client connections since Nginx started. |
| `nginx_connections_handled` | Counter | The total number of handled connections. Normally equals `accepted` unless resource limits were hit. |
| `nginx_connections_reading` | Gauge | The current number of connections where Nginx is reading the request header. |
| `nginx_connections_writing` | Gauge | The current number of connections where Nginx is writing the response back to the client. |
| `nginx_connections_waiting` | Gauge | The current number of idle client connections waiting for a request (keep-alive). |
| `nginx_http_requests_total` | Counter | The total number of client HTTP requests served since Nginx started. |
| `nginx_up` | Gauge | Whether the Nginx instance is reachable. `1` = up, `0` = down. |

> [!NOTE]
> **Counter** metrics increase monotonically and reset on restart. Use PromQL functions like `rate()` or `increase()` to derive meaningful per-second or per-interval values from counters.
>
> **Gauge** metrics represent a snapshot of a current value and can go up or down.

---

## Prometheus Configuration

Prometheus is configured via `prometheus.yml`. The Consistium configuration is intentionally minimal:

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx-exporter:9113']
```

### Configuration Breakdown

| Field | Value | Purpose |
|-------|-------|---------|
| `global.scrape_interval` | `15s` | Sets the default interval at which Prometheus scrapes all targets. 15 seconds provides a good balance between resolution and resource usage. |
| `scrape_configs[].job_name` | `nginx` | A human-readable label (`job="nginx"`) attached to all metrics scraped from this target. Used for filtering in PromQL and Grafana. |
| `static_configs[].targets` | `nginx-exporter:9113` | The hostname and port of the nginx-prometheus-exporter container. Uses Docker's internal DNS resolution. |

> [!TIP]
> If you add more services in the future (e.g., a Node.js backend with `prom-client`), simply add another entry under `scrape_configs` with the appropriate `job_name` and `targets`.

---

## Grafana Setup

### Accessing Grafana

1. Start the monitoring stack with Docker Compose.
2. Open your browser and navigate to **[http://localhost:3001](http://localhost:3001)**.
3. Log in with the default credentials:

| Field | Value |
|-------|-------|
| **Username** | `admin` |
| **Password** | `admin` |

> [!WARNING]
> You will be prompted to change the default password on first login. In a production environment, **always** change the default credentials and consider configuring authentication via environment variables or an external identity provider.

### Adding Prometheus as a Data Source

1. Navigate to **Connections → Data Sources** (or use the gear icon in the sidebar).
2. Click **Add data source**.
3. Select **Prometheus** from the list.
4. Configure the following:

| Setting | Value |
|---------|-------|
| **URL** | `http://prometheus:9090` |
| **Access** | `Server (default)` |
| **Scrape interval** | `15s` |

5. Click **Save & Test**. You should see a green banner confirming the data source is working.

> [!NOTE]
> The URL uses the Docker service name `prometheus` rather than `localhost` because Grafana connects to Prometheus over the Docker internal network.

---

## Recommended Dashboard Panels

Below are suggested panels for a comprehensive Nginx monitoring dashboard in Grafana:

### 1. Requests per Second

- **Visualization**: Time series (line chart)
- **PromQL**: `rate(nginx_http_requests_total[1m])`
- **Description**: Shows the throughput of your Nginx instance over time. Useful for spotting traffic spikes, DDoS patterns, or gradual growth.

### 2. Active Connections

- **Visualization**: Stat panel (single value with sparkline)
- **PromQL**: `nginx_connections_active`
- **Description**: Displays the current number of active connections. A sustained spike may indicate a traffic surge or a slow backend causing connection pile-up.

### 3. Connection States

- **Visualization**: Time series (stacked area chart)
- **PromQL**: Use multiple queries:
  - `nginx_connections_reading` (label: Reading)
  - `nginx_connections_writing` (label: Writing)
  - `nginx_connections_waiting` (label: Waiting)
- **Description**: Breaks down connections by state. A high `reading` count may suggest slow clients; a high `writing` count may indicate large responses or slow connections.

### 4. Nginx Uptime

- **Visualization**: Stat panel with value mapping
- **PromQL**: `nginx_up`
- **Description**: A simple health indicator. Map `1` to a green "UP" badge and `0` to a red "DOWN" badge for instant visibility.

### 5. Handled vs. Accepted Connections

- **Visualization**: Time series (dual-line chart)
- **PromQL**:
  - `rate(nginx_connections_accepted[5m])`
  - `rate(nginx_connections_handled[5m])`
- **Description**: Under normal conditions, these lines should overlap. A divergence means Nginx is dropping connections due to resource limits (e.g., `worker_connections` is too low).

### 6. Total Requests Counter

- **Visualization**: Stat panel (total count)
- **PromQL**: `nginx_http_requests_total`
- **Description**: Shows the cumulative total of all requests served. Useful as a high-level throughput indicator since last Nginx restart.

---

## Sample PromQL Queries

### Request Rate (per second)

```promql
rate(nginx_http_requests_total[1m])
```

Calculates the per-second rate of HTTP requests averaged over the last 1 minute. This is the most commonly used metric for understanding traffic load.

### Request Increase Over 24 Hours

```promql
increase(nginx_http_requests_total[24h])
```

Returns the total number of new requests received in the past 24 hours. Useful for daily traffic summaries and trend analysis.

### Current Active Connections

```promql
nginx_connections_active
```

Returns the instantaneous count of active connections. Use this with alerting to detect connection saturation.

### Connection Drop Rate

```promql
rate(nginx_connections_accepted[5m]) - rate(nginx_connections_handled[5m])
```

If this value is greater than `0`, Nginx is dropping connections. This typically indicates the `worker_connections` limit has been reached.

### Waiting (Keep-Alive) Connection Ratio

```promql
nginx_connections_waiting / nginx_connections_active
```

Shows the proportion of active connections that are idle (keep-alive). A very high ratio may indicate overly generous keep-alive timeouts consuming resources.

### Nginx Availability (Over Time)

```promql
avg_over_time(nginx_up[1h])
```

Returns the average availability of Nginx over the past hour as a value between `0` and `1`. Multiply by 100 for a percentage. Useful for SLA tracking.

---

## Alerting Recommendations

Below are recommended Prometheus alerting rules for proactive monitoring. These can be added to a `rules.yml` file and referenced in `prometheus.yml` via `rule_files`:

### Nginx Down

```yaml
- alert: NginxDown
  expr: nginx_up == 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "Nginx is unreachable"
    description: "The nginx_up metric has been 0 for more than 1 minute. The Nginx instance may have crashed or the exporter has lost connectivity."
```

### High Active Connections

```yaml
- alert: NginxHighActiveConnections
  expr: nginx_connections_active > 500
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "High number of active Nginx connections"
    description: "Active connections have exceeded 500 for over 5 minutes. This may indicate a traffic spike or a slow upstream backend."
```

### Dropped Connections

```yaml
- alert: NginxDroppedConnections
  expr: rate(nginx_connections_accepted[5m]) - rate(nginx_connections_handled[5m]) > 0
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Nginx is dropping connections"
    description: "The rate of accepted connections exceeds handled connections, indicating that Nginx is unable to process all incoming connections."
```

### Request Spike

```yaml
- alert: NginxRequestSpike
  expr: rate(nginx_http_requests_total[1m]) > 1000
  for: 2m
  labels:
    severity: warning
  annotations:
    summary: "Abnormally high request rate on Nginx"
    description: "Nginx is serving more than 1000 requests per second for over 2 minutes. Investigate potential abuse or unexpected traffic."
```

> [!TIP]
> Adjust the threshold values (`500`, `1000`, etc.) based on your application's expected traffic patterns. Start conservative and tune over time as you learn your baseline.

To enable alerting rules in Prometheus, add the following to your `prometheus.yml`:

```yaml
rule_files:
  - "rules.yml"
```

For alert notifications (email, Slack, PagerDuty, etc.), deploy [Alertmanager](https://prometheus.io/docs/alerting/latest/alertmanager/) alongside Prometheus and configure the appropriate notification receivers.

---

## Accessing the Stack

| Service | URL | Port | Purpose |
|---------|-----|------|---------|
| **Nginx** | [http://localhost](http://localhost) | `80` | Main application web server |
| **stub_status** | [http://localhost/stub_status](http://localhost/stub_status) | `80` | Raw Nginx status metrics (internal only) |
| **nginx-exporter** | [http://localhost:9113/metrics](http://localhost:9113/metrics) | `9113` | Prometheus-format Nginx metrics |
| **Prometheus** | [http://localhost:9090](http://localhost:9090) | `9090` | Metrics storage, querying, and alerting rules |
| **Grafana** | [http://localhost:3001](http://localhost:3001) | `3001` | Dashboards and visualization |

> [!CAUTION]
> In a production deployment, **do not** expose Prometheus (`9090`), the nginx-exporter (`9113`), or the `stub_status` endpoint to the public internet. Use firewall rules, reverse proxies with authentication, or bind these services only to internal network interfaces.
