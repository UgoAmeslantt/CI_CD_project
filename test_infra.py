import socket
import urllib.request
import sys
import time

def check_port(host, port):
    try:
        with socket.create_connection((host, port), timeout=2):
            return True
    except OSError:
        return False

def check_http(url):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        response = urllib.request.urlopen(req, timeout=5)
        return response.getcode() == 200
    except Exception as e:
        print(f"HTTP check failed for {url}: {e}")
        return False

def wait_for_services():
    print("Waiting for services to boot (up to 90 seconds)...")
    for i in range(45):
        mysql_ok = check_port("localhost", 3306) or check_port("db", 3306)
        api_ok = check_port("localhost", 8000) or check_port("api", 8000)
        adminer_ok = check_port("localhost", 8080) or check_port("adminer", 8080)
        react_ok = check_port("localhost", 3000) or check_port("react", 3000)
        
        if mysql_ok and api_ok and adminer_ok and react_ok:
            print(f"✅ All ports are open after {i * 2} seconds!")
            return True
            
        print(f"Waiting... (MySQL: {'OK' if mysql_ok else 'DOWN'}, API: {'OK' if api_ok else 'DOWN'}, Adminer: {'OK' if adminer_ok else 'DOWN'}, React: {'OK' if react_ok else 'DOWN'})")
        time.sleep(2)
    return False

def run_infra_tests():
    print("Starting infrastructure tests...")
    
    # 1. Verification de la base de donnees
    mysql_hosts = ["localhost", "db"]
    mysql_up = False
    for host in mysql_hosts:
        if check_port(host, 3306):
            print(f"✅ MySQL database port is open on {host}:3306")
            mysql_up = True
            break
    if not mysql_up:
        print("❌ MySQL database port 3306 is closed.")
        return False

    # 2. Verification de l'API FastAPI
    api_urls = ["http://localhost:8000/users", "http://api:8000/users"]
    api_up = False
    for url in api_urls:
        if check_http(url):
            print(f"✅ FastAPI backend is healthy at {url}")
            api_up = True
            break
    if not api_up:
        print("❌ FastAPI backend is unhealthy or unreachable.")
        return False

    # 3. Verification d'Adminer
    adminer_urls = ["http://localhost:8080", "http://adminer:8080"]
    adminer_up = False
    for url in adminer_urls:
        if check_http(url):
            print(f"✅ Adminer is up at {url}")
            adminer_up = True
            break
    if not adminer_up:
        print("❌ Adminer is unhealthy or unreachable.")
        return False

    # 4. Verification de React
    react_urls = ["http://localhost:3000", "http://react:3000"]
    react_up = False
    for url in react_urls:
        if check_http(url):
            print(f"✅ React frontend is serving pages at {url}")
            react_up = True
            break
    if not react_up:
        print("❌ React frontend is unhealthy or unreachable.")
        return False

    print("🎉 All infrastructure tests passed successfully!")
    return True

if __name__ == "__main__":
    if not wait_for_services():
        print("❌ Timeout: Services failed to start within 90 seconds.")
        sys.exit(1)
        
    success = run_infra_tests()
    if not success:
        sys.exit(1)
    sys.exit(0)
