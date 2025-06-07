"""
End-to-end test script for the Mood Embedding backend.

Spins up the Node/Express server from the local repo (using `npm run dev`),
waits for it to be ready, then exercises the `/api/mood` endpoint with
representative payloads:

1. Text-only request.
2. URL-only request.
3. Mixed request containing text, URL and an image (downloaded on the fly and
   converted to base64).
4. Negative test – empty body (expects HTTP 400).

Requires:  Python ≥3.8, `requests` package installed.

Usage::

    python test_backend.py             # spawns server, runs tests, exits

Set BACKEND_URL env var to hit an already-running instance instead of spawning
locally::

    BACKEND_URL=http://localhost:5000 python test_backend.py
"""

from __future__ import annotations

import base64
import os
import subprocess
import sys
import time
import traceback
import json
from contextlib import contextmanager
from typing import Generator

import requests


DEFAULT_BACKEND_URL = "http://localhost:5000"


def wait_for_server(url: str, timeout: float = 120.0) -> None:
    """Polls GET / until the server responds or *timeout* seconds elapse."""

    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            resp = requests.get(url, timeout=2)
            # Ensure we didn't accidentally talk to an unrelated service (403 from AirPlay etc.)
            server_header = resp.headers.get("Server", "")
            if "AirTunes" in server_header:
                raise ConnectionError("Port occupied by AirPlay service; waiting for desired server")
            return
        except requests.RequestException:
            time.sleep(0.5)

    raise RuntimeError(f"Server {url} did not become ready within {timeout} s")


@contextmanager
def maybe_spawn_server() -> Generator[None, None, None]:
    """Spawn `npm run dev` if BACKEND_URL not given/env default.*"""

    if os.getenv("BACKEND_URL") is not None:
        backend_url = os.environ["BACKEND_URL"].rstrip("/")
        print(f"Using existing backend: {backend_url}")
        yield backend_url
        return

    # Use a fixed high port to avoid privileged restrictions (dynamic bind may
    # be blocked in sandbox environments).
    free_port = 51888

    env = os.environ.copy()
    env["PORT"] = str(free_port)
    backend_url = f"http://localhost:{free_port}"

    print(f"Spawning local backend server on port {free_port}…")

    def launch_dist() -> subprocess.Popen:
        # Compile backend-only TypeScript (tsconfig.server.json)
        print("Building backend TypeScript → dist…")
        subprocess.run(["npm", "run", "build"], env=env, check=True)
        print("Starting compiled server…")
        return subprocess.Popen(["node", "dist/server.js"], env=env)

    proc = launch_dist()

    try:
        wait_for_server(backend_url)
        print("Server ready.")
        yield backend_url
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()


def fetch_sample_image() -> str:
    """Download a small placeholder image and return base64-encoded data URI."""

    url = "https://picsum.photos/200"  # random 200×200 JPEG
    resp = requests.get(url, timeout=10)
    resp.raise_for_status()
    mime = resp.headers.get("Content-Type", "image/jpeg")
    b64 = base64.b64encode(resp.content).decode("ascii")
    return f"data:{mime};base64,{b64}"


