create or replace function log_signal(
  p_user_id uuid,
  p_symbol text,
  p_signal_type text,
  p_entry_price numeric,
  p_stop_loss numeric,
  p_take_profits numeric[],
  p_strategy text
)
returns void as $$
begin
  insert into trading_signals (
    user_id, symbol, signal_type, entry_price, stop_loss, take_profits, strategy_used
  )
  values (
    p_user_id, p_symbol, p_signal_type, p_entry_price, p_stop_loss, p_take_profits, p_strategy
  );
end;
$$ language plpgsql;