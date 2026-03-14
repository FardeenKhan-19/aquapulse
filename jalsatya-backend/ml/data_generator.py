import numpy as np
from typing import Tuple
from loguru import logger


def generate_outbreak_training_data(n_samples: int = 50000) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    np.random.seed(42)
    X = np.zeros((n_samples, 14))

    tds_base = np.random.uniform(100, 500, n_samples)
    seasons = np.random.randint(0, 4, n_samples)
    hours = np.random.randint(0, 24, n_samples)
    days = np.random.randint(0, 7, n_samples)

    monsoon_mask = seasons == 1
    summer_mask = seasons == 0
    winter_mask = seasons == 3

    tds = tds_base.copy()
    tds[monsoon_mask] *= np.random.uniform(1.2, 2.5, int(np.sum(monsoon_mask)))
    spike_mask = np.random.random(n_samples) < 0.15
    tds[spike_mask] *= np.random.uniform(2.0, 5.0, int(np.sum(spike_mask)))

    X[:, 0] = tds
    X[:, 1] = np.random.normal(0, 30, n_samples)
    X[:, 1][spike_mask] = np.random.uniform(50, 300, int(np.sum(spike_mask)))
    X[:, 2] = np.random.normal(0, 50, n_samples)
    X[:, 2][spike_mask] = np.random.uniform(100, 500, int(np.sum(spike_mask)))

    temp = np.random.normal(28, 4, n_samples)
    temp[summer_mask] += 5
    temp[winter_mask] -= 6
    temp[monsoon_mask] += 2
    X[:, 3] = temp
    X[:, 4] = np.random.normal(0, 2, n_samples)

    turb = np.random.exponential(5, n_samples)
    turb[monsoon_mask] *= np.random.uniform(2, 5, int(np.sum(monsoon_mask)))
    turb[spike_mask] *= np.random.uniform(2, 8, int(np.sum(spike_mask)))
    X[:, 5] = np.clip(turb, 0.1, 500)

    ph = np.random.normal(7.0, 0.5, n_samples)
    ph[spike_mask] -= np.random.uniform(0.5, 2.0, int(np.sum(spike_mask)))
    X[:, 6] = np.clip(ph, 2, 12)

    humidity = np.random.normal(65, 12, n_samples)
    humidity[monsoon_mask] += 20
    X[:, 7] = np.clip(humidity, 20, 100)

    flow = np.random.normal(4.0, 1.5, n_samples)
    peak_hours = np.isin(hours, [7, 8, 9, 17, 18, 19])
    flow[peak_hours] *= 1.4
    X[:, 8] = np.clip(flow, 0.1, 50)

    X[:, 9] = hours
    X[:, 10] = days
    X[:, 11] = seasons

    rainfall_proxy = np.random.exponential(3, n_samples)
    rainfall_proxy[monsoon_mask] *= 3
    X[:, 12] = np.clip(rainfall_proxy, 0, 50)

    X[:, 13] = np.random.poisson(1, n_samples)

    risk_score = np.zeros(n_samples)
    risk_score += np.clip((tds - 300) / 20, 0, 30)
    risk_score += np.clip(X[:, 1] / 10, 0, 15)
    risk_score += np.clip(X[:, 5] / 5, 0, 15)
    risk_score += np.clip((7.0 - X[:, 6]) * 5, 0, 10)
    risk_score += np.clip(X[:, 12] / 3, 0, 10)
    risk_score += X[:, 13] * 2
    risk_score[monsoon_mask] += 8
    risk_score[summer_mask] += 4

    night_industrial = np.isin(hours, [2, 3, 22, 23]) & spike_mask
    risk_score[night_industrial] += 15

    risk_score += np.random.normal(0, 5, n_samples)
    risk_score = np.clip(risk_score, 0, 100)

    y_risk = np.array(["baseline"] * n_samples, dtype=object)
    y_risk[risk_score >= 30] = "low"
    y_risk[risk_score >= 55] = "medium"
    y_risk[risk_score >= 75] = "high"
    y_risk[risk_score >= 88] = "critical"

    y_disease = np.array(["none"] * n_samples, dtype=object)

    cholera_mask = (tds > 600) & (X[:, 5] > 15) & (X[:, 6] < 6.5) & (risk_score >= 55)
    typhoid_mask = (tds > 500) & (temp > 30) & (X[:, 7] > 70) & (risk_score >= 50) & ~cholera_mask
    hepatitis_mask = (tds > 400) & (X[:, 5] > 20) & (X[:, 12] > 8) & (risk_score >= 45) & ~cholera_mask & ~typhoid_mask
    gastro_mask = (risk_score >= 40) & ~cholera_mask & ~typhoid_mask & ~hepatitis_mask

    y_disease[gastro_mask] = "gastroenteritis"
    y_disease[typhoid_mask] = "typhoid"
    y_disease[cholera_mask] = "cholera"
    y_disease[hepatitis_mask] = "hepatitis_a"

    logger.info(
        f"Generated {n_samples} outbreak training samples. "
        f"Risk distribution: baseline={np.sum(y_risk=='baseline')}, "
        f"low={np.sum(y_risk=='low')}, medium={np.sum(y_risk=='medium')}, "
        f"high={np.sum(y_risk=='high')}, critical={np.sum(y_risk=='critical')}"
    )
    logger.info(
        f"Disease distribution: none={np.sum(y_disease=='none')}, "
        f"gastro={np.sum(y_disease=='gastroenteritis')}, "
        f"typhoid={np.sum(y_disease=='typhoid')}, "
        f"cholera={np.sum(y_disease=='cholera')}, "
        f"hepatitis_a={np.sum(y_disease=='hepatitis_a')}"
    )

    return X, y_risk, y_disease


