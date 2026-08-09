"""
Two-Plant Economic Load Dispatch -- Base/Peak Identification
---------------------------------------------------------------
A region is served by two heterogeneous plants:
    Plant 1: Rs C1 per kW per year (fixed cost), R1 paise per kWh (running)
    Plant 2: Rs C2 per kW per year (fixed cost), R2 paise per kWh (running)

The question only asks for two things:
    1. Which plant should be the BASE load plant and which the PEAK
       load plant?
    2. How many hours a year should the peak load plant operate?

Theory: approximating the annual load duration curve as a straight line
and minimising total annual cost with respect to the base/peak
switch-over point gives a clean closed-form result for the peak plant's
operating hours -- it works out to depend only on the cost figures, not
on Pmax or the load factor:

        t1 = (C_base - C_peak) / (R_peak - R_base)

where C is in Rs/kW/year and R is in Rs/kWh (paise/100). The base load
plant simply runs the full year, 8760 hours.
"""

HOURS_PER_YEAR = 8760


def get_group_member_data(group_no, member_no):
    """
    Builds the plant cost data for a given group & member number, using
    the numbering rule given in the assignment sheet:
        XX = Group Number, ZZ = |Group Number - 10|
        Y  = Member Number, K = |9 - Member Number|, J = |17 - Member Number|
    """
    XX = f"{group_no:02d}"
    ZZ = f"{abs(group_no - 10):02d}"
    Y = member_no
    K = abs(9 - member_no)
    J = abs(17 - member_no)

    Pmax_MW = int(f"5{XX}")          # 5XX  -> max demand, MW
    load_factor_pct = int(f"5{Y}")   # 5Y   -> load factor, %
    C1 = int(f"{Y}{XX}")             # YXX  -> Plant 1 fixed cost, Rs/kW/yr
    R1 = Y                           #        Plant 1 running cost, p/kWh
    C2 = int(f"{K}{ZZ}")             # KZZ  -> Plant 2 fixed cost, Rs/kW/yr
    R2 = J                           #        Plant 2 running cost, p/kWh

    return {
        "Pmax_MW": Pmax_MW,
        "load_factor_pct": load_factor_pct,
        "C1": C1, "R1": R1,
        "C2": C2, "R2": R2,
    }


def identify_base_and_peak(C1, R1_paise, C2, R2_paise):
    """
    Decides which plant is base load and which is peak load, and works
    out the peak plant's operating hours per year.

    Base load plant : higher fixed cost, lower running cost -- it runs
                       almost the whole year, so the fixed cost is spread
                       thin and the cheap running cost is what matters.
    Peak load plant  : lower fixed cost, higher running cost -- it only
                       runs a few hours a year, so cheap-to-build beats
                       cheap-to-run.
    """
    r1 = R1_paise / 100.0   # paise -> rupees per kWh
    r2 = R2_paise / 100.0

    if C1 > C2 and R1_paise < R2_paise:
        base = {"name": "Plant 1", "C": C1, "R": r1}
        peak = {"name": "Plant 2", "C": C2, "R": r2}
    elif C2 > C1 and R2_paise < R1_paise:
        base = {"name": "Plant 2", "C": C2, "R": r2}
        peak = {"name": "Plant 1", "C": C1, "R": r1}
    else:
        # no genuine trade-off -- one plant is cheaper on both counts
        cheaper = "Plant 1" if (C1 <= C2 and R1_paise <= R2_paise) else "Plant 2"
        return {"error": f"{cheaper} is cheaper on both fixed AND running "
                          f"cost -- no economic case for a second plant."}

    # optimum switch-over point (screening-curve result)
    t1 = (base["C"] - peak["C"]) / (peak["R"] - base["R"])   # hours/year
    t1 = min(max(t1, 0.0), HOURS_PER_YEAR)

    return {
        "base_plant": base["name"],
        "peak_plant": peak["name"],
        "base_hours_per_year": HOURS_PER_YEAR,
        "peak_hours_per_year": round(t1, 1),
    }


def print_report(label, data, result):
    print("=" * 56)
    print(label)
    print("-" * 56)
    print(f"Plant 1 : C1 = Rs {data['C1']}/kW/yr,  R1 = {data['R1']} p/kWh")
    print(f"Plant 2 : C2 = Rs {data['C2']}/kW/yr,  R2 = {data['R2']} p/kWh")
    print()
    if "error" in result:
        print(result["error"])
        return
    print(f"Base load plant : {result['base_plant']}  ({result['base_hours_per_year']} h/yr)")
    print(f"Peak load plant : {result['peak_plant']}  ({result['peak_hours_per_year']} h/yr)")


def ask_float(prompt):
    """Small helper so a bad entry doesn't crash the whole program."""
    while True:
        try:
            return float(input(prompt))
        except ValueError:
            print("  -> please enter a number.")


def run_interactive():
    print("Two-Plant Economic Dispatch — Base/Peak Identification")
    print("Enter each plant's cost structure.\n")

    print("Plant 1:")
    C1 = ask_float("  Fixed cost (Rs/kW/yr): ")
    R1 = ask_float("  Running cost (paise/kWh): ")
    print("Plant 2:")
    C2 = ask_float("  Fixed cost (Rs/kW/yr): ")
    R2 = ask_float("  Running cost (paise/kWh): ")

    data = {"C1": C1, "R1": R1, "C2": C2, "R2": R2}
    result = identify_base_and_peak(C1, R1, C2, R2)
    print()
    print_report("Result", data, result)


if __name__ == "__main__":
    run_interactive()

    # Want the group/member sweep instead? Swap the line above for this:
    #
    # for member in range(1, 7):
    #     data = get_group_member_data(2, member)
    #     result = identify_base_and_peak(data["C1"], data["R1"], data["C2"], data["R2"])
    #     print_report(f"Group 2, Member {member}", data, result)
    #     print()
