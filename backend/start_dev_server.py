#!/usr/bin/env python3
import os
import sys
import subprocess
import time
from pathlib import Path

def run_command(command, cwd=None):
    """Run a command and return the process"""
    print(f"Running: {command}")
    return subprocess.Popen(command, shell=True, cwd=cwd)

def main():
    backend_dir = Path(__file__).parent
    
    # Set Django settings
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'taxora.settings')
    
    print("🚀 Starting Taxora Backend Services...")
    
    # Check if virtual environment exists
    venv_path = backend_dir / 'venv'
    if not venv_path.exists():
        print("⚠️  Virtual environment not found. Creating one...")
        subprocess.run([sys.executable, '-m', 'venv', 'venv'], cwd=backend_dir)
        
        # Activate and install requirements
        if os.name == 'nt':  # Windows
            pip_cmd = str(venv_path / 'Scripts' / 'pip')
            python_cmd = str(venv_path / 'Scripts' / 'python')
        else:  # Unix
            pip_cmd = str(venv_path / 'bin' / 'pip')
            python_cmd = str(venv_path / 'bin' / 'python')
        
        print("📦 Installing requirements...")
        subprocess.run([pip_cmd, 'install', '-r', 'requirements.txt'], cwd=backend_dir)
    
    # Use virtual environment Python
    if os.name == 'nt':  # Windows
        python_cmd = str(venv_path / 'Scripts' / 'python')
    else:  # Unix
        python_cmd = str(venv_path / 'bin' / 'python')
    
    # Run migrations
    print("🔄 Running database migrations...")
    subprocess.run([python_cmd, 'manage.py', 'migrate'], cwd=backend_dir)
    
    # Load initial data
    print("📊 Loading initial data...")
    subprocess.run([python_cmd, 'manage.py', 'loaddata', 'fixtures/initial_data.json'], 
                   cwd=backend_dir, check=False)  # Don't fail if fixture doesn't exist
    
    # Start Django development server
    print("🌟 Starting Django server on http://localhost:8000")
    django_process = run_command(f'{python_cmd} manage.py runserver 8000', cwd=backend_dir)
    
    try:
        # Wait for processes
        django_process.wait()
    except KeyboardInterrupt:
        print("\n🛑 Shutting down servers...")
        django_process.terminate()
        django_process.wait()

if __name__ == '__main__':
    main()