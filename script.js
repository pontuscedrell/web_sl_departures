const siteIds = {
    "Grindsgatan": 1353,
    "Skanstull": 9190,
    "Södra Station": 9530,
    "Rosenlund": 1351,
};

let currentStop = "Grindsgatan";
let currentSiteId = siteIds[currentStop];

function getCurrentSiteId() {
    return siteIds[currentStop];
}

async function fetchDepartures() {
    const siteId = getCurrentSiteId();
    const API_URL = `https://transport.integration.sl.se/v1/sites/${siteId}/departures`;

    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        const departures = data.departures || [];
        const stopName = departures[0]?.stop_area?.name || "Okänd hållplats";
        document.getElementById("stop-name").textContent = `${stopName}`;
        const filteredDepartures = filterDepartures(departures);
        updateTable(filteredDepartures);
    } catch (err) {
        document.getElementById("stop-name").textContent = "💥 Kunde inte hämta hållplats";
        document.querySelector('#departure-table tbody').innerHTML =
            `<tr><td colspan="3">💥 Kunde inte hämta avgångar</td></tr>`;
        document.getElementById("deviation-info").innerHTML = '';
    }
}

function getLineColors(designation) {
    let backgroundColor = '#555';
    let textColor = 'white';

    if (['17', '18', '19'].includes(designation)) {
        backgroundColor = '#169d4c';
    } else if (['1', '2', '3', '4'].includes(designation)) {
        backgroundColor = '#008aca';
    } else if (['57', '74', '154', '164'].includes(designation)) {
        backgroundColor = '#d61d23';
    } else if (['40', '41', '42', '43', '44'].includes(designation)) {
        backgroundColor = '#d05d9a';
    }

    return { backgroundColor, textColor };
}

function filterDepartures(departures) {
    if (currentStop === "Skanstull") {
        return departures.filter(dep => dep.line.transport_mode === "METRO");
    } else if (currentStop === "Grindsgatan") {
        return departures.filter(dep => dep.line.transport_mode === "BUS");
    } else if (currentStop === "Södra Station") {
        return departures.filter(dep => dep.line.transport_mode === "TRAIN");
    } else if (currentStop === "Rosenlund") {
        return departures.filter(dep =>
            dep.line.transport_mode === "BUS" &&
            (
                (dep.line.designation === "4" && dep.direction_code === 2) ||
                (dep.line.designation === "74") ||
                (dep.line.designation === "3" && dep.direction_code === 2)
            ) && dep.line.designation !== "164"
        );
    }
    return departures;
}

