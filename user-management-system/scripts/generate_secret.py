#!/usr/bin/env python3
"""Generate secret key for application."""

import secrets


def generate_secret_key(length: int = 32) -> str:
    """Generate a secure secret key."""
    return secrets.token_hex(length)


if __name__ == "__main__":
    key = generate_secret_key()
    print(f"Generated secret key:\n{key}")
    print(f"\nAdd to your .env file:")
    print(f"SECRET_KEY={key}")
