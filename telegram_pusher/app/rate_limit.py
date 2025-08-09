import time
import threading

class TokenBucket:
    def __init__(self, capacity, refill_rate):
        self.capacity = capacity
        self.refill_rate = refill_rate
        self.tokens = capacity
        self.last_refill = time.time()
        self.lock = threading.Lock()

    def consume(self, amount=1):
        with self.lock:
            now = time.time()
            elapsed = now - self.last_refill
            refill = int(elapsed * self.refill_rate)
            if refill > 0:
                self.tokens = min(self.capacity, self.tokens + refill)
                self.last_refill = now
            if self.tokens >= amount:
                self.tokens -= amount
                return True
            return False

def rate_limit_decorator(bucket):
    def decorator(func):
        async def wrapper(*args, **kwargs):
            if not bucket.consume():
                from fastapi import HTTPException
                raise HTTPException(status_code=429, detail="rate limit exceeded")
            return await func(*args, **kwargs)
        return wrapper
    return decorator
