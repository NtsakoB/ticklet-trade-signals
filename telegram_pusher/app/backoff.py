import asyncio
import random

async def retry(fn, attempts=[1,2,3,4,5,6], base=0.5, jitter=True):
    error = None
    for attempt in attempts:
        try:
            result = await fn()
            return result, None
        except Exception as exc:
            error = exc
            sleep_time = base * attempt
            if jitter:
                sleep_time *= random.uniform(0.5, 1.5)
            await asyncio.sleep(sleep_time)
    return None, error
