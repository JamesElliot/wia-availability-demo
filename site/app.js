// Simple loader for WIA data-completeness JSON files in /site/data/
// Usage: type an ISO3 (e.g., "MLI") and click "Load".

async function loadCountry(iso3) {
    const contentEl = document.getElementById("content");
    const code = (iso3 || "MLI").trim().toUpperCase();

    contentEl.innerHTML = `<p>Loading ${code}…</p>`;

    try {
        // Fetch the prebuilt JSON for this country from /site/data/
        const res = await fetch(`./data/${iso3.toUpperCase()}.json`);
        if (!res.ok) {
            throw new Error(`No JSON found for ${code}`);
        }

        const data = await res.json();

        // Render the dimension chips (e.g., services, hazard_impact…)
        const dimensionChips = Object.entries(data.wia_dimensions || {})
            .map(([name, obj]) => {
                const score = (obj?.completeness ?? 0).toFixed(2);
                return `<div class="chip"><b>${name}</b>: ${score}</div>`;
            })
            .join("");

        // Render the dataset rows
        const datasetRows = (data.datasets || [])
            .map((d) => {
                const dims = Array.isArray(d.dimension) ? d.dimension.join(", ") : "";
                const admin = `ADM${d.max_admin_level ?? "?"}`;
                const freshness = d.freshness_bucket || "n/a";
                const continuity = Number(d.continuity_ratio_12m ?? 1).toFixed(2);
                const score = Number(d.completeness_score ?? 0).toFixed(3);

                return `
          <tr>
            <td>${d.key}</td>
            <td>${dims}</td>
            <td>${admin}</td>
            <td>${freshness}</td>
            <td>${continuity}</td>
            <td>${score}</td>
          </tr>
        `;
            })
            .join("");

        // Write the UI
        contentEl.innerHTML = `
      <section class="cards">${dimensionChips}</section>

      <table>
        <thead>
          <tr>
            <th>Dataset</th>
            <th>Dimension</th>
            <th>Admin</th>
            <th>Freshness</th>
            <th>Continuity</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>${datasetRows}</tbody>
      </table>

      <details>
        <summary>Raw JSON</summary>
        <pre>${escapeHtml(JSON.stringify(data, null, 2))}</pre>
      </details>
    `;
    } catch (err) {
        contentEl.innerHTML = `<p class="error">${err.message}</p>`;
    }
}

// Basic HTML escape for the <pre> block
function escapeHtml(str) {
    return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}

// Wire up events
document.getElementById("load").onclick = () => {
    const input = document.getElementById("iso3");
    loadCountry(input.value || "MLI");
};

// Load a default country on first open
window.onload = () => loadCountry("MLI");