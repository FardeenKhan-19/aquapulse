import os
import re

def replace_in_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception:
        return

    # Case preserving replace
    new_content = re.sub(r'JalSatya', 'AquaPulse', content)
    new_content = re.sub(r'jalsatya', 'aquapulse', new_content)
    new_content = re.sub(r'JALSATYA', 'AQUAPULSE', new_content)

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated: {filepath}")

def walk_and_replace(directory):
    excludes = {'.git', 'node_modules', '.next', 'venv', '__pycache__', 'dist', 'build'}
    for root, dirs, files in os.walk(directory):
        dirs[:] = [d for d in dirs if d not in excludes]
        for file in files:
            if file.endswith(('.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.html', '.css', '.py', '.env', '.env.local', '.env.example', '.txt', '.yml', '.yaml', '.ini')):
                replace_in_file(os.path.join(root, file))

if __name__ == "__main__":
    walk_and_replace(r'E:\EcoHive\frontend')
    walk_and_replace(r'E:\EcoHive\jalsatya-backend')
    print("Code replacements complete.")
