import logging, time, os
from ticklet_ai.tasks.scheduler import start_scheduler
logging.basicConfig(level=os.getenv('LOG_LEVEL', 'INFO'))
logger = logging.getLogger('ticklet.worker')
if __name__ == '__main__':
    logger.info('WORKER: booting scheduler…')
    start_scheduler()
    logger.info('WORKER: scheduler started. Keep-alive loop engaged.')
    try:
        while True:
            time.sleep(30)
    except KeyboardInterrupt:
        logger.info('WORKER: shutdown')