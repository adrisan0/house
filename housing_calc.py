"""Housing affordability projections.

This module replicates the main projection logic from the web
calculator and exposes a small CLI to run projections offline.
Salaries can be provided as net monthly amounts or annual gross
with pay periods and IRPF withholding.
"""

from __future__ import annotations

from argparse import ArgumentParser
from dataclasses import dataclass
from typing import Iterable, List

CAREER_GROWTH = {
    "stay": [0.05, 0.03, 0.02],
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
    salary_type: str = "net"
    pays: int = 12
    irpf: float = 0.2
    size: float = 1.0


def inflation_for(year: int, base: float, floor: float) -> float:
    """Return the inflation rate for a specific year."""
    if year < 5:
        return base
    reduced = base - 0.005 * (year - 4)
    return max(reduced, floor)


def mortgage_payment(principal: float, rate_pct: float, years: int) -> float:
    """Monthly mortgage payment using the annuity formula."""
    r = rate_pct / 100 / 12
    n = years * 12
    if r == 0:
        return principal / n
    return (principal * r * (1 + r) ** n) / ((1 + r) ** n - 1)


def project_price(base: float, years: int, infl: float, floor: float) -> List[float]:
    """Return property price projection for a given inflation scenario."""
    values = [base]
    price = base
    for y in range(1, years + 1):
        price *= 1 + inflation_for(y, infl, floor)
        values.append(price)
    return values


def growth_for(year: int, career: str) -> float:
    """Return salary growth based on a predefined career path."""
    schedule = CAREER_GROWTH[career]
    if year < 5:
        return schedule[0]
    if year < 10:
        return schedule[1]
    return schedule[2]


def net_monthly(gross: float, pays: int, irpf: float) -> float:
    """Convert an annual gross salary to net monthly amount."""
    return gross / pays * (1 - irpf)


def project_salary(base: float, years: int, career: str) -> List[float]:
    """Return projected monthly net salary values."""
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
    """Return projected savings balance over time using net salary."""
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
    base_net = (
        params.salary
        if params.salary_type == "net"
        else net_monthly(params.salary, params.pays, params.irpf)
    )
    salaries = project_salary(base_net, params.years, params.career)
    savings = project_savings(
        base_net,
        params.save_rate,
        params.years,
        params.ret_rate,
        params.career,
        params.init_savings,
    )
    print("Year,Price,Savings,MonthlySaving,Salary")
    for y in range(params.years + 1):
        save = salaries[y] * params.save_rate
        print(
            f"{y},{prices[y]:.2f},{savings[y]:.2f},{save:.2f},{salaries[y]:.2f}"
        )


def parse_args(argv: Iterable[str] | None = None) -> ProjectionInput:
    """Parse command line arguments."""
    parser = ArgumentParser(description="Housing projection CLI")
    parser.add_argument("--price", type=float, required=True, help="Price per m2")
    parser.add_argument("--size", type=float, default=1.0, help="Property size")
    parser.add_argument("--years", type=int, default=10, help="Projection years")
    parser.add_argument(
        "--inflation", type=float, default=0.05, help="Base inflation rate"
    )
    parser.add_argument("--floor", type=float, default=0.02, help="Inflation floor")
    parser.add_argument("--salary", type=float, default=1500, help="Monthly salary")
    parser.add_argument(
        "--salary-type",
        choices=["net", "gross"],
        default="net",
        help="Input salary as net monthly or gross annual",
    )
    parser.add_argument("--pays", type=int, default=12, help="Pay periods per year")
    parser.add_argument("--irpf", type=float, default=20.0, help="IRPF percentage")
    parser.add_argument("--save-rate", type=float, default=0.1, help="Savings rate")
    parser.add_argument(
        "--return-rate", type=float, default=0.03, help="Annual return on savings"
    )
    parser.add_argument(
        "--career", choices=CAREER_GROWTH.keys(), default="stay", help="Career path"
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
        salary_type=args.salary_type,
        pays=args.pays,
        irpf=args.irpf / 100,
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
