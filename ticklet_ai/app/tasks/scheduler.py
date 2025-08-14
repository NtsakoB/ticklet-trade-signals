import asyncio, logging
from ..routes.signals import generate_signal

log = logging.getLogger("scheduler")
_task = None

async def _loop():
    while True:
        try:
            generate_signal()
            log.info("scan: OK")
        except Exception as e:
            log.exception("scan error: %s", e)
        await asyncio.sleep(60)

async def start():
    global _task
    if _task and not _task.done(): 
        return
    _task = asyncio.create_task(_loop())

async def stop():
    global _task
    if _task:
        _task.cancel()
        try: 
            await _task
        except: 
            pass
        _task = None