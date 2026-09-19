#!/usr/bin/env python3
"""Static dev server that never lets the browser cache.

python -m http.server sends Last-Modified and no Cache-Control, so browsers
happily reuse css/js from memory. During this build that repeatedly made
fixed code look broken - the page was still running the previous file.
"""
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler


class NoCache(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8123
    print('serving %s on http://localhost:%d (no-store)' % (sys.argv[0], port))
    HTTPServer(('127.0.0.1', port), NoCache).serve_forever()
