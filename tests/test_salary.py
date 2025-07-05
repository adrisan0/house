from housing_calc import project_salary


def test_project_salary_stay_raise():
    base = 25000 / 12
    data = project_salary(base, 5, "stay")
    expected = [
        25000 / 12,
        25000 / 12,
        27000 / 12,
        29000 / 12,
        29000 / 12,
        30000 / 12,
    ]
    assert len(data) == len(expected)
    for got, exp in zip(data, expected):
        assert round(got, 2) == round(exp, 2)
