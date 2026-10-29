"""
server.py
Minimalist HTTP backend for Student Grade Analyzer.
Serves static frontend files and syncs grades data directly with data/grades.json.
Uses standard library http.server (zero external dependencies).
"""

from http.server import SimpleHTTPRequestHandler, HTTPServer
from pathlib import Path
import json
from grade_analyzer import load_data, save_data

FRONTEND_DIR = Path("frontend")
PORT = 8000


class GradeHandler(SimpleHTTPRequestHandler):
    """Handles static web requests and REST API endpoints for student grades."""

    def __init__(self, *args, **kwargs):
        # Serve static assets from the frontend directory
        super().__init__(*args, directory=str(FRONTEND_DIR), **kwargs)

    def do_GET(self) -> None:
        """Handle GET requests for API data or static files."""
        if self.path == "/api/grades":
            data = load_data()
            payload = json.dumps(data).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
        else:
            super().do_GET()

    def do_POST(self) -> None:
        """Handle POST requests to update student grades in data/grades.json."""
        if self.path == "/api/grades":
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length).decode("utf-8")
            try:
                data = json.loads(body)
                save_data(data)
                res = json.dumps({"status": "ok"}).encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(res)
            except Exception as e:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(str(e).encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()


def run_server(port: int = PORT) -> None:
    """Start local web server."""
    server = HTTPServer(("localhost", port), GradeHandler)
    print("=" * 60)
    print("         STUDENT GRADE ANALYZER - WEB DASHBOARD")
    print("=" * 60)
    print(f"  > Dashboard running at : http://localhost:{port}")
    print(f"  > Serving frontend from: {FRONTEND_DIR.resolve()}")
    print("  > Synced with data file: data/grades.json")
    print("  > Press Ctrl+C in terminal to stop.")
    print("=" * 60)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[✓] Server stopped gracefully.")


if __name__ == "__main__":
    run_server()

