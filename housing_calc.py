"""Housing affordability projections.

This module replicates the main projection logic from the web
calculator and exposes a small CLI to run projections offline.
"""

from __future__ import annotations

from argparse import ArgumentParser
from dataclasses import dataclass
from typing import Iterable, List

# Salary growth schedules for each career path. The "stay" path now models a
# fixed raise of €2,000 every 18 months starting from €21,000 and capping at
# €30,000. Growth values represent the year-over-year increase applied to the
# previous year's salary.
STAY_GROWTH_RATES = [
    0.0,
    0.095238,
    0.086957,
    0.0,
    0.08,
    0.074074,
    0.0,
    0.034483,
    0.0,
]

CAREER_GROWTH = {
    "stay": STAY_GROWTH_RATES,
    "odoo": [0.1, 0.05, 0.03],
    "ai": [0.15, 0.08, 0.04],
}


@dataclass
class ProjectionInput:
    """Parameters required for a projection."""

    price: float
    years: int
    inflation: float
    floor: float
    salary: float
    save_rate: float
    ret_rate: float
    career: str
    init_savings: float
    size: float = 1.0


def inflation_for(year: int, base: float, floor: float) -> float:
    """Return the inflation rate for a specific year."""
    if year < 5:
        return base
    reduced = base - 0.005 * (year - 4)
    return max(reduced, floor)


def mortgage_payment(principal: float, rate_pct: float, years: int) -> float:
    """Monthly mortgage payment using the annuity formula.

    Returns 0 when ``years`` is less than or equal to zero.
    """
    r = rate_pct / 100 / 12
    n = years * 12
    if n <= 0:
        return 0.0
    if r == 0:
        return principal / n
    return (principal * r * (1 + r) ** n) / ((1 + r) ** n - 1)


def project_price(
    base: float, years: int, infl: float, floor: float
) -> List[float]:
    """Return property price projection for a given inflation scenario."""
    values = [base]
    price = base
    for y in range(1, years + 1):
        price *= 1 + inflation_for(y, infl, floor)
        values.append(price)
    return values


def growth_for(year: int, career: str) -> float:
    """Return salary growth based on a predefined career path.

    The "stay" path uses a fixed table of annual increases matching
    €2,000 raises every 18 months from a starting salary of €21,000
    up to €30,000.
    """
    schedule = CAREER_GROWTH[career]
    if career == "stay":
        return schedule[year] if year < len(schedule) else 0.0
    if year < 5:
        return schedule[0]
    if year < 10:
        return schedule[1]
    return schedule[2]


def project_salary(base: float, years: int, career: str) -> List[float]:
    """Return projected monthly salary values."""
    values = [base]
    salary = base
    for y in range(1, years + 1):
        salary *= 1 + growth_for(y - 1, career)
        values.append(salary)
    return values


def project_savings(
    base_salary: float,
    save_rate: float,
    years: int,
    ret_rate: float,
    career: str,
    init_savings: float,
) -> List[float]:
    """Return projected savings balance over time."""
    savings = init_savings
    values = [savings]
    salary = base_salary
    for y in range(1, years + 1):
        salary *= 1 + growth_for(y - 1, career)
        savings *= 1 + ret_rate
        savings += salary * save_rate * 12
        values.append(savings)
    return values


def run_projection(params: ProjectionInput) -> None:
    """Compute and print projection tables."""
    prices = project_price(
        params.price * params.size,
        params.years,
        params.inflation,
        params.floor,
    )
    salaries = project_salary(params.salary, params.years, params.career)
    savings = project_savings(
        params.salary,
        params.save_rate,
        params.years,
        params.ret_rate,
        params.career,
        params.init_savings,
    )
    print("Year,Price,Savings,Salary")
    for y in range(params.years + 1):
        print(f"{y},{prices[y]:.2f},{savings[y]:.2f},{salaries[y]:.2f}")


def parse_args(argv: Iterable[str] | None = None) -> ProjectionInput:
    """Parse command line arguments."""
    parser = ArgumentParser(description="Housing projection CLI")
    parser.add_argument(
        "--price", type=float, required=True, help="Price per m2"
    )
    parser.add_argument(
        "--size", type=float, default=1.0, help="Property size"
    )
    parser.add_argument(
        "--years", type=int, default=10, help="Projection years"
    )
    parser.add_argument(
        "--inflation", type=float, default=0.05, help="Base inflation rate"
    )
    parser.add_argument(
        "--floor", type=float, default=0.02, help="Inflation floor"
    )
    parser.add_argument(
        "--salary", type=float, default=1500, help="Monthly salary"
    )
    parser.add_argument(
        "--save-rate", type=float, default=0.1, help="Savings rate"
    )
    parser.add_argument(
        "--return-rate",
        type=float,
        default=0.03,
        help="Annual return on savings",
    )
    parser.add_argument(
        "--career",
        choices=CAREER_GROWTH.keys(),
        default="stay",
        help="Career path",
    )
    parser.add_argument(
        "--init-savings", type=float, default=0.0, help="Initial savings"
    )
    args = parser.parse_args(argv)
    return ProjectionInput(
        price=args.price,
        years=args.years,
        inflation=args.inflation,
        floor=args.floor,
        salary=args.salary,
        save_rate=args.save_rate,
        ret_rate=args.return_rate,
        career=args.career,
        init_savings=args.init_savings,
        size=args.size,
    )


def main(argv: Iterable[str] | None = None) -> None:
    """Entry point for the CLI."""
    params = parse_args(argv)
    run_projection(params)


if __name__ == "__main__":
    main()
