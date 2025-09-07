# SPDX-License-Identifier: MIT
# © 2024–2025 Mark Lindon — BlueSphere
"""
BlueSphere AI Ocean Prediction Engine
Advanced machine learning system for ocean temperature forecasting,
anomaly detection, and climate event prediction.
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
from sklearn.ensemble import RandomForestRegressor, IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error
import joblib
import warnings
warnings.filterwarnings('ignore')

class OceanPredictionEngine:
    """
    Advanced AI system for ocean temperature predictions and climate insights.
    """
    
    def __init__(self):
        self.temperature_model = RandomForestRegressor(
            n_estimators=100,
            max_depth=15,
            random_state=42
        )
        self.anomaly_detector = IsolationForest(
            contamination=0.1,
            random_state=42
        )
        self.scaler = StandardScaler()
        self.is_trained = False
        
    def create_features(self, df: pd.DataFrame) -> np.ndarray:
        """Create advanced feature engineering for ML models."""
        features = []
        
        # Time-based features
        df['datetime'] = pd.to_datetime(df.get('date', df.get('time', datetime.now())))
        features.append(df['datetime'].dt.month)  # Seasonal patterns
        features.append(df['datetime'].dt.day)
        features.append(np.sin(2 * np.pi * df['datetime'].dt.dayofyear / 365))  # Seasonal cyclical
        features.append(np.cos(2 * np.pi * df['datetime'].dt.dayofyear / 365))
        
        # Geographic features
        features.append(df.get('lat', 0))
        features.append(df.get('lon', 0))
        features.append(np.sin(np.radians(df.get('lat', 0))))  # Latitude effects
        features.append(np.cos(np.radians(df.get('lat', 0))))
        
        # Historical temperature patterns
        if 'sst_c' in df.columns:
            features.append(df['sst_c'].rolling(7).mean().fillna(df['sst_c']))  # 7-day average
            features.append(df['sst_c'].rolling(30).mean().fillna(df['sst_c']))  # Monthly average
            features.append(df['sst_c'].rolling(7).std().fillna(0))  # Temperature variability
        
        # Climate indices (simulated)
        features.append(np.sin(2 * np.pi * df['datetime'].dt.month / 12))  # ENSO proxy
        features.append(np.cos(2 * np.pi * df['datetime'].dt.month / 12))
        
        return np.column_stack(features)
    
    def train_models(self, historical_data: pd.DataFrame) -> Dict[str, float]:
        """Train the prediction models on historical data."""
        print("🧠 Training AI Ocean Prediction Models...")
        
        # Prepare training data
        features = self.create_features(historical_data)
        target = historical_data.get('sst_c', np.random.normal(15, 3, len(historical_data)))
        
        # Remove any invalid data
        mask = ~np.isnan(features).any(axis=1) & ~np.isnan(target)
        features = features[mask]
        target = target[mask]
        
        # Scale features
        features_scaled = self.scaler.fit_transform(features)
        
        # Train temperature prediction model
        self.temperature_model.fit(features_scaled, target)
        
        # Train anomaly detection model
        self.anomaly_detector.fit(features_scaled)
        
        # Calculate training metrics
        predictions = self.temperature_model.predict(features_scaled)
        rmse = np.sqrt(mean_squared_error(target, predictions))
        mae = mean_absolute_error(target, predictions)
        
        self.is_trained = True
        print(f"✅ Models trained successfully! RMSE: {rmse:.3f}°C, MAE: {mae:.3f}°C")
        
        return {
            'rmse': rmse,
            'mae': mae,
            'training_samples': len(target),
            'feature_importance': self.temperature_model.feature_importances_.tolist()
        }
    
    def predict_temperature(self, input_data: pd.DataFrame, days_ahead: int = 7) -> Dict:
        """Generate temperature predictions for specified time horizon."""
        if not self.is_trained:
            raise ValueError("Model must be trained before making predictions")
        
        predictions = []
        uncertainties = []
        
        for day in range(days_ahead):
            # Create features for prediction
            pred_date = datetime.now() + timedelta(days=day+1)
            pred_data = input_data.copy()
            pred_data['date'] = pred_date
            
            features = self.create_features(pred_data)
            features_scaled = self.scaler.transform(features)
            
            # Generate prediction with uncertainty
            pred = self.temperature_model.predict(features_scaled)[0]
            
            # Estimate uncertainty using model variance
            tree_predictions = [tree.predict(features_scaled)[0] for tree in self.temperature_model.estimators_]
            uncertainty = np.std(tree_predictions)
            
            predictions.append(pred)
            uncertainties.append(uncertainty)
        
        return {
            'predictions': predictions,
            'uncertainties': uncertainties,
            'confidence_intervals': [
                (pred - 1.96*unc, pred + 1.96*unc) 
                for pred, unc in zip(predictions, uncertainties)
            ],
            'forecast_horizon_days': days_ahead
        }
    
    def detect_anomalies(self, current_data: pd.DataFrame) -> Dict:
        """Detect temperature anomalies and unusual patterns."""
        if not self.is_trained:
            raise ValueError("Model must be trained before detecting anomalies")
        
        features = self.create_features(current_data)
        features_scaled = self.scaler.transform(features)
        
        # Detect anomalies
        anomaly_scores = self.anomaly_detector.decision_function(features_scaled)
        anomalies = self.anomaly_detector.predict(features_scaled)
        
        # Identify marine heatwaves (simplified)
        temperatures = current_data.get('sst_c', [])
        if len(temperatures) > 0:
            temp_mean = np.mean(temperatures)
            temp_std = np.std(temperatures)
            heatwave_threshold = temp_mean + 2 * temp_std
            marine_heatwaves = temperatures > heatwave_threshold
        else:
            marine_heatwaves = []
        
        return {
            'anomaly_scores': anomaly_scores.tolist(),
            'anomalies_detected': (anomalies == -1).sum(),
            'anomaly_locations': np.where(anomalies == -1)[0].tolist(),
            'marine_heatwaves': marine_heatwaves.tolist() if len(marine_heatwaves) > 0 else [],
            'severity_index': np.mean(np.abs(anomaly_scores))
        }
    
    def generate_climate_insights(self, data: pd.DataFrame) -> Dict:
        """Generate AI-powered climate insights and narratives."""
        insights = {
            'summary': "",
            'key_findings': [],
            'recommendations': [],
            'risk_assessment': "Low",
            'trend_analysis': {}
        }
        
        if 'sst_c' in data.columns and len(data) > 0:
            temperatures = data['sst_c'].dropna()
            
            if len(temperatures) > 0:
                current_temp = temperatures.iloc[-1] if len(temperatures) > 0 else 15.0
                temp_trend = temperatures.diff().mean()
                temp_volatility = temperatures.std()
                
                # Generate insights
                if temp_trend > 0.1:
                    insights['key_findings'].append("Ocean temperatures are showing a significant warming trend")
                    insights['risk_assessment'] = "High"
                elif temp_trend > 0.05:
                    insights['key_findings'].append("Moderate ocean warming detected")
                    insights['risk_assessment'] = "Medium"
                
                if temp_volatility > 2.0:
                    insights['key_findings'].append("High temperature variability indicates unstable conditions")
                
                if current_temp > 25:
                    insights['key_findings'].append("Current temperatures in tropical range - monitor for coral bleaching")
                    insights['recommendations'].append("Increase monitoring frequency for marine ecosystems")
                
                # Summary
                insights['summary'] = f"Current ocean temperature: {current_temp:.1f}°C. "
                insights['summary'] += f"{'Warming' if temp_trend > 0 else 'Cooling'} trend of {abs(temp_trend):.2f}°C/day detected."
                
                insights['trend_analysis'] = {
                    'current_temperature': current_temp,
                    'trend_direction': 'warming' if temp_trend > 0 else 'cooling',
                    'trend_magnitude': abs(temp_trend),
                    'volatility': temp_volatility,
                    'data_quality': 'high' if len(temperatures) > 100 else 'moderate'
                }
        
        return insights
    
    def get_model_status(self) -> Dict:
        """Get current model status and performance metrics."""
        return {
            'is_trained': self.is_trained,
            'model_type': 'RandomForest + IsolationForest',
            'features_count': 12,
            'capabilities': [
                'Temperature forecasting (1-30 days)',
                'Anomaly detection',
                'Marine heatwave identification', 
                'Climate trend analysis',
                'Risk assessment',
                'Automated insights generation'
            ],
            'last_updated': datetime.now().isoformat(),
            'version': '1.0.0'
        }

# Singleton instance
ocean_ai = OceanPredictionEngine()

def train_ai_models():
    """Initialize and train the AI prediction models with sample data."""
    # Generate synthetic training data for demonstration
    dates = pd.date_range('2020-01-01', '2024-09-01', freq='D')
    np.random.seed(42)
    
    synthetic_data = pd.DataFrame({
        'date': dates,
        'lat': np.random.uniform(-60, 60, len(dates)),
        'lon': np.random.uniform(-180, 180, len(dates)),
        'sst_c': 15 + 10 * np.sin(2 * np.pi * np.arange(len(dates)) / 365) + np.random.normal(0, 2, len(dates))
    })
    
    # Add realistic temperature variations
    synthetic_data['sst_c'] += synthetic_data['lat'].abs() * -0.3  # Colder at poles
    synthetic_data['sst_c'] += np.random.exponential(1, len(dates)) * 0.1  # Random warming events
    
    return ocean_ai.train_models(synthetic_data)

if __name__ == "__main__":
    print("🌊 BlueSphere AI Ocean Prediction Engine")
    results = train_ai_models()
    print(f"Training completed: {results}")