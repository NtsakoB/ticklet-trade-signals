-- Create the missing column first
alter table public.signals add column if not exists price_distance numeric;

-- Now create the view that references it
create or replace view public.signals_view as
select
  id, symbol, side, entry_price, volatility_pct, leverage, anomaly, confidence,
  targets, stop_loss, strategy, ai_summary, status, low_entry, price_distance, created_at,
  case 
    when targets is not null and array_length(targets, 1) >= 2 then 
      targets[2] / nullif(entry_price, 0) - 1
    else null 
  end as rr_tp2
from public.signals
order by created_at desc;