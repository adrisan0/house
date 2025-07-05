import math

from housing_calc import inflation_for, mortgage_payment, project_price

def test_inflation_for():
    assert math.isclose(inflation_for(0, 0.05, 0.02), 0.05)
    assert math.isclose(inflation_for(6, 0.05, 0.02), 0.04)
    assert math.isclose(inflation_for(15, 0.05, 0.02), 0.02)

def test_mortgage_payment_zero_rate():
    assert mortgage_payment(120000, 0, 30) == 333.3333333333333

def test_project_price():
    data = project_price(1000, 2, 0.05, 0.02)
    assert len(data) == 3
    assert data[0] == 1000
    assert round(data[1], 2) == 1050.0

