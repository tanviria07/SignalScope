"""Generate realistic sample CSVs under /data for demos and tests."""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"


def main() -> None:
    rng = np.random.default_rng(42)
    DATA.mkdir(parents=True, exist_ok=True)

    # Stable baseline with rare spikes
    n = 400
    t0 = pd.Timestamp("2024-06-01T00:00:00Z")
    idx = t0 + pd.to_timedelta(np.arange(n), unit="min")
    base = 50.0 + rng.normal(0, 0.4, size=n)
    spikes = np.zeros(n)
    for i in [120, 121, 280]:
        spikes[i] = rng.uniform(6, 9)
    y = base + spikes
    df1 = pd.DataFrame({"timestamp": idx, "value": y, "series_id": "sensor-a", "label": "lab"})
    df1.to_csv(DATA / "sample_stable.csv", index=False)

    # Drift + changing variance + mild asymmetry in later windows
    n2 = 500
    idx2 = t0 + pd.to_timedelta(np.arange(n2), unit="min")
    tnorm = np.linspace(0, 1, n2)
    drift = 0.35 * tnorm * n2  # cumulative drift in value units
    noise_scale = 0.5 + 1.4 * tnorm**2
    noise = rng.normal(0, noise_scale, size=n2)
    skew = np.where(tnorm > 0.55, (tnorm - 0.55) * 3.0, 0.0)
    y2 = 100 + drift + noise + skew
    df2 = pd.DataFrame({"timestamp": idx2, "value": y2})
    df2.to_csv(DATA / "sample_drift_asymmetry.csv", index=False)

    print(f"Wrote {DATA / 'sample_stable.csv'} and {DATA / 'sample_drift_asymmetry.csv'}")


if __name__ == "__main__":
    main()
