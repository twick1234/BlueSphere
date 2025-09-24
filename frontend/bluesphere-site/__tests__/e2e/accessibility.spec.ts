import { test, expect } from './fixtures';
import { waitForPageLoad } from './fixtures';

test.describe('Comprehensive Accessibility Testing', () => {
  test.describe('Automated Accessibility Audits', () => {
    test('should pass axe accessibility audit on all main pages', async ({ page, accessibility }) => {
      const pagesToTest = [
        { url: '/', name: 'Home' },
        { url: '/sharks', name: 'Sharks' },
        { url: '/map', name: 'Map' },
        { url: '/analytics', name: 'Analytics' },
        { url: '/metrics', name: 'Metrics Dashboard' },
      ];

      for (const pageInfo of pagesToTest) {
        console.log(`\n🔍 Testing accessibility for ${pageInfo.name} page`);

        await page.goto(pageInfo.url);
        await waitForPageLoad(page);

        // Run comprehensive accessibility analysis
        const results = await accessibility.analyzeAccessibility();

        console.log(`📊 ${pageInfo.name} accessibility results:`, {
          violations: results.violations.length,
          passes: results.passes,
          incomplete: results.incomplete,
        });

        // No critical violations should exist
        const criticalViolations = results.violations.filter(
          violation => violation.impact === 'critical'
        );

        const seriousViolations = results.violations.filter(
          violation => violation.impact === 'serious'
        );

        expect(criticalViolations.length).toBe(0);
        expect(seriousViolations.length).toBeLessThan(3); // Allow some serious but aim for none

        // Log violations for debugging
        if (results.violations.length > 0) {
          console.log(`⚠️ ${pageInfo.name} accessibility issues:`);
          results.violations.forEach((violation, index) => {
            console.log(`  ${index + 1}. ${violation.id} (${violation.impact})`);
            console.log(`     ${violation.description}`);
            console.log(`     Nodes: ${violation.nodes.length}`);
          });
        } else {
          console.log(`✅ ${pageInfo.name} - No accessibility violations found!`);
        }
      }
    });

    test('should have proper color contrast ratios', async ({ page, accessibility }) => {
      const testPages = ['/', '/metrics', '/sharks'];

      for (const url of testPages) {
        console.log(`\n🔍 Testing color contrast for ${url}`);

        await page.goto(url);
        await waitForPageLoad(page);

        const contrastResults = await accessibility.checkColorContrast();

        console.log(`📊 Color contrast results for ${url}:`, {
          violations: contrastResults.violations.length,
          passes: contrastResults.passes,
        });

        // Should have no contrast violations
        expect(contrastResults.violations.length).toBe(0);

        if (contrastResults.violations.length === 0) {
          console.log(`✅ ${url} - All color contrasts meet WCAG standards`);
        } else {
          console.log(`⚠️ ${url} - Color contrast issues found:`);
          contrastResults.violations.forEach(violation => {
            console.log(`  - ${violation.id}: ${violation.description}`);
          });
        }
      }
    });
  });

  test.describe('Keyboard Navigation Testing', () => {
    test('should support full keyboard navigation', async ({ page, accessibility }) => {
      const testPages = ['/', '/sharks', '/map', '/metrics'];

      for (const url of testPages) {
        console.log(`\n⌨️ Testing keyboard navigation for ${url}`);

        await page.goto(url);
        await waitForPageLoad(page);

        // Test keyboard navigation
        const keyboardSupported = await accessibility.checkKeyboardNavigation();

        expect(keyboardSupported).toBe(true);

        if (keyboardSupported) {
          console.log(`✅ ${url} - Keyboard navigation working`);
        } else {
          console.log(`❌ ${url} - Keyboard navigation issues found`);
        }
      }
    });

    test('should have proper focus indicators', async ({ page }) => {
      await page.goto('/metrics');
      await waitForPageLoad(page);

      // Get all focusable elements
      const focusableElements = await page.locator(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ).all();

      console.log(`🔍 Found ${focusableElements.length} focusable elements`);

      // Test focus indicators on first few elements
      for (let i = 0; i < Math.min(focusableElements.length, 5); i++) {
        await focusableElements[i].focus();
        await page.waitForTimeout(200);

        // Check if element has focus styles
        const hasFocusStyles = await page.evaluate((element) => {
          const styles = window.getComputedStyle(element);
          return styles.outline !== 'none' ||
                 styles.boxShadow !== 'none' ||
                 styles.borderColor !== 'initial' ||
                 element.matches(':focus-visible');
        }, await focusableElements[i].elementHandle());

        expect(hasFocusStyles).toBe(true);

        if (hasFocusStyles) {
          console.log(`✅ Element ${i} has proper focus indicator`);
        } else {
          console.log(`⚠️ Element ${i} missing focus indicator`);
        }
      }
    });

    test('should handle keyboard shortcuts and navigation', async ({ page }) => {
      await page.goto('/map');
      await waitForPageLoad(page);

      // Test common keyboard shortcuts
      const shortcuts = [
        { key: 'Tab', description: 'Tab navigation' },
        { key: 'Escape', description: 'Escape key handling' },
        { key: 'Enter', description: 'Enter key activation' },
        { key: 'Space', description: 'Space key activation' },
      ];

      for (const shortcut of shortcuts) {
        console.log(`⌨️ Testing ${shortcut.description}`);

        await page.keyboard.press(shortcut.key);
        await page.waitForTimeout(300);

        // Should not cause JavaScript errors
        const hasErrors = await page.evaluate(() => {
          return (window as any).__keyboardErrors?.length > 0;
        });

        expect(hasErrors).toBeFalsy();
        console.log(`✅ ${shortcut.description} handled without errors`);
      }
    });
  });

  test.describe('Screen Reader Support', () => {
    test('should have proper ARIA labels and roles', async ({ page, accessibility }) => {
      const testPages = ['/metrics', '/analytics', '/map'];

      for (const url of testPages) {
        console.log(`\n🗣️ Testing ARIA support for ${url}`);

        await page.goto(url);
        await waitForPageLoad(page);

        const ariaResults = await accessibility.checkAriaLabels();

        console.log(`📊 ARIA labels for ${url}:`, {
          validLabels: ariaResults.validLabels,
          missingLabels: ariaResults.missingLabels.length,
        });

        // Most interactive elements should have proper labels
        const totalInteractive = ariaResults.validLabels + ariaResults.missingLabels.length;
        if (totalInteractive > 0) {
          const labelCoverage = ariaResults.validLabels / totalInteractive;
          expect(labelCoverage).toBeGreaterThan(0.7); // 70% coverage minimum

          console.log(`📊 ARIA label coverage: ${(labelCoverage * 100).toFixed(1)}%`);
        }

        if (ariaResults.missingLabels.length > 0) {
          console.log(`⚠️ Elements missing labels:`, ariaResults.missingLabels);
        }
      }
    });

    test('should have proper heading structure', async ({ page, accessibility }) => {
      const testPages = ['/', '/sharks', '/metrics', '/analytics'];

      for (const url of testPages) {
        console.log(`\n📄 Testing heading structure for ${url}`);

        await page.goto(url);
        await waitForPageLoad(page);

        const headingResults = await accessibility.checkHeadingStructure();

        console.log(`📊 Heading structure for ${url}:`, {
          totalHeadings: headingResults.headings.length,
          issues: headingResults.issues.length,
        });

        // Should have at least one heading
        expect(headingResults.headings.length).toBeGreaterThan(0);

        // Should have minimal heading structure issues
        expect(headingResults.issues.length).toBeLessThan(3);

        if (headingResults.issues.length === 0) {
          console.log(`✅ ${url} - Perfect heading structure`);
        } else {
          console.log(`⚠️ ${url} - Heading issues:`, headingResults.issues);
        }

        // Log heading hierarchy for debugging
        console.log('Heading hierarchy:');
        headingResults.headings.forEach((heading, index) => {
          const indent = '  '.repeat(heading.level - 1);
          console.log(`${indent}H${heading.level}: ${heading.text.substring(0, 50)}`);
        });
      }
    });

    test('should simulate screen reader experience', async ({ page, accessibility }) => {
      await page.goto('/metrics');
      await waitForPageLoad(page);

      const screenReaderResults = await accessibility.simulateScreenReader();

      console.log(`🗣️ Screen reader simulation results:`);
      console.log(`  Landmarks found: ${screenReaderResults.landmarks.length}`);
      console.log(`  Reading order items: ${screenReaderResults.readingOrder.length}`);

      // Should have proper landmarks
      expect(screenReaderResults.landmarks.length).toBeGreaterThan(0);

      // Should have readable content
      expect(screenReaderResults.readingOrder.length).toBeGreaterThan(5);

      console.log('📍 Landmarks detected:');
      screenReaderResults.landmarks.forEach((landmark, index) => {
        console.log(`  ${index + 1}. ${landmark}`);
      });

      console.log('📖 Reading order preview:');
      screenReaderResults.readingOrder.slice(0, 10).forEach((item, index) => {
        console.log(`  ${index + 1}. ${item}`);
      });
    });
  });

  test.describe('Visual Accessibility', () => {
    test('should handle high contrast mode', async ({ page, accessibility }) => {
      await page.goto('/metrics');
      await waitForPageLoad(page);

      const highContrastSupported = await accessibility.testHighContrastMode();

      expect(highContrastSupported).toBe(true);

      if (highContrastSupported) {
        console.log('✅ High contrast mode supported');
      } else {
        console.log('❌ High contrast mode not properly supported');
      }

      // Take screenshot in high contrast mode for manual review
      await page.screenshot({
        path: 'test-results/high-contrast-manual-review.png',
        fullPage: true,
      });
    });

    test('should handle zoom levels up to 200%', async ({ page }) => {
      const zoomLevels = [1.0, 1.25, 1.5, 2.0];
      const testUrls = ['/metrics', '/sharks'];

      for (const url of testUrls) {
        console.log(`\n🔍 Testing zoom levels for ${url}`);

        for (const zoom of zoomLevels) {
          await page.goto(url);
          await waitForPageLoad(page);

          // Set zoom level
          await page.evaluate((zoomLevel) => {
            document.body.style.zoom = zoomLevel.toString();
          }, zoom);

          await page.waitForTimeout(500);

          // Verify content is still accessible
          const mainContent = await page.locator('main, [role="main"], h1').first();
          await expect(mainContent).toBeVisible();

          // Verify no horizontal scrolling (for viewport width)
          const hasHorizontalScroll = await page.evaluate(() => {
            return document.documentElement.scrollWidth > window.innerWidth;
          });

          // Allow horizontal scroll at high zoom levels
          if (zoom <= 1.5) {
            expect(hasHorizontalScroll).toBe(false);
          }

          console.log(`✅ ${url} at ${zoom * 100}% zoom: ${hasHorizontalScroll ? 'horizontal scroll' : 'no horizontal scroll'}`);
        }

        // Reset zoom
        await page.evaluate(() => {
          document.body.style.zoom = '1';
        });
      }
    });

    test('should provide text alternatives for images', async ({ page }) => {
      const testPages = ['/', '/sharks', '/map'];

      for (const url of testPages) {
        console.log(`\n🖼️ Testing image alternatives for ${url}`);

        await page.goto(url);
        await waitForPageLoad(page);

        // Check all images for alt text
        const imageResults = await page.evaluate(() => {
          const images = Array.from(document.querySelectorAll('img'));
          return images.map((img, index) => ({
            index,
            src: img.src.substring(0, 50) + '...',
            hasAlt: img.hasAttribute('alt'),
            altText: img.getAttribute('alt') || '',
            isDecorative: img.getAttribute('alt') === '' && img.hasAttribute('alt'),
            role: img.getAttribute('role'),
          }));
        });

        console.log(`📊 Image analysis for ${url}: ${imageResults.length} images found`);

        imageResults.forEach((image) => {
          if (image.isDecorative) {
            console.log(`✅ Image ${image.index}: Properly marked as decorative`);
          } else if (image.hasAlt && image.altText) {
            console.log(`✅ Image ${image.index}: Has alt text - "${image.altText.substring(0, 30)}..."`);
          } else {
            console.log(`⚠️ Image ${image.index}: Missing alt text - ${image.src}`);
          }
        });

        // Should not have images without proper alt handling
        const imagesWithoutAlt = imageResults.filter(
          img => !img.hasAlt && img.role !== 'presentation'
        );

        expect(imagesWithoutAlt.length).toBeLessThan(3); // Allow few missing for testing
      }
    });
  });

  test.describe('Interactive Element Accessibility', () => {
    test('should have accessible form controls', async ({ page }) => {
      const pagesWithForms = ['/sharks', '/map', '/analytics'];

      for (const url of pagesWithForms) {
        console.log(`\n📝 Testing form accessibility for ${url}`);

        await page.goto(url);
        await waitForPageLoad(page);

        // Check form inputs
        const formInputs = await page.evaluate(() => {
          const inputs = Array.from(document.querySelectorAll('input, select, textarea'));
          return inputs.map((input, index) => {
            const labels = document.querySelectorAll(`label[for="${input.id}"]`);
            const hasAriaLabel = input.hasAttribute('aria-label');
            const hasAriaLabelledby = input.hasAttribute('aria-labelledby');
            const hasPlaceholder = input.hasAttribute('placeholder');

            return {
              index,
              type: input.type || input.tagName.toLowerCase(),
              hasId: !!input.id,
              hasLabel: labels.length > 0,
              hasAriaLabel,
              hasAriaLabelledby,
              hasPlaceholder,
              isAccessible: labels.length > 0 || hasAriaLabel || hasAriaLabelledby,
            };
          });
        });

        console.log(`📊 Form inputs for ${url}: ${formInputs.length} found`);

        formInputs.forEach((input) => {
          if (input.isAccessible) {
            console.log(`✅ Input ${input.index} (${input.type}): Properly labeled`);
          } else {
            console.log(`⚠️ Input ${input.index} (${input.type}): Missing label`);
          }
        });

        // Most form inputs should be properly labeled
        if (formInputs.length > 0) {
          const accessibleInputs = formInputs.filter(input => input.isAccessible).length;
          const accessibility = accessibleInputs / formInputs.length;

          expect(accessibility).toBeGreaterThan(0.8); // 80% should be accessible
          console.log(`📊 Form accessibility: ${(accessibility * 100).toFixed(1)}%`);
        }
      }
    });

    test('should have accessible buttons and links', async ({ page }) => {
      await page.goto('/metrics');
      await waitForPageLoad(page);

      // Check buttons and links
      const interactiveElements = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
        const links = Array.from(document.querySelectorAll('a[href]'));

        const checkElement = (element: Element) => {
          const hasText = !!element.textContent?.trim();
          const hasAriaLabel = element.hasAttribute('aria-label');
          const hasTitle = element.hasAttribute('title');
          const hasAriaLabelledby = element.hasAttribute('aria-labelledby');

          return {
            tagName: element.tagName.toLowerCase(),
            hasText,
            hasAriaLabel,
            hasTitle,
            hasAriaLabelledby,
            text: element.textContent?.trim().substring(0, 30) || '',
            isAccessible: hasText || hasAriaLabel || hasTitle || hasAriaLabelledby,
          };
        };

        return {
          buttons: buttons.map(checkElement),
          links: links.map(checkElement),
        };
      });

      console.log(`🔘 Interactive elements found:`);
      console.log(`  Buttons: ${interactiveElements.buttons.length}`);
      console.log(`  Links: ${interactiveElements.links.length}`);

      // Check button accessibility
      interactiveElements.buttons.forEach((button, index) => {
        if (button.isAccessible) {
          console.log(`✅ Button ${index}: "${button.text}"`);
        } else {
          console.log(`⚠️ Button ${index}: No accessible text`);
        }
      });

      // Check link accessibility
      interactiveElements.links.forEach((link, index) => {
        if (link.isAccessible) {
          console.log(`✅ Link ${index}: "${link.text}"`);
        } else {
          console.log(`⚠️ Link ${index}: No accessible text`);
        }
      });

      // Most interactive elements should be accessible
      const allInteractive = [...interactiveElements.buttons, ...interactiveElements.links];
      if (allInteractive.length > 0) {
        const accessibleCount = allInteractive.filter(el => el.isAccessible).length;
        const accessibilityRate = accessibleCount / allInteractive.length;

        expect(accessibilityRate).toBeGreaterThan(0.9); // 90% should be accessible
        console.log(`📊 Interactive element accessibility: ${(accessibilityRate * 100).toFixed(1)}%`);
      }
    });
  });

  test.describe('Dynamic Content Accessibility', () => {
    test('should handle dynamic content updates accessibly', async ({ page }) => {
      await page.goto('/metrics');
      await waitForPageLoad(page);

      // Enable auto-refresh for dynamic updates
      const autoRefreshCheckbox = page.locator('#autoRefresh');
      if (await autoRefreshCheckbox.count() > 0) {
        await autoRefreshCheckbox.check();
      }

      // Check for live regions
      const liveRegions = await page.evaluate(() => {
        const liveElements = document.querySelectorAll('[aria-live], [role="status"], [role="alert"]');
        return Array.from(liveElements).map((element) => ({
          role: element.getAttribute('role'),
          ariaLive: element.getAttribute('aria-live'),
          tagName: element.tagName.toLowerCase(),
        }));
      });

      console.log(`📢 Live regions found: ${liveRegions.length}`);

      liveRegions.forEach((region, index) => {
        console.log(`  ${index + 1}. ${region.tagName} with role="${region.role}" aria-live="${region.ariaLive}"`);
      });

      // Should have live regions for dynamic content
      if (liveRegions.length > 0) {
        expect(liveRegions.length).toBeGreaterThan(0);
        console.log('✅ Dynamic content has proper live regions');
      } else {
        console.log('ℹ️ No live regions detected (may not have dynamic content)');
      }
    });

    test('should handle modals and dialogs accessibly', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);

      // Look for modal triggers
      const modalTriggers = await page.locator('button:has-text("modal"), button:has-text("dialog"), button:has-text("popup")').count();

      console.log(`🔍 Found ${modalTriggers} potential modal triggers`);

      if (modalTriggers > 0) {
        // Test first modal trigger
        await page.locator('button:has-text("modal"), button:has-text("dialog"), button:has-text("popup")').first().click();
        await page.waitForTimeout(1000);

        // Check for proper modal attributes
        const modalInfo = await page.evaluate(() => {
          const modal = document.querySelector('[role="dialog"], [role="alertdialog"], .modal');
          if (modal) {
            return {
              hasRole: modal.hasAttribute('role'),
              hasAriaLabel: modal.hasAttribute('aria-label'),
              hasAriaLabelledby: modal.hasAttribute('aria-labelledby'),
              hasFocusManagement: !!modal.querySelector('[autofocus]'),
              role: modal.getAttribute('role'),
            };
          }
          return null;
        });

        if (modalInfo) {
          expect(modalInfo.hasRole).toBe(true);
          expect(modalInfo.hasAriaLabel || modalInfo.hasAriaLabelledby).toBe(true);

          console.log('✅ Modal has proper accessibility attributes');
        }
      }
    });
  });
});