import requests
import time

# Replace with your deployed domain
url = "https://ticklet.dev"

while True:
    try:
        r = requests.get(url)
        print(f"[{time.ctime()}] Pinged {url} - Status {r.status_code}")
    except Exception as e:
        print(f"Failed to ping: {e}")
    time.sleep(300)  # every 5 mins