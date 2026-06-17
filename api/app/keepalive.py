"""Self-ping loop to stop Render's free tier from spinning the service down.

Render's free web services sleep after ~15 minutes with no inbound HTTP request, then
take ~50s to cold-start on the next visit. If SELF_PING_URL is set (the service's own
public URL), this hits its own /api/health endpoint every PING_INTERVAL_SECONDS — well
under the 15-minute threshold — so it never goes idle long enough to sleep. The ping
must go out over the real public URL (not localhost) since Render's idle timer is based
on actual inbound network requests, not internal process activity.

No-op locally / anywhere SELF_PING_URL isn't set.
"""
import asyncio
import logging
import os
import urllib.request

logger = logging.getLogger("keepalive")

PING_INTERVAL_SECONDS = int(os.environ.get("SELF_PING_INTERVAL_SECONDS", 600))  # 10 min


def _ping(url: str) -> None:
    try:
        with urllib.request.urlopen(url, timeout=10) as resp:
            logger.info("keepalive ping %s -> %s", url, resp.status)
    except Exception as e:
        logger.warning("keepalive ping failed: %s", e)


async def run_keepalive() -> None:
    url = os.environ.get("SELF_PING_URL")
    if not url:
        return
    health_url = url.rstrip("/") + "/api/health"
    loop = asyncio.get_running_loop()
    while True:
        await loop.run_in_executor(None, _ping, health_url)
        await asyncio.sleep(PING_INTERVAL_SECONDS)
