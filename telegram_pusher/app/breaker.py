import time
from collections import deque

class CircuitBreaker:
    CLOSED, OPEN, HALF_OPEN = 0, 1, 2

    def __init__(self, failure_threshold=0.5, min_calls=20, cooldown_seconds=120):
        self.failure_threshold = failure_threshold
        self.min_calls = min_calls
        self.cooldown_seconds = cooldown_seconds
        self.state = self.CLOSED
        self.calls = deque(maxlen=min_calls)
        self.last_opened = None

    def allow(self):
        if self.state == self.OPEN:
            if time.time() - self.last_opened > self.cooldown_seconds:
                self.state = self.HALF_OPEN
            else:
                return False
        return True

    def record_success(self):
        self.calls.append(1)
        self._check_state()

    def record_failure(self):
        self.calls.append(0)
        self._check_state()

    def _check_state(self):
        if len(self.calls) < self.min_calls:
            return
        rate = 1 - sum(self.calls)/len(self.calls)
        if self.state in {self.CLOSED, self.HALF_OPEN} and rate >= self.failure_threshold:
            self.state = self.OPEN
            self.last_opened = time.time()
        elif self.state == self.OPEN and (time.time() - self.last_opened > self.cooldown_seconds):
            self.state = self.HALF_OPEN
        elif self.state == self.HALF_OPEN and rate < self.failure_threshold:
            self.state = self.CLOSED
            self.calls.clear()
