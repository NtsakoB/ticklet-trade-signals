import logging, datetime
logger = logging.getLogger(__name__)

def heartbeat():
    ts = datetime.datetime.utcnow().isoformat()+'Z'
    logger.info(f'HEARTBEAT: {ts}')