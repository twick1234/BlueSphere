import { Page } from '@playwright/test';

export interface AccessibilityResult {
  violations: Array<{
    id: string;
    impact: string;
    description: string;
    nodes: Array<{
      target: string[];
      html: string;
      failureSummary: string;
    }>;
  }>;
  passes: number;
  incomplete: number;
  inapplicable: number;
}

export class AccessibilityHelper {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async injectAxeCore() {
    await this.page.addScriptTag({
      url: 'https://unpkg.com/axe-core@latest/axe.min.js'
    });
  }

  async analyzeAccessibility(options?: {
    tags?: string[];
    include?: string[];
    exclude?: string[];
  }): Promise<AccessibilityResult> {
    await this.injectAxeCore();

    const axeOptions = {
      tags: options?.tags || ['wcag2a', 'wcag2aa', 'wcag21aa'],
      ...(options?.include && { include: options.include }),
      ...(options?.exclude && { exclude: options.exclude }),
    };

    const results = await this.page.evaluate((opts) => {
      return new Promise((resolve) => {
        (window as any).axe.run(document, opts, (err: any, results: any) => {
          if (err) throw err;
          resolve({
            violations: results.violations,
            passes: results.passes.length,
            incomplete: results.incomplete.length,
            inapplicable: results.inapplicable.length,
          });
        });
      });
    }, axeOptions);

    return results as AccessibilityResult;
  }

  async checkColorContrast(): Promise<AccessibilityResult> {
    return this.analyzeAccessibility({
      tags: ['cat.color'],
    });
  }

  async checkKeyboardNavigation(): Promise<boolean> {
    // Test tab navigation
    const focusableElements = await this.page.$$eval(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      (elements) => elements.length
    );

    let tabbableCount = 0;
    let currentElement = await this.page.locator(':focus').first();

    // Start from the beginning
    await this.page.keyboard.press('Tab');

    for (let i = 0; i < focusableElements && i < 50; i++) {
      const focusedElement = await this.page.locator(':focus').first();
      if (await focusedElement.count() > 0) {
        tabbableCount++;
      }
      await this.page.keyboard.press('Tab');
    }

    return tabbableCount > 0;
  }

  async checkAriaLabels(): Promise<{
    missingLabels: string[];
    validLabels: number;
  }> {
    const results = await this.page.evaluate(() => {
      const interactiveElements = document.querySelectorAll(
        'button, input, select, textarea, a[href], [role="button"], [role="link"]'
      );

      const missingLabels: string[] = [];
      let validLabels = 0;

      interactiveElements.forEach((element, index) => {
        const hasAriaLabel = element.hasAttribute('aria-label');
        const hasAriaLabelledby = element.hasAttribute('aria-labelledby');
        const hasTitle = element.hasAttribute('title');
        const hasInnerText = element.textContent?.trim();
        const isInput = element.tagName.toLowerCase() === 'input';
        const hasAssociatedLabel = isInput && document.querySelector(`label[for="${element.id}"]`);

        if (!hasAriaLabel && !hasAriaLabelledby && !hasTitle && !hasInnerText && !hasAssociatedLabel) {
          missingLabels.push(`${element.tagName.toLowerCase()}[${index}]`);
        } else {
          validLabels++;
        }
      });

      return { missingLabels, validLabels };
    });

    return results;
  }

  async checkHeadingStructure(): Promise<{
    headings: Array<{ level: number; text: string }>;
    issues: string[];
  }> {
    const results = await this.page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
        .map((heading) => ({
          level: parseInt(heading.tagName.slice(1)),
          text: heading.textContent?.trim() || '',
        }));

      const issues: string[] = [];

      // Check if there's exactly one h1
      const h1Count = headings.filter(h => h.level === 1).length;
      if (h1Count === 0) {
        issues.push('No h1 element found');
      } else if (h1Count > 1) {
        issues.push('Multiple h1 elements found');
      }

      // Check for proper heading hierarchy
      for (let i = 1; i < headings.length; i++) {
        const current = headings[i];
        const previous = headings[i - 1];

        if (current.level > previous.level + 1) {
          issues.push(`Heading level jumps from h${previous.level} to h${current.level}`);
        }
      }

      return { headings, issues };
    });

    return results;
  }

  async simulateScreenReader(): Promise<{
    landmarks: string[];
    readingOrder: string[];
  }> {
    const results = await this.page.evaluate(() => {
      // Find landmarks
      const landmarks = Array.from(document.querySelectorAll(
        '[role="banner"], [role="navigation"], [role="main"], [role="complementary"], [role="contentinfo"], header, nav, main, aside, footer'
      )).map((element, index) => {
        const role = element.getAttribute('role') || element.tagName.toLowerCase();
        const label = element.getAttribute('aria-label') || '';
        return `${role}${label ? ` (${label})` : ''}[${index}]`;
      });

      // Simulate reading order
      const readableElements = Array.from(document.querySelectorAll(
        'h1, h2, h3, h4, h5, h6, p, a, button, input, label, img[alt]'
      )).map((element) => {
        const tag = element.tagName.toLowerCase();
        let text = '';

        if (tag === 'img') {
          text = element.getAttribute('alt') || '[Image without alt text]';
        } else {
          text = element.textContent?.trim() || '';
        }

        return `${tag}: ${text.substring(0, 100)}`;
      });

      return {
        landmarks,
        readingOrder: readableElements.slice(0, 20), // Limit for readability
      };
    });

    return results;
  }

  async testHighContrastMode(): Promise<boolean> {
    // Simulate high contrast mode
    await this.page.addStyleTag({
      content: `
        * {
          background-color: black !important;
          color: white !important;
          border-color: white !important;
        }
        a { color: yellow !important; }
        button { background-color: blue !important; }
      `
    });

    // Check if content is still readable
    const isReadable = await this.page.evaluate(() => {
      const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6');
      let readableCount = 0;

      textElements.forEach((element) => {
        const styles = window.getComputedStyle(element);
        const hasText = element.textContent?.trim();
        const isVisible = styles.display !== 'none' && styles.visibility !== 'hidden';

        if (hasText && isVisible) {
          readableCount++;
        }
      });

      return readableCount > 0;
    });

    return isReadable;
  }
}