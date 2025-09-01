from backend.tax_logic import calculate_tax

def test_calculate_tax_basic():
    data = {"income": 500000, "deductions": {"ded_80c": 150000, "hra": 50000, "std_ded": 50000}}
    result = calculate_tax(data)
    assert "old_regime" in result
    assert "new_regime" in result
