# Dashboard API Documentation

## Overview

The dashboard has been updated to use real backend data from Supabase with CSV fallback, eliminating hard-coded placeholders. This document describes the new API contracts and data flow.

## API Endpoints

### Dashboard Summary

**Endpoint:** `GET /api/summary/dashboard`

**Description:** Provides dashboard summary statistics including active signals, executed trades, win rate, and capital at risk.

**Response:**
```json
{
  "active_signals": 5,
  "executed_trades": 23,
  "win_rate": 0.65,
  "capital_at_risk": 12500.0,
  "data_source": "supabase|csv_fallback|mock_data"
}
```

**Data Sources:**
1. **Supabase** (primary): Real-time data from database tables
2. **CSV Fallback**: Local CSV files when Supabase is unavailable
3. **Mock Data**: Hardcoded values as last resort

### Signals API

**Endpoint:** `GET /api/signals?type={type}`

**Description:** Returns signals filtered by type for dashboard components.

**Supported Types:**
- `active`: Live trading signals (previously "trade")
- `recent`: Recently generated signals
- `missed`: Signals that didn't pass filters
- `lowest`: Low entry opportunities (combines "low_entry" and "low_price")

**Response:**
```json
[
  {
    "id": "active_BTCUSDT_1234567890",
    "symbol": "BTCUSDT",
    "title": "Entry: 44500-45500",
    "subtitle": "LONG",
    "confidence": 75.0,
    "price": 45000,
    "change_pct": 2.5,
    "time": "14:06",
    "tags": ["RR: 3.2"]
  }
]
```

### Backward Compatibility

**Endpoint:** `GET /api/signals/compat?type={type}`

**Description:** Provides backward compatibility for old signal types.

**Type Mapping:**
- `trade` → `active`
- `low_entry` → `lowest`
- `low_price` → `lowest`

## Frontend Changes

### StatsCards Component

- Fetches data from `/api/summary/dashboard`
- Shows data source indicator (Supabase/CSV/Mock)
- Graceful degradation with loading states
- Removes all hardcoded mock values

### Overview Panel Components

- **TradeSignalsTable**: Uses `active` signals instead of `trade`
- **SignalList**: Updated to use harmonized signal types
- **OverviewPanel**: Consolidated `low_entry` and `low_price` into `lowest`

### Services

- **dashboardApi.ts**: New service for dashboard summary data
- **signalsApi.ts**: Updated with new signal types and backward compatibility

## Data Flow

```
Frontend → /api/summary/dashboard → Supabase → CSV Fallback → Mock Data
Frontend → /api/signals?type=active → Scanner Service → Fallback Data
```

## Database Schema

### Tables Used

- `signals`: Active trading signals from Supabase
- `paper_trades`: Trade execution data for statistics
- `accuracy_snapshots`: ML model performance data

### Key Fields

- `signals.status`: 'active' for live signals
- `paper_trades.status`: 'open' or 'closed'
- `paper_trades.pnl`: Profit/loss for win rate calculation

## Environment Variables

### Backend
- `TICKLET_SUPABASE_URL`: Supabase project URL
- `TICKLET_SUPABASE_ANON_KEY`: Supabase anonymous key

### Frontend
- `VITE_SUPABASE_URL`: Supabase project URL for authentication
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key

## Testing

### Backend Tests
```bash
python -m pytest tests/test_dashboard_api.py -v
```

### Frontend Tests
```bash
npm test tests/frontend_api.test.ts
```

## Migration Notes

### Breaking Changes
- Signal type `trade` renamed to `active`
- Signal types `low_entry` and `low_price` consolidated to `lowest`
- `StatsCards` component now requires no props (fetches its own data)

### Backward Compatibility
- Legacy signal types available via `/api/signals/compat`
- Old `stats` prop on `StatsCards` still supported but deprecated
- Environment variable fallbacks maintain existing behavior

## Deployment

1. Ensure Supabase credentials are set in production environment
2. CSV fallback files should be deployed to `data/` directory
3. Frontend proxy configuration removed for production (uses same-origin)
4. All tests should pass before deployment

## Performance Considerations

- Dashboard summary endpoint cached for 30 seconds
- Signal endpoints limited to 20 results for UI performance
- Fallback data ensures zero downtime during Supabase maintenance
- Loading states prevent UI blocking during data fetches