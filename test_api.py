import requests
import json

pgn = '''[Event "Test Game"]
[Site "Local Test"]
[Date "2024.01.01"]
[Round "1"]
[White "Test"]
[Black "Test"]
[Result "*"]

1. e4 e5 2. Nf3 Nc6 *'''

response = requests.post('http://localhost:8000/analyze', json={'pgn': pgn})
print('Status:', response.status_code)
print('Response:', response.json())