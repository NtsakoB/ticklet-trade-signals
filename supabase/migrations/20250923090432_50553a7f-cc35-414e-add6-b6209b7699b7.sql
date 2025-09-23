-- Insert sample trading signals with all required fields
INSERT INTO public.signals (
  symbol, side, entry_price, stop_price, stop_loss, targets, confidence, strategy, status, ai_summary
) VALUES
-- BUY TRXUSDT (from screenshot)
('TRXUSDT', 'BUY', 0.347000, 0.336590, 0.336590,
 '{"tp1": 0.353940, "tp2": 0.364350, "tp3": 0.374760}'::jsonb, 
 0.75, 'TickletAlpha', 'active', 'Strong bullish momentum detected'),

-- BUY PROVEUSDT (from screenshot) 
('PROVEUSDT', 'BUY', 1.58800, 1.54040, 1.54040,
 '{"tp1": 1.62, "tp2": 1.67, "tp3": 1.72}'::jsonb,
 0.80, 'TickletAlpha', 'active', 'High anomaly score detected'),

-- SELL PEPEUSDT (from screenshot)
('PEPEUSDT', 'SELL', 0.000011, 0.000012, 0.000012,
 '{"tp1": 0.000011, "tp2": 0.000011, "tp3": 0.000010}'::jsonb,
 0.70, 'TickletAlpha', 'active', 'Bearish pattern forming'),

-- Additional active signals
('BTCUSDT', 'SELL', 118825.85, 122390.62, 122390.62,
 '{"tp1": 116449.33, "tp2": 112884.56, "tp3": 109319.78}'::jsonb,
 0.65, 'TickletAlpha', 'active', 'Resistance level reached'),

('XRPUSDT', 'SELL', 3.1435, 3.237805, 3.237805,
 '{"tp1": 3.0806, "tp2": 2.9863, "tp3": 2.8920}'::jsonb,
 0.72, 'TickletAlpha', 'active', 'Overbought conditions'),

-- Some missed opportunities  
('SOLUSDT', 'BUY', 175.53, 161.4876, 161.4876,
 '{"tp1": 180.7959, "tp2": 166.7535, "tp3": 161.4876}'::jsonb,
 0.68, 'TickletAlpha', 'missed', 'Price moved before entry'),

('ENAUSDT', 'SELL', 0.7902, 0.813906, 0.813906,
 '{"tp1": 0.774396, "tp2": 0.750690, "tp3": 0.726984}'::jsonb,
 0.55, 'TickletAlpha', 'missed', 'Signal expired'),

-- Some low entry opportunities
('DOGEUSDT', 'SELL', 0.22351, 0.230215299, 0.230215299,
 '{"tp1": 0.219040, "tp2": 0.212334, "tp3": 0.205629}'::jsonb,
 0.78, 'TickletAlpha', 'active', 'Near support level'),

('SUIUSDT', 'SELL', 3.6599, 3.769697, 3.769697,
 '{"tp1": 3.5867, "tp2": 3.4769, "tp3": 3.3671}'::jsonb,
 0.60, 'TickletAlpha', 'active', 'Technical breakdown expected');

-- Mark some as low entry opportunities
UPDATE public.signals 
SET low_entry = true, price_distance = 0.001
WHERE symbol IN ('DOGEUSDT', 'SUIUSDT', 'TRXUSDT');