function updateTable(departures) {
    const tbody = document.querySelector('#departure-table tbody');
    tbody.innerHTML = '';

    if (departures.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4">Inga avgångar hittades</td></tr>';
        document.getElementById("banner").style.display = "none";
        return;
    }

    // Count deviation message occurrences
    const deviationCounts = {};
    const total = departures.length;

    departures.forEach(dep => {
        if (dep.deviations) {
            dep.deviations.forEach(dev => {
                deviationCounts[dev.message] = (deviationCounts[dev.message] || 0) + 1;
            });
        }
    });

    // Find deviation messages present in >= 30% of departures
    const bannerDeviations = Object.entries(deviationCounts)
        .filter(([_, count]) => count / total >= 0.3)
        .map(([msg]) => msg);

    const dismissed = JSON.parse(localStorage.getItem("dismissedDeviations") || "[]");
    const filteredBannerDeviations = bannerDeviations.filter(msg => !dismissed.includes(msg));

    // Update the banner
    const banner = document.getElementById("banner");
    if (filteredBannerDeviations.length > 0) {
        banner.style.display = "block";
        banner.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 1rem;">
                <div class="warning-icon">⚠️</div>
                <div class="warning-text">
                    ${filteredBannerDeviations.map((msg, index) => `
                        <div style="position: relative; margin-bottom: 0.5rem; padding-right: 1.5rem;">
                            ${msg}
                            <button class="dismiss-btn" data-msg="${msg.replace(/"/g, '&quot;')}">❌</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        attachDismissListeners();
    } else {
        banner.style.display = "none";
    }

    const bannerSet = new Set(bannerDeviations);

    departures.forEach(dep => {
        const row = document.createElement('tr');
        const { backgroundColor: lineBackgroundColor, textColor: lineColor } = getLineColors(dep.line.designation);

        const lineCell = `<td style="text-align: center;">
            <span style="background-color: ${lineBackgroundColor}; color: ${lineColor}; padding: 0.5rem 1rem; border-radius: 12px; display: inline-block;">
                ${dep.line.designation}
            </span>
        </td>`;

        const scheduled = new Date(dep.scheduled);
        const expected = new Date(dep.expected);
        const diffMin = Math.round((expected - scheduled) / 60000);

        const delayText = Math.abs(diffMin) >= 1
            ? `<span style="font-size: 0.9rem; color: #ffa500; margin-right: 0.3rem; vertical-align: middle;">${diffMin > 0 ? '+' : ''}${diffMin}</span>`
            : '';

        let timeDisplay = dep.display.replace(/\s?min/, 'm');
        if (timeDisplay && timeDisplay.endsWith(" min")) {
            timeDisplay = timeDisplay.slice(0, -4) + "m";
        }

        let cancellationText = '';
        if (dep.state === 'CANCELLED') {
            timeDisplay = `<span style="text-decoration: line-through; color: red;">${dep.display}</span>`;
            cancellationText = `<span style="color: red; font-size: 1rem; margin-right: 10px;">Inställd</span>`;
        } else {
            timeDisplay = `${delayText}${dep.display}`;
        }

        let destinationText = dep.destination;
        if (dep.deviations && dep.deviations.some(dev => !bannerSet.has(dev.message))) {
            destinationText = `<span style="color: yellow; font-size: 1.5rem; margin-right: 0.5rem;">⚠️</span>` + destinationText;
        }

        row.innerHTML = `
            ${lineCell}
            <td>
                ${destinationText}
                ${dep.via ? `<span style="font-size: 1rem; color: #D3D3D3;"> via ${dep.via}</span>` : ''}
            </td>
            <td class="time ${dep.state !== 'EXPECTED' && dep.state !== 'ATSTOP' ? 'delayed' : ''}">
                ${cancellationText}${timeDisplay}
            </td>
        `;

        row.addEventListener('click', () => toggleExpand(row, dep));
        tbody.appendChild(row);
    });
}

function attachDismissListeners() {
    document.querySelectorAll('.dismiss-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            dismissDeviation(e.target.dataset.msg);
        });
    });
}

function dismissDeviation(msg) {
    const dismissed = JSON.parse(localStorage.getItem("dismissedDeviations") || "[]");
    if (!dismissed.includes(msg)) {
        dismissed.push(msg);
        localStorage.setItem("dismissedDeviations", JSON.stringify(dismissed));
    }
    fetchDepartures();
}

function trimTime(dateString) {
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

function toggleExpand(row, dep) {
    const existingExpanded = row.nextElementSibling;

    let deviationMessage = '';
    if (dep.deviations && dep.deviations.length > 0) {
        deviationMessage = dep.deviations.map(dev => `${dev.message}`).join('\n');
    }

    if (existingExpanded && existingExpanded.classList.contains('expanded')) {
        existingExpanded.remove();
    } else {
        const expandedRow = document.createElement('tr');
        expandedRow.classList.add('expanded');
        const scheduledTime = trimTime(dep.scheduled);
        const plannedTime = trimTime(dep.expected);
        expandedRow.innerHTML = `
            <td colspan="3">
                ${deviationMessage}
                <strong>Schemalagd tid:</strong> ${scheduledTime}<br>
                <strong>Planerad tid:</strong> ${plannedTime}<br>
                <strong>Resestatus:</strong> ${dep.journey.state}<br>
                <strong>Förväntning:</strong> ${dep.journey.prediction_state || 'Ej avgått'}<br>
                <strong>Avgångsstatus:</strong> ${dep.state}
            </td>
        `;
        row.parentNode.insertBefore(expandedRow, row.nextSibling);
        resetRefreshTimer();
    }
}

function cycleStop() {
    const stops = [
        { name: "Grindsgatan", siteId: 1353 },
        { name: "Skanstull", siteId: 9190 },
        { name: "Rosenlund", siteId: 1351 },
        { name: "Södra Station", siteId: 9530 }
    ];

    let currentStopIndex = stops.findIndex(stop => stop.name === currentStop);
    currentStopIndex = (currentStopIndex + 1) % stops.length;

    currentStop = stops[currentStopIndex].name;
    currentSiteId = stops[currentStopIndex].siteId;

    fetchDepartures();
}

document.getElementById("stop-name").addEventListener("click", cycleStop);

fetchDepartures();
let refreshInterval = setInterval(fetchDepartures, 30000);

function resetRefreshTimer() {
    clearInterval(refreshInterval);
    refreshInterval = setInterval(fetchDepartures, 30000);
}
