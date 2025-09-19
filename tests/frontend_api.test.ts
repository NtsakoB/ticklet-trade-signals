/**
 * Tests for dashboard API service
 */

// Mock fetch for testing
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

// We can't actually run these tests in this environment, but this shows
// what the test structure would look like

describe('Dashboard API Service', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('fetchDashboardSummary returns expected data structure', async () => {
    const mockData = {
      active_signals: 5,
      executed_trades: 23,
      win_rate: 0.65,
      capital_at_risk: 12500.0,
      data_source: 'csv_fallback'
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    } as Response);

    const { fetchDashboardSummary } = await import('../src/services/dashboardApi');
    const result = await fetchDashboardSummary();

    expect(result).toEqual(mockData);
    expect(fetch).toHaveBeenCalledWith('/api/summary/dashboard', {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    });
  });

  test('fetchDashboardSummary handles errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { fetchDashboardSummary } = await import('../src/services/dashboardApi');
    const result = await fetchDashboardSummary();

    expect(result.data_source).toBe('mock_data');
    expect(result.active_signals).toBe(3);
  });
});

describe('Signals API Service', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  test('fetchSignals returns array of signals', async () => {
    const mockSignals = [
      {
        id: 'active_BTCUSDT_123',
        symbol: 'BTCUSDT',
        title: 'Entry: 44500-45500',
        subtitle: 'LONG',
        confidence: 75.0,
        price: 45000,
        change_pct: 2.5,
        time: '14:06',
        tags: ['RR: 3.2']
      }
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSignals,
    } as Response);

    const { fetchSignals } = await import('../src/services/signalsApi');
    const result = await fetchSignals('active');

    expect(result).toEqual(mockSignals);
    expect(fetch).toHaveBeenCalledWith('/api/signals?type=active', {
      headers: { Accept: 'application/json' }
    });
  });
});