import sys
import uvicorn

if __name__ == '__main__':
    dev_mode = '--dev' in sys.argv
    print(f'Starting CharterMind Backend Server on http://localhost:8000 (Auto-reload: {dev_mode}) ...')
    uvicorn.run(
        'app.main:app',
        host='0.0.0.0',
        port=8000,
        reload=dev_mode,
        reload_dirs=['app'] if dev_mode else None,
        reload_includes=['*.py'] if dev_mode else None,
        reload_excludes=['venv', '.git', '__pycache__'] if dev_mode else None,
        log_level='info',
    )
