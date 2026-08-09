"""
Two-Plant Economic Dispatch -- Base/Peak Identification

Inputs:
    Maximum demand (MW)
    Load factor (%)
    Plant 1: fixed cost C1 (Rs/kW/year), running cost R1 (paise/kWh)
    Plant 2: fixed cost C2 (Rs/kW/year), running cost R2 (paise/kWh)

Output:
    ONLY the base/peak plant identification and operating hours.

Maximum demand and load factor are required project inputs but are not
used for any additional calculation/output.
"""

HOURS_PER_YEAR = 8760


def identify_base_and_peak(c1, r1_paise, c2, r2_paise):
    """Return only the required base/peak operating schedule."""
    plant1 = {"name": "Plant 1", "C": c1, "R": r1_paise}
    plant2 = {"name": "Plant 2", "C": c2, "R": r2_paise}

    if c1 > c2 and r1_paise < r2_paise:
        base, peak = plant1, plant2
    elif c2 > c1 and r2_paise < r1_paise:
        base, peak = plant2, plant1
    else:
        p1_dominates = c1 <= c2 and r1_paise <= r2_paise and (c1 < c2 or r1_paise < r2_paise)
        p2_dominates = c2 <= c1 and r2_paise <= r1_paise and (c2 < c1 or r2_paise < r1_paise)

        if p1_dominates:
            return {"no_peak": True, "base_plant": "Plant 1", "base_hours": HOURS_PER_YEAR,
                    "peak_plant": None, "peak_hours": 0}
        if p2_dominates:
            return {"no_peak": True, "base_plant": "Plant 2", "base_hours": HOURS_PER_YEAR,
                    "peak_plant": None, "peak_hours": 0}

        return {"error": "There is no valid base/peak combination for the entered plant costs. "
                         "One plant must have higher fixed cost and lower running cost."}

    base_running = base["R"] / 100.0
    peak_running = peak["R"] / 100.0
    peak_hours = (base["C"] - peak["C"]) / (peak_running - base_running)

    if peak_hours <= 0:
        return {"no_peak": True, "base_plant": base["name"], "base_hours": HOURS_PER_YEAR,
                "peak_plant": None, "peak_hours": 0}

    peak_hours = min(peak_hours, HOURS_PER_YEAR)

    return {"no_peak": False, "base_plant": base["name"], "base_hours": HOURS_PER_YEAR,
            "peak_plant": peak["name"], "peak_hours": round(peak_hours, 1)}


def ask_float(prompt):
    while True:
        try:
            return float(input(prompt))
        except ValueError:
            print("Please enter a number.")


def run_interactive():
    print("=" * 60)
    print("TWO-PLANT ECONOMIC DISPATCH")
    print("=" * 60)

    pmax = ask_float("Maximum demand (MW): ")
    load_factor = ask_float("Load factor (%): ")

    print("\nPlant 1:")
    c1 = ask_float("  Fixed cost (Rs/kW/year): ")
    r1 = ask_float("  Running cost (paise/kWh): ")

    print("\nPlant 2:")
    c2 = ask_float("  Fixed cost (Rs/kW/year): ")
    r2 = ask_float("  Running cost (paise/kWh): ")

    if pmax <= 0:
        print("\nMaximum demand must be greater than zero.")
        return
    if load_factor <= 0 or load_factor > 100:
        print("\nLoad factor must be between 0 and 100%.")
        return

    # pmax and load_factor are intentionally not used for extra calculations.
    result = identify_base_and_peak(c1, r1, c2, r2)

    print("\n" + "=" * 60)
    print("RESULT")
    print("=" * 60)

    if "error" in result:
        print(result["error"])
        return

    if result["no_peak"]:
        print("THERE IS NO PEAK PLANT.")
        print(f"{result['base_plant']} is operated as the base-load plant "
              f"for {result['base_hours']} hours/year.")
        print("No separate peak-load plant is required.")
        return

    print(f"BASE-LOAD PLANT : {result['base_plant']}")
    print(f"OPERATING HOURS : {result['base_hours']} hours/year")
    print()
    print(f"PEAK-LOAD PLANT : {result['peak_plant']}")
    print(f"OPERATING HOURS : {result['peak_hours']} hours/year")


if __name__ == "__main__":
    run_interactive()

