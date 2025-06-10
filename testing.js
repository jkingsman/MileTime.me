// Running Pace Table Validator
function validatePaceTable() {
    // Tolerance settings - adjust these as needed
    const SPEED_TOLERANCE = 1.0;     // +/- units for speed values (kph, mph, m/s)
    const PACE_TOLERANCE = 1;        // +/- seconds for pace conversions (min/mi)
    const TIME_TOLERANCE = 1;       // +/- seconds for race time calculations
    // Helper function to parse time in HH:MM:SS or MM:SS format to total seconds
    function parseTime(timeStr) {
        const parts = timeStr.split(':');
        if (parts.length === 3) {
            // HH:MM:SS format
            return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
        } else if (parts.length === 2) {
            // MM:SS format
            return parseInt(parts[0]) * 60 + parseInt(parts[1]);
        } else {
            throw new Error(`Invalid time format: ${timeStr}`);
        }
    }

    // Helper function to parse pace in M:SS format to total seconds
    function parsePace(paceStr) {
        const parts = paceStr.split(':');
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }

    // Helper function to format seconds back to HH:MM:SS or MM:SS
    function formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        }
    }

    // Helper function to convert min/km pace to km/h speed
    function paceToSpeed(paceSeconds) {
        return 3600 / paceSeconds; // 3600 seconds per hour / seconds per km
    }

    // Helper function to convert min/km pace to min/mi
    function paceToMilePace(paceSeconds) {
        return paceSeconds * 1.609344; // 1 mile = 1.609344 km
    }

    // Helper function to convert km/h to mph
    function kmhToMph(kmh) {
        return kmh / 1.609344;
    }

    // Helper function to convert km/h to m/s
    function kmhToMs(kmh) {
        return kmh / 3.6;
    }

    // Get the table (assuming it's the only one on the page)
    const table = document.querySelector('table');
    if (!table) {
        console.error('No table found on the page');
        return;
    }

    const rows = table.querySelectorAll('tbody tr');
    let totalErrors = 0;

    console.log('🏃‍♂️ Running Pace Table Validation');
    console.log('=====================================');

    rows.forEach((row, index) => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 8) return; // Skip incomplete rows

        const rowNum = index + 1;
        let rowErrors = 0;

        // Extract values
        const paceMinKm = cells[0].textContent.trim();
        const speedKph = parseFloat(cells[1].textContent.trim());
        const paceMinMi = cells[2].textContent.trim();
        const speedMph = parseFloat(cells[3].textContent.trim());
        const speedMs = parseFloat(cells[4].textContent.trim());
        const time5k = cells[5].textContent.trim();
        const time10k = cells[6].textContent.trim();
        const timeHalf = cells[7].textContent.trim();
        const time30k = cells[8] ? cells[8].textContent.trim() : null;
        const timeMarathon = cells[9] ? cells[9].textContent.trim() : null;

        console.log(`\n📊 Row ${rowNum}: Pace ${paceMinKm} min/km`);

        // Parse base pace
        const basePaceSeconds = parsePace(paceMinKm);

        // Validate Speed (kph)
        const expectedSpeedKph = paceToSpeed(basePaceSeconds);
        if (Math.abs(speedKph - expectedSpeedKph) > SPEED_TOLERANCE) {
            console.error(`  ❌ Speed (kph): Expected ${expectedSpeedKph.toFixed(2)}, got ${speedKph}`);
            rowErrors++;
        }

        // Validate Pace (min/mi)
        const expectedPaceMinMiSeconds = paceToMilePace(basePaceSeconds);
        const actualPaceMinMiSeconds = parsePace(paceMinMi);
        if (Math.abs(actualPaceMinMiSeconds - expectedPaceMinMiSeconds) > PACE_TOLERANCE) {
            const expectedPaceMinMi = formatTime(Math.round(expectedPaceMinMiSeconds));
            console.error(`  ❌ Pace (min/mi): Expected ${expectedPaceMinMi}, got ${paceMinMi}`);
            rowErrors++;
        }

        // Validate Speed (mph)
        const expectedSpeedMph = kmhToMph(expectedSpeedKph);
        if (Math.abs(speedMph - expectedSpeedMph) > SPEED_TOLERANCE) {
            console.error(`  ❌ Speed (mph): Expected ${expectedSpeedMph.toFixed(2)}, got ${speedMph}`);
            rowErrors++;
        }

        // Validate Speed (m/s)
        const expectedSpeedMs = kmhToMs(expectedSpeedKph);
        if (Math.abs(speedMs - expectedSpeedMs) > SPEED_TOLERANCE) {
            console.error(`  ❌ Speed (m/s): Expected ${expectedSpeedMs.toFixed(2)}, got ${speedMs}`);
            rowErrors++;
        }

        // Validate race times
        const distances = [
            { name: '5km', distance: 5, expected: basePaceSeconds * 5, actual: time5k },
            { name: '10km', distance: 10, expected: basePaceSeconds * 10, actual: time10k },
            { name: 'Half Marathon', distance: 21.0975, expected: basePaceSeconds * 21.0975, actual: timeHalf }
        ];

        if (time30k) {
            distances.push({ name: '30km', distance: 30, expected: basePaceSeconds * 30, actual: time30k });
        }

        if (timeMarathon) {
            distances.push({ name: 'Marathon', distance: 42.195, expected: basePaceSeconds * 42.195, actual: timeMarathon });
        }

        distances.forEach(({ name, expected, actual }) => {
            const actualSeconds = parseTime(actual);
            const expectedSeconds = Math.round(expected);

            if (Math.abs(actualSeconds - expectedSeconds) > TIME_TOLERANCE) {
                const expectedTime = formatTime(expectedSeconds);
                console.error(`  ❌ ${name}: Expected ${expectedTime}, got ${actual}`);
                rowErrors++;
            }
        });

        if (rowErrors === 0) {
            console.log(`  ✅ All values correct`);
        } else {
            totalErrors += rowErrors;
        }
    });

    console.log('\n=====================================');
    if (totalErrors === 0) {
        console.log('🎉 All rows validated successfully!');
    } else {
        console.log(`❌ Found ${totalErrors} error(s) across ${rows.length} rows`);
    }
}

// Run the validation
validatePaceTable();