def generate_forensics_training_data(n_samples: int = 30000) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    np.random.seed(43)
    X = np.zeros((n_samples, 12))
    y = np.zeros(n_samples, dtype=int)

    samples_per_class = n_samples // 7
    remainder = n_samples - samples_per_class * 7

    idx = 0

    n = samples_per_class
    X[idx:idx+n, 0] = np.random.uniform(15, 80, n)
    X[idx:idx+n, 1] = np.random.uniform(200, 800, n)
    X[idx:idx+n, 2] = np.random.uniform(2.5, 6.0, n)
    X[idx:idx+n, 3] = np.random.choice([2, 3, 6, 7, 14, 15, 22, 23], n)
    X[idx:idx+n, 4] = np.random.uniform(10, 90, n)
    X[idx:idx+n, 5] = np.random.uniform(-2, 4, n)
    X[idx:idx+n, 6] = np.random.choice([0, 1], n, p=[0.6, 0.4])
    X[idx:idx+n, 7] = np.random.uniform(0.5, 3.0, n)
    X[idx:idx+n, 8] = np.random.choice([0, 1], n, p=[0.7, 0.3])
    X[idx:idx+n, 9] = np.random.uniform(40, 80, n)
    X[idx:idx+n, 10] = np.random.choice([0, 1], n, p=[0.7, 0.3])
    X[idx:idx+n, 11] = np.zeros(n)
    y[idx:idx+n] = 0
    idx += n

    n = samples_per_class
    X[idx:idx+n, 0] = np.random.uniform(5, 40, n)
    X[idx:idx+n, 1] = np.random.uniform(100, 500, n)
    X[idx:idx+n, 2] = np.random.uniform(1.5, 4.0, n)
    X[idx:idx+n, 3] = np.random.randint(0, 24, n)
    X[idx:idx+n, 4] = np.random.uniform(30, 180, n)
    X[idx:idx+n, 5] = np.random.uniform(-1, 3, n)
    X[idx:idx+n, 6] = np.ones(n)
    X[idx:idx+n, 7] = np.random.uniform(0.2, 1.5, n)
    X[idx:idx+n, 8] = np.random.choice([0, 1], n, p=[0.5, 0.5])
    X[idx:idx+n, 9] = np.random.uniform(70, 95, n)
    X[idx:idx+n, 10] = np.ones(n)
    X[idx:idx+n, 11] = np.random.choice([0, 1], n, p=[0.4, 0.6])
    y[idx:idx+n] = 1
    idx += n

    n = samples_per_class
    X[idx:idx+n, 0] = np.random.uniform(1, 10, n)
    X[idx:idx+n, 1] = np.random.uniform(50, 300, n)
    X[idx:idx+n, 2] = np.random.uniform(1.2, 3.0, n)
    X[idx:idx+n, 3] = np.random.randint(6, 18, n)
    X[idx:idx+n, 4] = np.random.uniform(120, 600, n)
    X[idx:idx+n, 5] = np.random.uniform(-1, 2, n)
    X[idx:idx+n, 6] = np.random.choice([0, 1], n, p=[0.5, 0.5])
    X[idx:idx+n, 7] = np.random.uniform(0.1, 1.0, n)
    X[idx:idx+n, 8] = np.random.choice([0, 1], n, p=[0.8, 0.2])
    X[idx:idx+n, 9] = np.random.uniform(50, 85, n)
    X[idx:idx+n, 10] = np.random.choice([0, 1], n, p=[0.6, 0.4])
    X[idx:idx+n, 11] = np.ones(n)
    y[idx:idx+n] = 2
    idx += n

    n = samples_per_class
    X[idx:idx+n, 0] = np.random.uniform(0.1, 3, n)
    X[idx:idx+n, 1] = np.random.uniform(30, 150, n)
    X[idx:idx+n, 2] = np.random.uniform(1.1, 2.0, n)
    X[idx:idx+n, 3] = np.random.randint(0, 24, n)
    X[idx:idx+n, 4] = np.random.uniform(300, 2000, n)
    X[idx:idx+n, 5] = np.random.uniform(-2, 1, n)
    X[idx:idx+n, 6] = np.zeros(n)
    X[idx:idx+n, 7] = np.random.uniform(0.5, 2.5, n)
    X[idx:idx+n, 8] = np.zeros(n)
    X[idx:idx+n, 9] = np.random.uniform(40, 70, n)
    X[idx:idx+n, 10] = np.random.choice([0, 1], n, p=[0.8, 0.2])
    X[idx:idx+n, 11] = np.full(n, 2)
    y[idx:idx+n] = 3
    idx += n

    n = samples_per_class
    X[idx:idx+n, 0] = np.random.uniform(0.5, 8, n)
    X[idx:idx+n, 1] = np.random.uniform(10, 80, n)
    X[idx:idx+n, 2] = np.random.uniform(1.0, 1.8, n)
    X[idx:idx+n, 3] = np.random.randint(8, 18, n)
    X[idx:idx+n, 4] = np.random.uniform(60, 360, n)
    X[idx:idx+n, 5] = np.random.uniform(2, 8, n)
    X[idx:idx+n, 6] = np.zeros(n)
    X[idx:idx+n, 7] = np.random.uniform(-0.5, 0.5, n)
    X[idx:idx+n, 8] = np.random.choice([0, 1], n, p=[0.6, 0.4])
    X[idx:idx+n, 9] = np.random.uniform(50, 80, n)
    X[idx:idx+n, 10] = np.random.choice([0, 1], n, p=[0.5, 0.5])
    X[idx:idx+n, 11] = np.random.choice([1, 2, 3], n)
    y[idx:idx+n] = 4
    idx += n

    n = samples_per_class
    X[idx:idx+n, 0] = np.random.uniform(0, 1, n)
    X[idx:idx+n, 1] = np.random.uniform(0, 50, n)
    X[idx:idx+n, 2] = np.random.uniform(1.0, 1.5, n)
    X[idx:idx+n, 3] = np.random.randint(0, 24, n)
    X[idx:idx+n, 4] = np.random.uniform(0, 30, n)
    X[idx:idx+n, 5] = np.random.uniform(-1, 1, n)
    X[idx:idx+n, 6] = np.zeros(n)
    X[idx:idx+n, 7] = np.random.uniform(-0.3, 0.3, n)
    X[idx:idx+n, 8] = np.zeros(n)
    X[idx:idx+n, 9] = np.random.uniform(40, 70, n)
    X[idx:idx+n, 10] = np.random.choice([0, 1], n, p=[0.7, 0.3])
    X[idx:idx+n, 11] = np.random.choice([2, 3], n)
    y[idx:idx+n] = 5
    idx += n

    n = samples_per_class + remainder
    X[idx:idx+n, 0] = np.random.uniform(0, 50, n)
    X[idx:idx+n, 1] = np.random.uniform(0, 400, n)
    X[idx:idx+n, 2] = np.random.uniform(1.0, 4.0, n)
    X[idx:idx+n, 3] = np.random.randint(0, 24, n)
    X[idx:idx+n, 4] = np.random.uniform(0, 500, n)
    X[idx:idx+n, 5] = np.random.uniform(-3, 5, n)
    X[idx:idx+n, 6] = np.random.choice([0, 1], n)
    X[idx:idx+n, 7] = np.random.uniform(-1, 2, n)
    X[idx:idx+n, 8] = np.random.choice([0, 1], n)
    X[idx:idx+n, 9] = np.random.uniform(30, 90, n)
    X[idx:idx+n, 10] = np.random.choice([0, 1], n)
    X[idx:idx+n, 11] = np.random.choice([0, 1, 2, 3], n)
    y[idx:idx+n] = 6

    noise = np.random.normal(0, 1, X.shape) * 0.05 * np.abs(X)
    X += noise

    X[:, 0] = np.clip(X[:, 0], 0, 200)
    X[:, 1] = np.clip(X[:, 1], 0, 2000)
    X[:, 2] = np.clip(X[:, 2], 0.5, 10)
    X[:, 3] = np.clip(X[:, 3], 0, 23)
    X[:, 4] = np.clip(X[:, 4], 0, 3000)
    X[:, 6] = np.round(np.clip(X[:, 6], 0, 1))
    X[:, 8] = np.round(np.clip(X[:, 8], 0, 1))
    X[:, 10] = np.round(np.clip(X[:, 10], 0, 1))
    X[:, 11] = np.round(np.clip(X[:, 11], 0, 3))

    shuffle_idx = np.random.permutation(n_samples)
    X = X[shuffle_idx]
    y = y[shuffle_idx]

    X_dist = X[:, 0:1].copy()
    X_dist = np.clip(X_dist, 0.1, None)
    y_dist = 15.0 / (X_dist[:, 0] + 0.5) + np.random.normal(0, 1, n_samples)
    y_dist = np.clip(y_dist, 0.1, 50)

    logger.info(
        f"Generated {n_samples} forensics training samples. "
        f"Class distribution: {dict(zip(range(7), [np.sum(y==i) for i in range(7)]))}"
    )

    return X, y, X_dist, y_dist
