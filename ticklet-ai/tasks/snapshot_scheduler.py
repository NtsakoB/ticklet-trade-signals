import requests
import logging

def schedule_cleanup():
    """
    Deletes old accuracy snapshots (>6 months) via API call.
    This can be triggered by cron jobs or APScheduler.
    """
    try:
        res = requests.delete("http://localhost:8000/api/accuracy_snapshots/cleanup")
        if res.status_code == 200:
            logging.info("✅ Scheduled snapshot cleanup successful.")
        else:
            logging.warning(f"⚠️ Cleanup failed with status {res.status_code}: {res.text}")
    except Exception as e:
        logging.error(f"Error in scheduled cleanup: {e}")

if __name__ == "__main__":
    # Run cleanup if executed directly
    logging.basicConfig(level=logging.INFO)
    schedule_cleanup()