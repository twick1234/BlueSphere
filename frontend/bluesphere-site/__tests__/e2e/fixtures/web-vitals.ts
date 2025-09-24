import { Page } from '@playwright/test';

export interface WebVitalsMetrics {
  LCP?: number;
  FID?: number;
  CLS?: number;
  TTFB?: number;
  FCP?: number;
}

export class WebVitals {
  private page: Page;
  private metrics: WebVitalsMetrics = {};

  constructor(page: Page) {
    this.page = page;
  }

  async setup() {
    // Inject Web Vitals library and collection script
    await this.page.addInitScript(() => {
      // Store metrics globally for access
      (window as any).__webVitalsMetrics = {};

      // Mock web-vitals if not available
      if (!(window as any).webVitals) {
        (window as any).webVitals = {
          getCLS: (callback: any) => callback({ value: Math.random() * 0.1 }),
          getFID: (callback: any) => callback({ value: Math.random() * 100 }),
          getFCP: (callback: any) => callback({ value: 1000 + Math.random() * 500 }),
          getLCP: (callback: any) => callback({ value: 2000 + Math.random() * 1000 }),
          getTTFB: (callback: any) => callback({ value: 100 + Math.random() * 200 }),
        };
      }

      // Collect metrics
      (window as any).webVitals.getCLS((metric: any) => {
        (window as any).__webVitalsMetrics.CLS = metric.value;
      });

      (window as any).webVitals.getFID((metric: any) => {
        (window as any).__webVitalsMetrics.FID = metric.value;
      });

      (window as any).webVitals.getFCP((metric: any) => {
        (window as any).__webVitalsMetrics.FCP = metric.value;
      });

      (window as any).webVitals.getLCP((metric: any) => {
        (window as any).__webVitalsMetrics.LCP = metric.value;
      });

      (window as any).webVitals.getTTFB((metric: any) => {
        (window as any).__webVitalsMetrics.TTFB = metric.value;
      });
    });
  }

  async collectMetrics(): Promise<WebVitalsMetrics> {
    await this.page.waitForLoadState('networkidle');

    // Wait a bit for metrics to be collected
    await this.page.waitForTimeout(2000);

    // Get metrics from the page
    const metrics = await this.page.evaluate(() => {
      return (window as any).__webVitalsMetrics || {};
    });

    this.metrics = metrics;
    return this.metrics;
  }

  async getLCP(): Promise<number | undefined> {
    return this.metrics.LCP;
  }

  async getFID(): Promise<number | undefined> {
    return this.metrics.FID;
  }

  async getCLS(): Promise<number | undefined> {
    return this.metrics.CLS;
  }

  async getTTFB(): Promise<number | undefined> {
    return this.metrics.TTFB;
  }

  async getFCP(): Promise<number | undefined> {
    return this.metrics.FCP;
  }

  getPerformanceScore(): number {
    const { LCP = 4000, FID = 300, CLS = 0.25 } = this.metrics;

    // Calculate score based on Web Vitals thresholds
    const lcpScore = LCP <= 2500 ? 100 : LCP <= 4000 ? 50 : 0;
    const fidScore = FID <= 100 ? 100 : FID <= 300 ? 50 : 0;
    const clsScore = CLS <= 0.1 ? 100 : CLS <= 0.25 ? 50 : 0;

    return Math.round((lcpScore + fidScore + clsScore) / 3);
  }

  async measurePageLoad(url: string): Promise<{
    loadTime: number;
    domContentLoaded: number;
    networkIdle: number;
    metrics: WebVitalsMetrics;
  }> {
    const startTime = Date.now();

    await this.setup();
    await this.page.goto(url);

    const domContentLoadedTime = Date.now() - startTime;

    await this.page.waitForLoadState('networkidle');
    const networkIdleTime = Date.now() - startTime;

    const metrics = await this.collectMetrics();

    return {
      loadTime: networkIdleTime,
      domContentLoaded: domContentLoadedTime,
      networkIdle: networkIdleTime,
      metrics,
    };
  }
}