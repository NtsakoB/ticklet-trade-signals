import structlog
import logging
import sys

def setup_logger():
    logging.basicConfig(
        stream=sys.stdout,
        level=logging.INFO,
        format="%(message)s"
    )
    structlog.configure(
        processors=[
            structlog.processors.TimeStamper(fmt="iso", key="ts"),
            structlog.stdlib.add_log_level,
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.JSONRenderer(),
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )
    return structlog.get_logger()
