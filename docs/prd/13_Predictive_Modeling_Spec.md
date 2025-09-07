# 13 — Predictive Modeling Spec (Phase 2)

## Objectives
- 7–14 day SST anomaly outlook with uncertainty; regional focus options.

## Data
- ERSST historical; NDBC station series; optional reanalysis features.

## Methods (progressive)
1. **Baselines**: climatology, persistence, simple AR.
2. **Classical**: ARIMA/ETS; Prophet-style trend/seasonality.
3. **ML**: gradient boosting for regional signals.
4. **DL (experimental)**: seq2seq or temporal CNN.

## Evaluation
- Metrics: RMSE/MAE, CRPS for probabilistic forecasts.
- Cross-validation by region and season.

## Model Card
- Purpose, data, limitations, failure modes, update cadence.

## MLOps
- Versioned datasets; reproducible notebooks; drift monitors; canary rollouts.
