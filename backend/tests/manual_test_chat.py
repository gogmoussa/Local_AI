import requests
import json
import sys

def test_chat():
    url = "http://localhost:8000/api/chat"
    headers = {"Content-Type": "application/json"}
    data = {
        "model": "gpt-oss:20b",
        "messages": [
            {"role": "user", "content": "Hello, say 'Test Successful' if you can hear me."}
        ],
        "stream": False
    }

    try:
        print(f"Sending request to {url}...")
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        result = response.json()
        print("Response received:")
        print(json.dumps(result, indent=2))
        
        content = result.get("message", {}).get("content", "")
        if content:
            print("\nSUCCESS: Received content from LLM.")
        else:
            print("\nWARNING: Received empty content from LLM.")
            
    except requests.exceptions.ConnectionError:
        print("ERROR: Could not connect to the server. Is it running?")
        sys.exit(1)
    except requests.exceptions.HTTPError as e:
        print(f"ERROR: HTTP error occurred: {e}")
        print(response.text)
        sys.exit(1)
    except Exception as e:
        print(f"ERROR: An error occurred: {e}")
        sys.exit(1)

if __name__ == "__main__":
    test_chat()
