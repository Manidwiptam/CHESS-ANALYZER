#!/usr/bin/env python3
"""
Test script to verify backend functionality
"""
import requests
import json

def test_health():
    """Test health endpoint"""
    try:
        response = requests.get("http://localhost:8000/health")
        if response.status_code == 200:
            print("✅ Health check passed")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

def test_analysis():
    """Test analysis endpoint with a simple game"""
    test_pgn = """[Event "Test Game"]
[Site "Local Test"]
[Date "2024.01.01"]
[Round "1"]
[White "Test"]
[Black "Test"]
[Result "*"]

1. e4 e5 2. Nf3 Nc6 *"""

    try:
        response = requests.post(
            "http://localhost:8000/analyze",
            json={"pgn": test_pgn},
            headers={"Content-Type": "application/json"}
        )

        if response.status_code == 200:
            data = response.json()
            print(f"✅ Analysis test passed - {len(data['moves'])} moves analyzed")
            return True
        else:
            print(f"❌ Analysis test failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Analysis test error: {e}")
        return False

if __name__ == "__main__":
    print("Testing Chess Analysis Backend...")
    print("=" * 40)

    health_ok = test_health()
    analysis_ok = test_analysis()

    print("=" * 40)
    if health_ok and analysis_ok:
        print("🎉 All tests passed! Backend is ready for deployment.")
    else:
        print("❌ Some tests failed. Please check the backend configuration.")