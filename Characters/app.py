#!/usr/bin/env python3
"""
Simple HTTP server for CharacterSheets.
Run: python app.py
Opens the project in your default browser.
"""

import http.server
import socketserver
import webbrowser
import os
from threading import Timer

PORT = 8080
# Serve from Gaming root to allow cross-folder imports (e.g., ../../Dice/)
DIRECTORY = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP handler that suppresses routine request logging."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def log_message(self, format, *args):
        # Only log errors, not every request
        if args and len(args) > 1 and str(args[1]).startswith('2'):
            return  # Suppress 2xx success logs
        super().log_message(format, *args)


def open_browser():
    """Open browser after server starts."""
    webbrowser.open(f'http://localhost:{PORT}/Characters/index.html')


if __name__ == '__main__':
    with socketserver.TCPServer(("", PORT), QuietHandler) as httpd:
        print(f"Serving Gaming at http://localhost:{PORT}")
        print(f"Opening Characters/index.html...")
        print("Press Ctrl+C to stop")
        Timer(0.5, open_browser).start()
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")
