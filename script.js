const HOURS_PER_YEAR = 8760;

const form = document.getElementById("dispatchForm");
const results = document.getElementById("resultsPanel");
const grid = document.getElementById("readoutGrid");
const error = document.getElementById("formError");

const pmaxEl = document.getElementById("pmax");
const lfEl = document.getElementById("loadFactor");
const c1El = document.getElementById("c1");
const r1El = document.getElementById("r1");
const c2El = document.getElementById("c2");
const r2El = document.getElementById("r2");


function identifyBaseAndPeak(c1, r1Paise, c2, r2Paise) {

    const plant1 = {
        name: "Plant 1",
        C: c1,
        R: r1Paise
    };

    const plant2 = {
        name: "Plant 2",
        C: c2,
        R: r2Paise
    };

    let base;
    let peak;


    /*
     * BASE PLANT:
     * Higher fixed cost + lower running cost
     *
     * PEAK PLANT:
     * Lower fixed cost + higher running cost
     */

    if (c1 > c2 && r1Paise < r2Paise) {

        base = plant1;
        peak = plant2;

    } else if (c2 > c1 && r2Paise < r1Paise) {

        base = plant2;
        peak = plant1;

    } else {

        /*
         * If one plant is cheaper in BOTH fixed and
         * running cost, there is no economic reason
         * to use a separate peak plant.
         */

        const plant1Dominates =
            c1 <= c2 &&
            r1Paise <= r2Paise &&
            (c1 < c2 || r1Paise < r2Paise);

        const plant2Dominates =
            c2 <= c1 &&
            r2Paise <= r1Paise &&
            (c2 < c1 || r2Paise < r1Paise);


        if (plant1Dominates) {

            return {
                noPeak: true,
                basePlant: "Plant 1",
                baseHours: HOURS_PER_YEAR,
                peakPlant: null,
                peakHours: 0
            };

        }


        if (plant2Dominates) {

            return {
                noPeak: true,
                basePlant: "Plant 2",
                baseHours: HOURS_PER_YEAR,
                peakPlant: null,
                peakHours: 0
            };

        }


        return {
            error:
                "There is no valid base/peak combination for the entered plant costs. " +
                "One plant must have higher fixed cost and lower running cost."
        };
    }


    /*
     * Convert running cost:
     *
     * paise/kWh → Rs/kWh
     */

    const baseRunning = base.R / 100;
    const peakRunning = peak.R / 100;


    /*
     * Optimum peak-plant operating hours:
     *
     * t = (Cbase - Cpeak) /
     *     (Rpeak - Rbase)
     */

    let peakHours =
        (base.C - peak.C) /
        (peakRunning - baseRunning);


    /*
     * If the result is zero or negative,
     * there is no economic requirement
     * for a separate peak plant.
     */

    if (peakHours <= 0 || !Number.isFinite(peakHours)) {

        return {
            noPeak: true,
            basePlant: base.name,
            baseHours: HOURS_PER_YEAR,
            peakPlant: null,
            peakHours: 0
        };

    }


    /*
     * Peak plant cannot operate for more
     * than the total number of hours in a year.
     */

    peakHours = Math.min(
        peakHours,
        HOURS_PER_YEAR
    );


    return {
        noPeak: false,
        basePlant: base.name,
        baseHours: HOURS_PER_YEAR,
        peakPlant: peak.name,
        peakHours: peakHours
    };
}



function formatHours(hours) {

    return Number(hours).toLocaleString(
        undefined,
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 1
        }
    );

}



function render(result) {

    results.classList.add("is-visible");

    grid.innerHTML = "";


    /*
     * ERROR CASE
     */

    if (result.error) {

        grid.innerHTML = `
            <div class="readout readout--wide readout--error">

                <small>RESULT</small>

                <strong>
                    ${result.error}
                </strong>

            </div>
        `;

        return;
    }



    /*
     * NO PEAK PLANT CASE
     */

    if (result.noPeak) {

        grid.innerHTML = `

            <div class="readout readout--wide no-peak">

                <small>RESULT</small>

                <strong>
                    THERE IS NO PEAK PLANT
                </strong>

                <p>
                    <strong>${result.basePlant}</strong>
                    is operated as the
                    <strong>base-load plant</strong>
                    for
                    <strong>
                        ${formatHours(result.baseHours)}
                        hours/year
                    </strong>.
                </p>

                <p>
                    No separate peak-load plant is required.
                </p>

            </div>

        `;

        return;
    }



    /*
     * NORMAL BASE + PEAK CASE
     */

    grid.innerHTML = `

        <div class="readout">

            <small>
                BASE-LOAD PLANT
            </small>

            <strong class="cyan">
                ${result.basePlant}
            </strong>

            <p>
                Operating time:
                <strong>
                    ${formatHours(result.baseHours)}
                    hours/year
                </strong>
            </p>

        </div>


        <div class="readout">

            <small>
                PEAK-LOAD PLANT
            </small>

            <strong class="amber">
                ${result.peakPlant}
            </strong>

            <p>
                Operating time:
                <strong>
                    ${formatHours(result.peakHours)}
                    hours/year
                </strong>
            </p>

        </div>

    `;
}



form.addEventListener(
    "submit",
    function(event) {

        event.preventDefault();


        const pmax =
            parseFloat(pmaxEl.value);

        const loadFactor =
            parseFloat(lfEl.value);

        const c1 =
            parseFloat(c1El.value);

        const r1 =
            parseFloat(r1El.value);

        const c2 =
            parseFloat(c2El.value);

        const r2 =
            parseFloat(r2El.value);


        /*
         * Check that every input is filled.
         */

        if (
            Number.isNaN(pmax) ||
            Number.isNaN(loadFactor) ||
            Number.isNaN(c1) ||
            Number.isNaN(r1) ||
            Number.isNaN(c2) ||
            Number.isNaN(r2)
        ) {

            error.textContent =
                "Please enter a value in every field.";

            return;
        }


        /*
         * Maximum demand validation.
         */

        if (pmax <= 0) {

            error.textContent =
                "Maximum demand must be greater than zero.";

            return;
        }


        /*
         * Load factor validation.
         */

        if (
            loadFactor <= 0 ||
            loadFactor > 100
        ) {

            error.textContent =
                "Load factor must be between 0 and 100%.";

            return;
        }


        error.textContent = "";


        /*
         * IMPORTANT:
         *
         * Maximum demand and load factor are
         * accepted as project inputs, but they
         * are NOT used for additional calculations.
         *
         * The requested output only identifies:
         *
         * 1. Base plant
         * 2. Peak plant
         * 3. Operating hours of each
         */

        const result =
            identifyBaseAndPeak(
                c1,
                r1,
                c2,
                r2
            );


        render(result);


        /*
         * Scroll to result.
         */

        results.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }
);
