# Model Evaluation Plan

## Goals
- Establish baselines for current vectors and SST anomaly forecasts.
- Monitor real-time skill vs climatology and persistence models.

## Datasets & Splits
- Train: 1982–2018; Val: 2019–2021; Test: 2022–2024 (rolling update).
- Regional slices for robustness.

## Metrics
- Currents: vector RMSE, angular error
- SST anomalies: RMSE, anomaly correlation coefficient (ACC)

## Procedures
- Backtesting pipeline; confidence bands; ablations.
- Report generation and model cards per release.
