from prometheus_client import Counter, Histogram, Gauge

push_requests_total = Counter(
    "push_requests_total", "Total push requests", ["result"]
)
telegram_dispatch_total = Counter(
    "telegram_dispatch_total", "Total telegram dispatches", ["kind"]
)
telegram_latency_ms = Histogram(
    "telegram_latency_ms", "Telegram dispatch latency (ms)"
)
circuit_breaker_state = Gauge(
    "circuit_breaker_state", "Circuit breaker state (0:closed,1:open,2:half-open)"
)
