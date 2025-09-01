from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_calculate_tax_endpoint():
    data = {"income": 500000, "deductions": {"ded_80c": 150000, "hra": 50000, "std_ded": 50000}}
    response = client.post("/calculate_tax", json=data)
    assert response.status_code == 200
    assert "old_regime" in response.json()
