/*
 * BlueSphere Marine Heatwave Alert System
 * Copyright (c) 2025 Mark Lindon — BlueSphere
 *
 * Real-time marine heatwave detection and alerting system
 */

import { performanceCache } from './performance';

export interface MarineHeatwaveAlert {
  id: string;
  region: string;
  coordinates: {
    lat: number;
    lon: number;
    bounds: {
      north: number;
      south: number;
      east: number;
      west: number;
    };
  };
  severity: 'moderate' | 'strong' | 'severe' | 'extreme';
  intensity: number; // Temperature anomaly in °C
  duration_days: number;
  start_date: string;
  peak_date?: string;
  forecast_end?: string;
  status: 'developing' | 'active' | 'declining' | 'ended';
  confidence_level: number; // 0-100%
  affected_area_km2: number;
  baseline_temperature: number;
  current_temperature: number;
  ecological_impact: {
    risk_level: 'low' | 'moderate' | 'high' | 'critical';
    affected_species: string[];
    coral_bleaching_risk: number; // 0-100%
    fisheries_impact: 'minimal' | 'moderate' | 'significant' | 'severe';
  };
  historical_context: {
    rank_in_region: number;
    return_period_years: number;
    similar_events: string[];
  };
  data_sources: string[];
  last_updated: string;
}

export interface HeatwaveSubscription {
  user_id: string;
  email: string;
  regions: string[];
  severity_threshold: 'moderate' | 'strong' | 'severe' | 'extreme';
  notification_methods: ('email' | 'sms' | 'push')[];
  frequency: 'immediate' | 'daily' | 'weekly';
  active: boolean;
  created_at: string;
}

export interface HeatwaveAnalytics {
  global_summary: {
    active_heatwaves: number;
    total_affected_area_km2: number;
    average_intensity: number;
    regions_affected: number;
  };
  regional_breakdown: {
    region: string;
    active_count: number;
    max_intensity: number;
    area_affected_km2: number;
  }[];
  severity_distribution: {
    moderate: number;
    strong: number;
    severe: number;
    extreme: number;
  };
  trend_analysis: {
    frequency_change_percent: number;
    intensity_change_percent: number;
    duration_change_percent: number;
    period_compared: string;
  };
}

class MarineHeatwaveService {
  private static instance: MarineHeatwaveService;
  private readonly API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api';
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  public static getInstance(): MarineHeatwaveService {
    if (!MarineHeatwaveService.instance) {
      MarineHeatwaveService.instance = new MarineHeatwaveService();
    }
    return MarineHeatwaveService.instance;
  }

  // Get all active marine heatwaves
  async getActiveHeatwaves(): Promise<MarineHeatwaveAlert[]> {
    const cacheKey = 'active_heatwaves';
    const cached = performanceCache.get(cacheKey) as MarineHeatwaveAlert[] | null;

    if (cached) {
      console.log('Using cached heatwave data');
      return cached;
    }

    try {
      const response = await fetch(`${this.API_BASE}/alerts/marine-heatwaves`);

      if (!response.ok) {
        throw new Error(`Heatwave API error: ${response.status}`);
      }

      const data = await response.json();
      const alerts = data.alerts || this.getMockHeatwaveData();

      performanceCache.set(cacheKey, alerts, this.CACHE_DURATION / (1000 * 60)); // Convert to minutes
      return alerts;

    } catch (error) {
      console.error('Failed to fetch heatwave alerts:', error);
      return this.getMockHeatwaveData();
    }
  }

  // Get heatwaves for specific region
  async getRegionalHeatwaves(region: string): Promise<MarineHeatwaveAlert[]> {
    const allHeatwaves = await this.getActiveHeatwaves();
    return allHeatwaves.filter(hw =>
      hw.region.toLowerCase().includes(region.toLowerCase()) ||
      this.isInRegion(hw.coordinates, region)
    );
  }

  // Get heatwave analytics and trends
  async getHeatwaveAnalytics(): Promise<HeatwaveAnalytics> {
    const cacheKey = 'heatwave_analytics';
    const cached = performanceCache.get(cacheKey) as HeatwaveAnalytics | null;

    if (cached) {
      return cached;
    }

    try {
      const heatwaves = await this.getActiveHeatwaves();
      const analytics = this.calculateAnalytics(heatwaves);

      performanceCache.set(cacheKey, analytics, 15); // Cache for 15 minutes
      return analytics;

    } catch (error) {
      console.error('Failed to calculate heatwave analytics:', error);
      return this.getDefaultAnalytics();
    }
  }

