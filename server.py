#!/usr/bin/env python3
"""
Simple HTTP server for the Gaming project.
Run: python server.py
Serves all sub-projects (Dice, Names, Characters) from one server.
"""

import http.server
import socketserver
import webbrowser
import os
import sys
from threading import Timer

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP handler with proper MIME types and quiet logging."""

    # Fix MIME types for JS modules
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.js': 'application/javascript',
        '.mjs': 'application/javascript',
        '.css': 'text/css',
    }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def log_message(self, format, *args):
        # Only log errors, not routine requests
        if args and len(args) > 1 and str(args[1]).startswith('2'):
            return
        super().log_message(format, *args)


def open_browser(path='/'):
    """Open browser after server starts."""
    webbrowser.open(f'http://localhost:{PORT}{path}')


if __name__ == '__main__':
    # Allow specifying a start page: python server.py Characters/index.html
    start_path = '/' + sys.argv[1] if len(sys.argv) > 1 else '/'

    with socketserver.TCPServer(("", PORT), QuietHandler) as httpd:
        print(f"Gaming server at http://localhost:{PORT}")
        print(f"  Dice:       http://localhost:{PORT}/Dice/")
        print(f"  Names:      http://localhost:{PORT}/Names/")
        print(f"  Characters: http://localhost:{PORT}/Characters/")
        print("Press Ctrl+C to stop")
        Timer(0.5, lambda: open_browser(start_path)).start()
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")