def run_tests(base_url: str) -> None:  # noqa: C901 – okay in single script
    """Execute test suite, printing detailed diagnostics on failures."""

    passed = 0
    failed = 0

    def post(endpoint: str, payload: dict) -> requests.Response:
        return requests.post(f"{base_url}{endpoint}", json=payload, timeout=120)

    def run_case(
        name: str,
        payload: dict,
        *,
        expect_status: int = 200,
        endpoint: str = "/api/mood",
        expect_field: str | None = "aesthetic_embedding",
    ) -> None:
        nonlocal passed, failed
        print(f"{name:<35} … ", end="", flush=True)
        try:
            resp = post(endpoint, payload)
            if resp.status_code != expect_status:
                raise AssertionError(
                    f"expected HTTP {expect_status}, got {resp.status_code}\nResponse body:\n{resp.text[:1000]}"
                )

            if expect_status == 200:
                data = resp.json()

                if expect_field is not None:
                    val = data.get(expect_field)
                    assert isinstance(val, str) and val.strip(), f"missing/empty {expect_field}"

                print("✓")
                print("    ↳ input:")
                print(payload)
                if expect_field and expect_field in data:
                    print(f"    ↳ output ({expect_field}):")
                    print(data[expect_field])

                    # If the field is HTML, store input/output to disk for inspection
                    if expect_field == "html":
                        import re, pathlib, datetime, json as _json

                        artifacts_dir = pathlib.Path("artifacts")
                        artifacts_dir.mkdir(exist_ok=True)

                        # slug from test name
                        slug = re.sub(r"[^a-zA-Z0-9_-]+", "_", name.lower())
                        ts = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
                        # Determine source HTML content
                        source_html: str
                        if "html" in payload:
                            source_html = payload["html"]
                        elif "url" in payload:
                            source_html = payload["url"]
                        else:
                            source_html = "<unknown>"

                        if "html" in payload:
                            (artifacts_dir / f"{slug}_{ts}_input.html").write_text(source_html, encoding="utf-8")
                        elif "url" in payload:
                            (artifacts_dir / f"{slug}_{ts}_input.url").write_text(source_html, encoding="utf-8")
                        (artifacts_dir / f"{slug}_{ts}_output.html").write_text(data[expect_field], encoding="utf-8")
                        # also save minimal metadata json for reference
                        meta = {"name": name, "endpoint": endpoint, "payload": {k:v for k,v in payload.items() if k!="html"}, "timestamp": ts}
                        (artifacts_dir / f"{slug}_{ts}.json").write_text(_json.dumps(meta, indent=2), encoding="utf-8")
                else:
                    print("    ↳ output:")
                    print(data)
            else:
                # Non-200 expected
                print(f"✓ (expected HTTP {expect_status})")
            passed += 1
        except Exception as exc:
            failed += 1
            print("✗")
            print("----- Diagnostic info -----")
            print("Payload:")
            print(payload)
            if 'resp' in locals():
                print(f"Status: {resp.status_code}")
                print("Headers:")
                for k, v in resp.headers.items():
                    print(f"  {k}: {v}")
                print("Body (truncated to 2k):")
                print(resp.text[:2048])
            print("Exception:")
            traceback.print_exception(exc)
            print("---------------------------\n")

    # Test cases
    run_case("Text-only", {"texts": ["elegant minimalist magazine"]})

    run_case("URL-only", {"urls": ["https://www.apple.com"]})

    # Save aesthetic extracted from Apple.com for later use
    print("Generating & saving aesthetic from Apple homepage…")
    save_apple = {
        "urls": ["https://www.apple.com"],
        "name": "apple_style",
    }
    run_case("Save apple aesthetic", save_apple)

    img_b64 = fetch_sample_image()
    payload_mixed = {
        "texts": ["playful retro arcade vibes"],
        "urls": ["https://getbootstrap.com"],
        "images": [img_b64],
    }
    run_case("Mixed (text+url+image)", payload_mixed)

    # 4. Bulk complex payload with multiple items to exercise batching
    print("Preparing bulk complex test payload…")
    images_bulk = [fetch_sample_image() for _ in range(3)]
    texts_bulk = [
        "monochrome editorial style",
        "neon cyberpunk nightscape",
        "warm rustic farmhouse aesthetic",
    ]
    urls_bulk = [
        "https://tailwindcss.com",
        "https://vercel.com",
    ]
    payload_bulk = {"texts": texts_bulk, "images": images_bulk, "urls": urls_bulk}
    run_case("Bulk multi-item payload", payload_bulk)

    # 5. Persisted aesthetic flow
    print("Generating and saving aesthetic named 'magazine_style'…")
    save_payload = {
        "texts": ["sleek minimalist magazine layout, monochrome palette"],
        "name": "magazine_style",
    }
    run_case("Save aesthetic", save_payload)

    # Retrieve via GET
    print("Retrieving saved aesthetic 'magazine_style'…", end=" ")
    resp_get = requests.get(f"{base_url}/api/aesthetic/magazine_style", timeout=30)
    assert resp_get.ok, "failed to fetch saved aesthetic"
    saved_embedding = resp_get.json().get("embedding")
    assert saved_embedding, "saved embedding missing"
    print("✓")

    # 6. HTML transform using saved embedding
    # Load external dummy site from artifacts/dummy_site.html if present, else create it
    import pathlib, textwrap
    artifacts_dir = pathlib.Path("artifacts")
    dummy_path = artifacts_dir / "dummy_site.html"
    if dummy_path.exists():
        sample_html = dummy_path.read_text(encoding="utf-8")
    else:
        sample_html = textwrap.dedent(
            """<!DOCTYPE html>
            <html>
            <head><title>Dummy</title></head>
            <body>
              <h1>Hello world</h1>
              <p>This is a demo page.</p>
            </body>
            </html>"""
        ).strip()
        artifacts_dir.mkdir(exist_ok=True)
        dummy_path.write_text(sample_html, encoding="utf-8")
    transform_payload = {
        "html": sample_html,
        "aesthetic": saved_embedding,
    }
    run_case("Transform HTML", transform_payload, endpoint="/api/transform", expect_field="html")

    # 7. Transform remote URL using saved aesthetic
    url_payload = {
        "url": "https://www.berkshirehathaway.com",
        "aesthetic_name": "apple_style",
    }
    run_case(
        "Transform URL",
        url_payload,
        endpoint="/api/transform-url",
        expect_field="html",
    )

    run_case("Negative (empty body)", {}, expect_status=400)

    print()
    if failed:
        print(f"{passed} passed, {failed} failed ❌")
        sys.exit(1)
    else:
        print(f"All {passed} tests passed ✅")


def main() -> None:
    try:
        with maybe_spawn_server() as backend_url:
            if os.getenv("OPENAI_API_KEY") is None:
                print("⚠️  OPENAI_API_KEY not found in environment – tests may fail due to authentication.")
            run_tests(backend_url.rstrip("/"))
    except AssertionError as e:
        print(f"❌ Test failed: {e}")
        sys.exit(1)
    except Exception as exc:
        print("❌ Unexpected error:", exc)
        sys.exit(2)


if __name__ == "__main__":
    main()
