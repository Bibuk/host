#!/usr/bin/env python3
"""Health check script for Docker."""

import sys
import httpx


def check_health(url: str = "http://localhost:8000/health") -> bool:
    """Check if the API is healthy."""
    try:
        response = httpx.get(url, timeout=5.0)
        if response.status_code == 200:
            data = response.json()
            return data.get("status") == "healthy"
        return False
    except Exception as e:
        print(f"Health check failed: {e}")
        return False


if __name__ == "__main__":
    if check_health():
        print("Health check passed")
        sys.exit(0)
    else:
        print("Health check failed")
        sys.exit(1)