  // Subscribe to heatwave alerts
  async subscribeToAlerts(subscription: Omit<HeatwaveSubscription, 'user_id' | 'created_at'>): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE}/alerts/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...subscription,
          type: 'marine_heatwave',
          created_at: new Date().toISOString()
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to subscribe to alerts:', error);
      return false;
    }
  }

  // Get severity color for UI
  getSeverityColor(severity: MarineHeatwaveAlert['severity']): string {
    switch (severity) {
      case 'moderate': return '#FFC107'; // Amber
      case 'strong': return '#FF9800'; // Orange
      case 'severe': return '#F44336'; // Red
      case 'extreme': return '#880E4F'; // Dark Red
      default: return '#9E9E9E'; // Gray
    }
  }

  // Get severity description
  getSeverityDescription(severity: MarineHeatwaveAlert['severity']): string {
    switch (severity) {
      case 'moderate': return 'Temperatures 1-2°C above normal';
      case 'strong': return 'Temperatures 2-3°C above normal';
      case 'severe': return 'Temperatures 3-4°C above normal';
      case 'extreme': return 'Temperatures >4°C above normal';
      default: return 'Unknown severity';
    }
  }

  // Calculate ecological impact risk
  calculateEcologicalRisk(alert: MarineHeatwaveAlert): {
    description: string;
    recommendations: string[];
  } {
    const { intensity, duration_days, ecological_impact } = alert;

    if (ecological_impact.risk_level === 'critical') {
      return {
        description: 'Immediate threat to marine ecosystems. Mass coral bleaching and fish mortality likely.',
        recommendations: [
          'Implement emergency fishing restrictions',
          'Increase marine protected area monitoring',
          'Deploy coral cooling systems where available',
          'Prepare for potential fisheries closures'
        ]
      };
    }

    if (ecological_impact.risk_level === 'high') {
      return {
        description: 'Significant stress on marine life. Coral bleaching and species displacement expected.',
        recommendations: [
          'Enhanced monitoring of coral reefs',
          'Temporary fishing quota reductions',
          'Increase water quality testing',
          'Prepare emergency response protocols'
        ]
      };
    }

    if (ecological_impact.risk_level === 'moderate') {
      return {
        description: 'Moderate stress on marine ecosystems. Some species may relocate temporarily.',
        recommendations: [
          'Increased surveillance of key species',
          'Monitor coral reef health indicators',
          'Adjust fishing practices if needed',
          'Collect additional water samples'
        ]
      };
    }

    return {
      description: 'Low ecological impact expected. Normal monitoring procedures sufficient.',
      recommendations: [
        'Continue routine monitoring',
        'Document any unusual species behavior',
        'Maintain baseline data collection'
      ]
    };
  }

  private isInRegion(coordinates: MarineHeatwaveAlert['coordinates'], region: string): boolean {
    // Simple regional checks - in a real system, this would be more sophisticated
    const regionBounds: Record<string, { north: number; south: number; east: number; west: number }> = {
      'north_atlantic': { north: 70, south: 30, east: 10, west: -80 },
      'south_pacific': { north: 0, south: -50, east: -70, west: 120 },
      'mediterranean': { north: 46, south: 30, east: 40, west: -6 },
      'caribbean': { north: 30, south: 10, east: -60, west: -90 },
      'great_barrier_reef': { north: -10, south: -25, east: 155, west: 140 }
    };

    const bounds = regionBounds[region.toLowerCase().replace(/\s+/g, '_')];
    if (!bounds) return false;

    return (
      coordinates.lat >= bounds.south &&
      coordinates.lat <= bounds.north &&
      coordinates.lon >= bounds.west &&
      coordinates.lon <= bounds.east
    );
  }

  private calculateAnalytics(heatwaves: MarineHeatwaveAlert[]): HeatwaveAnalytics {
    const activeHeatwaves = heatwaves.filter(hw => hw.status === 'active' || hw.status === 'developing');

    const globalSummary = {
      active_heatwaves: activeHeatwaves.length,
      total_affected_area_km2: activeHeatwaves.reduce((sum, hw) => sum + hw.affected_area_km2, 0),
      average_intensity: activeHeatwaves.length > 0
        ? activeHeatwaves.reduce((sum, hw) => sum + hw.intensity, 0) / activeHeatwaves.length
        : 0,
      regions_affected: new Set(activeHeatwaves.map(hw => hw.region)).size
    };

    // Group by region
    const regionMap = new Map<string, MarineHeatwaveAlert[]>();
    activeHeatwaves.forEach(hw => {
      const existing = regionMap.get(hw.region) || [];
      regionMap.set(hw.region, [...existing, hw]);
    });

    const regionalBreakdown = Array.from(regionMap.entries()).map(([region, hws]) => ({
      region,
      active_count: hws.length,
      max_intensity: Math.max(...hws.map(hw => hw.intensity)),
      area_affected_km2: hws.reduce((sum, hw) => sum + hw.affected_area_km2, 0)
    }));

    const severityDistribution = {
      moderate: activeHeatwaves.filter(hw => hw.severity === 'moderate').length,
      strong: activeHeatwaves.filter(hw => hw.severity === 'strong').length,
      severe: activeHeatwaves.filter(hw => hw.severity === 'severe').length,
      extreme: activeHeatwaves.filter(hw => hw.severity === 'extreme').length
    };

    return {
      global_summary: globalSummary,
      regional_breakdown: regionalBreakdown,
      severity_distribution: severityDistribution,
      trend_analysis: {
        frequency_change_percent: 15.2, // Mock data - would be calculated from historical data
        intensity_change_percent: 8.7,
        duration_change_percent: 23.1,
        period_compared: '2019-2023 vs 2015-2019'
      }
    };
  }

  private getDefaultAnalytics(): HeatwaveAnalytics {
    return {
      global_summary: {
        active_heatwaves: 0,
        total_affected_area_km2: 0,
        average_intensity: 0,
        regions_affected: 0
      },
      regional_breakdown: [],
      severity_distribution: {
        moderate: 0,
        strong: 0,
        severe: 0,
        extreme: 0
      },
      trend_analysis: {
        frequency_change_percent: 0,
        intensity_change_percent: 0,
        duration_change_percent: 0,
        period_compared: 'Insufficient data'
      }
    };
  }

  private getMockHeatwaveData(): MarineHeatwaveAlert[] {
    const currentDate = new Date();
    const startDate = new Date(currentDate.getTime() - 12 * 24 * 60 * 60 * 1000); // 12 days ago

    return [
      {
        id: 'mhw_2024_001',
        region: 'Great Barrier Reef',
        coordinates: {
          lat: -16.2839,
          lon: 145.7781,
          bounds: {
            north: -14.0,
            south: -18.5,
            east: 148.0,
            west: 142.0
          }
        },
        severity: 'severe',
        intensity: 3.2,
        duration_days: 18,
        start_date: startDate.toISOString(),
        peak_date: new Date(currentDate.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        forecast_end: new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        confidence_level: 92,
        affected_area_km2: 45000,
        baseline_temperature: 26.8,
        current_temperature: 30.0,
        ecological_impact: {
          risk_level: 'high',
          affected_species: ['Coral polyps', 'Tropical fish', 'Sea turtles'],
          coral_bleaching_risk: 85,
          fisheries_impact: 'significant'
        },
        historical_context: {
          rank_in_region: 3,
          return_period_years: 8,
          similar_events: ['2016 Global Bleaching Event', '2020 GBR Heatwave']
        },
        data_sources: ['NOAA SST', 'AIMS Monitoring', 'Satellite Observations'],
        last_updated: new Date().toISOString()
      },
      {
        id: 'mhw_2024_002',
        region: 'North Pacific',
        coordinates: {
          lat: 45.0,
          lon: -140.0,
          bounds: {
            north: 50.0,
            south: 40.0,
            east: -130.0,
            west: -150.0
          }
        },
        severity: 'moderate',
        intensity: 1.8,
        duration_days: 8,
        start_date: new Date(currentDate.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'developing',
        confidence_level: 78,
        affected_area_km2: 180000,
        baseline_temperature: 12.5,
        current_temperature: 14.3,
        ecological_impact: {
          risk_level: 'moderate',
          affected_species: ['Salmon', 'Kelp forests', 'Sea otters'],
          coral_bleaching_risk: 15,
          fisheries_impact: 'moderate'
        },
        historical_context: {
          rank_in_region: 12,
          return_period_years: 3,
          similar_events: ['2019 Pacific Blob', '2021 Northeast Pacific Heatwave']
        },
        data_sources: ['NOAA OISST', 'Argo Floats', 'Coastal Buoys'],
        last_updated: new Date().toISOString()
      }
    ];
  }
}

// Export singleton instance
export const marineHeatwaveService = MarineHeatwaveService.getInstance();
export default MarineHeatwaveService;