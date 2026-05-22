#!/usr/bin/env python3
"""
minios serial bridge: kernel <-> COM1 (QEMU TCP serial) <-> OpenAI.

Data flow:
    you type --> bridge --(>question)--> kernel --(?question)--> bridge
              --> OpenAI --> bridge --(<answer)--> kernel (renders on VGA)

The kernel echoes each question back as "?question"; that echo is what
triggers the OpenAI call, so the kernel is genuinely in the round-trip.

The API key is read from the OPENAI_API_KEY environment variable. Use
bridge.ps1, which decrypts your DPAPI-protected key into that variable for
the lifetime of the process only. Or pass --mock to skip OpenAI entirely.
"""
import argparse
import json
import os
import socket
import sys
import time
import urllib.error
import urllib.request


def log(*a):
    print("[bridge]", *a, file=sys.stderr, flush=True)


class SerialLink:
    """Line-oriented link to QEMU's COM1 exposed as a TCP server."""

    def __init__(self, host, port, connect_timeout=20, io_timeout=60):
        self.buf = b""
        deadline = time.time() + connect_timeout
        while True:
            try:
                self.sock = socket.create_connection((host, port), timeout=5)
                break
            except OSError as e:
                if time.time() > deadline:
                    raise SystemExit(
                        f"could not connect to QEMU serial {host}:{port}: {e}\n"
                        "Start the kernel first:  ./run.ps1 -Chat")
                time.sleep(0.3)
        self.sock.settimeout(io_timeout)

    def readline(self):
        while b"\n" not in self.buf:
            try:
                chunk = self.sock.recv(4096)
            except socket.timeout:
                return None
            if not chunk:
                return None
            self.buf += chunk
        line, self.buf = self.buf.split(b"\n", 1)
        return line.rstrip(b"\r").decode("utf-8", "replace")

    def send(self, text):
        self.sock.sendall(text.encode("utf-8"))


def sanitize(text, limit=1000):
    """Collapse to a single ASCII line that fits the kernel's line buffer."""
    text = text.replace("\r", " ").replace("\n", " ")
    text = "".join(ch if 32 <= ord(ch) < 127 else "?" for ch in text)
    text = " ".join(text.split())
    return text[:limit]


def ask_openai(key, question, model):
    body = json.dumps({
        "model": model,
        "messages": [
            {"role": "system", "content":
                "You are minios, a tiny hobby OS kernel that just learned to "
                "talk. Answer in at most two short sentences, plain ASCII only."},
            {"role": "user", "content": question},
        ],
        "max_tokens": 200,
        "temperature": 0.7,
    }).encode("utf-8")
    req = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=body,
        headers={"Authorization": "Bearer " + key,
                 "Content-Type": "application/json"},
        method="POST")
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            data = json.loads(r.read().decode("utf-8"))
        return data["choices"][0]["message"]["content"]
    except urllib.error.HTTPError as e:
        return f"[openai http {e.code}: {e.read().decode('utf-8', 'replace')[:160]}]"
    except Exception as e:  # noqa: BLE001 - surface anything to the screen
        return f"[bridge error: {e}]"


def reply_for(args, key, question):
    if args.mock:
        return f"[mock] you asked: {question} -- minios is a 32-bit Multiboot kernel."
    return sanitize(ask_openai(key, question, args.model))


def wait_for_ready(link):
    deadline = time.time() + 20
    while time.time() < deadline:
        ln = link.readline()
        if ln is None:
            raise SystemExit("serial closed before kernel sent READY")
        log("kernel:", ln)
        if ln.strip() == "READY":
            return True
    log("warning: never saw READY; continuing")
    return False


def turn(link, args, key, question):
    """Seed the kernel, wait for its '?' echo, then answer it."""
    link.send(">" + question + "\n")
    deadline = time.time() + 20
    while time.time() < deadline:
        ln = link.readline()
        if ln is None:
            return None
        if ln.startswith("?"):
            ans = reply_for(args, key, ln[1:])
            link.send("<" + ans + "\n")
            return ans
    return None


def main():
    ap = argparse.ArgumentParser(description="minios serial <-> OpenAI bridge")
    ap.add_argument("--host", default="127.0.0.1")
    ap.add_argument("--port", type=int, default=4555)
    ap.add_argument("--model", default="gpt-4o-mini")
    ap.add_argument("--mock", action="store_true",
                    help="don't call OpenAI; return a canned reply (no key needed)")
    ap.add_argument("--once", metavar="QUESTION",
                    help="run one question then exit (for testing)")
    args = ap.parse_args()

    key = os.environ.get("OPENAI_API_KEY", "")
    if not args.mock and not key:
        raise SystemExit(
            "OPENAI_API_KEY not set. Run via bridge.ps1 (decrypts your DPAPI "
            "key), or pass --mock.")

    link = SerialLink(args.host, args.port)
    log(f"connected to kernel at {args.host}:{args.port}"
        + (" [MOCK]" if args.mock else f" [model={args.model}]"))
    wait_for_ready(link)

    if args.once is not None:
        ans = turn(link, args, key, args.once)
        ok = ans is not None
        if ok:
            log("answered:", ans)
        print("ROUND-TRIP OK" if ok else "ROUND-TRIP FAILED")
        time.sleep(0.5)  # let the kernel render before QEMU is killed
        sys.exit(0 if ok else 1)

    print("minios chat ready. Ask away (Ctrl-C to quit).\n")
    try:
        while True:
            try:
                q = input("you> ").strip()
            except EOFError:
                break
            if not q:
                continue
            ans = turn(link, args, key, q)
            print("ai>  " + (ans if ans else "[no response from kernel]") + "\n")
    except KeyboardInterrupt:
        pass
    log("bye")


if __name__ == "__main__":
    main()
