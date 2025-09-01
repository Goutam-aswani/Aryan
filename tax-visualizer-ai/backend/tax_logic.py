
def calculate_tax(data):
    income = data.get('income', 0) or 0
    # --- Old Regime ---
    std_ded_old = 50000
    deductions_old = std_ded_old
    taxable_old = max(0, income - deductions_old)
    old_breakdown = []
    old_tax = 0
    old_slabs = [
        (250000, 0.0),
        (250000, 0.05),
        (500000, 0.20),
        (float('inf'), 0.30)
    ]
    remaining = taxable_old
    prev_limit = 0
    for limit, rate in old_slabs:
        slab_amt = min(remaining, limit)
        if slab_amt > 0:
            tax_amt = slab_amt * rate
            old_breakdown.append({
                "range": f"₹{prev_limit+1}-{prev_limit+slab_amt}",
                "rate": rate*100,
                "tax": round(tax_amt)
            })
            old_tax += tax_amt
            remaining -= slab_amt
            prev_limit += slab_amt
        if remaining <= 0:
            break
    old_tax_total = round(old_tax)

    # --- New Regime ---
    std_ded_new = 75000
    deductions_new = std_ded_new
    taxable_new = max(0, income - deductions_new)
    new_breakdown = []
    new_tax = 0
    new_slabs = [
        (400000, 0.0),
        (400000, 0.05),
        (400000, 0.10),
        (400000, 0.15),
        (400000, 0.20),
        (400000, 0.25),
        (float('inf'), 0.30)
    ]
    if taxable_new <= 1200000:
        new_tax_total = 0
        # For transparency, show breakdown as all slabs 0
        remaining = taxable_new
        prev_limit = 0
        for limit, rate in new_slabs:
            slab_amt = min(remaining, limit)
            if slab_amt > 0:
                new_breakdown.append({
                    "range": f"₹{prev_limit+1}-{prev_limit+slab_amt}",
                    "rate": rate*100,
                    "tax": 0
                })
                remaining -= slab_amt
                prev_limit += slab_amt
            if remaining <= 0:
                break
    else:
        remaining = taxable_new
        prev_limit = 0
        for limit, rate in new_slabs:
            slab_amt = min(remaining, limit)
            if slab_amt > 0:
                tax_amt = slab_amt * rate
                new_breakdown.append({
                    "range": f"₹{prev_limit+1}-{prev_limit+slab_amt}",
                    "rate": rate*100,
                    "tax": round(tax_amt)
                })
                new_tax += tax_amt
                remaining -= slab_amt
                prev_limit += slab_amt
            if remaining <= 0:
                break
        new_tax_total = round(new_tax)

    return {
        "old_regime": {
            "tax": old_tax_total,
            "breakdown": old_breakdown,
            "taxable_income": taxable_old,
            "total_income": income,
            "deductions": deductions_old
        },
        "new_regime": {
            "tax": new_tax_total,
            "breakdown": new_breakdown,
            "taxable_income": taxable_new,
            "total_income": income,
            "deductions": deductions_new
        }
    }

def simulate_tax(data):
    # Placeholder: simulate scenario
    return calculate_tax(data)
