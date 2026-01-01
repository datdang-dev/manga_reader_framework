import http.server
import socketserver
import webbrowser
import threading
import sys

Handler = http.server.SimpleHTTPRequestHandler

def start_server():
    port = 8000
    while True:
        try:
            # allow_reuse_address might help with zombies but not active listeners
            socketserver.TCPServer.allow_reuse_address = True 
            with socketserver.TCPServer(("", port), Handler) as httpd:
                print(f"\n✅ Server running at: http://localhost:{port}")
                print("Press Ctrl+C to stop.\n")
                
                # Open browser
                threading.Thread(target=lambda: webbrowser.open(f"http://localhost:{port}"), daemon=True).start()
                
                httpd.serve_forever()
            break
        except OSError as e:
            if e.errno == 10048: # Address already in use or permission denied
                print(f"Port {port} is busy, trying {port+1}...")
                port += 1
            else:
                raise e

if __name__ == "__main__":
    try:
        start_server()
    except KeyboardInterrupt:
        print("\nServer stopped.")
        sys.exit(0)
