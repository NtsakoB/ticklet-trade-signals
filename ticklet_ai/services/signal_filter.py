from .rideout_policy import policy

def rideout_should_alert(*, price_now, entry_low, entry_high, rr_tp2,
                         late_p=None, extend_p=None, reentry_p=None,
                         overext_atr=None):
    if not (entry_low <= price_now <= entry_high): 
        return False
    if rr_tp2 < policy.min_rr_tp2: 
        return False
    if policy.ai_enabled:
        if late_p is not None and late_p < policy.late_entry_prob_min: 
            return False
        if extend_p is not None and extend_p < policy.extend_prob_min: 
            return False
        if reentry_p is not None and reentry_p < policy.reentry_prob_min: 
            return False
    if overext_atr is not None and overext_atr > policy.max_overextension_atr: 
        return False
    return True