#!/usr/bin/env node
/*
 * BlueSphere Complete Test Harness
 * Copyright (c) 2025 Mark Lindon — BlueSphere
 *
 * Comprehensive testing suite for deployment validation
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

class BlueSphereTestHarness {
  constructor() {
    this.testResults = [];
    this.failedTests = 0;
    this.passedTests = 0;
    this.startTime = Date.now();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      error: '\x1b[31m',
      warning: '\x1b[33m',
      reset: '\x1b[0m'
    };

    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  recordTest(testName, passed, details = '') {
    const result = {
      testName,
      passed,
      details,
      timestamp: new Date().toISOString()
    };

    this.testResults.push(result);

    if (passed) {
      this.passedTests++;
      this.log(`✅ PASS: ${testName} ${details}`, 'success');
    } else {
      this.failedTests++;
      this.log(`❌ FAIL: ${testName} ${details}`, 'error');
    }
  }

  async runCommand(command, testName, expectSuccess = true) {
    try {
      this.log(`Running: ${command}`, 'info');
      const output = execSync(command, {
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 120000 // 2 minute timeout
      });

      if (expectSuccess) {
        this.recordTest(testName, true, 'Command executed successfully');
        return { success: true, output };
      } else {
        this.recordTest(testName, false, 'Command should have failed but succeeded');
        return { success: false, output };
      }
    } catch (error) {
      if (!expectSuccess) {
        this.recordTest(testName, true, 'Command correctly failed as expected');
        return { success: true, output: error.message };
      } else {
        this.recordTest(testName, false, `Error: ${error.message}`);
        return { success: false, output: error.message };
      }
    }
  }

  checkFileExists(filePath, testName) {
    const exists = fs.existsSync(filePath);
    this.recordTest(testName, exists, exists ? 'File found' : `File not found: ${filePath}`);
    return exists;
  }

  checkFileContent(filePath, searchText, testName) {
    try {
      if (!fs.existsSync(filePath)) {
        this.recordTest(testName, false, `File does not exist: ${filePath}`);
        return false;
      }

      const content = fs.readFileSync(filePath, 'utf8');
      const found = content.includes(searchText);
      this.recordTest(testName, found, found ? 'Content found' : `Missing content: ${searchText}`);
      return found;
    } catch (error) {
      this.recordTest(testName, false, `Error reading file: ${error.message}`);
      return false;
    }
  }

  validatePackageJson() {
    this.log('🔍 Validating package.json configuration...', 'info');

    const packagePath = path.join(process.cwd(), 'package.json');
    if (!this.checkFileExists(packagePath, 'package.json exists')) {
      return false;
    }

    try {
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

      this.recordTest('package.json valid JSON', true, 'Successfully parsed');

      const requiredFields = ['name', 'version', 'scripts', 'dependencies'];
      requiredFields.forEach(field => {
        this.recordTest(`package.json has ${field}`, !!pkg[field], pkg[field] ? 'Present' : 'Missing');
      });

      const requiredScripts = ['dev', 'build', 'start'];
      requiredScripts.forEach(script => {
        this.recordTest(`package.json has ${script} script`, !!pkg.scripts?.[script],
          pkg.scripts?.[script] ? 'Present' : 'Missing');
      });

      const criticalDeps = ['next', 'react', 'react-dom'];
      criticalDeps.forEach(dep => {
        this.recordTest(`Critical dependency ${dep}`, !!pkg.dependencies?.[dep],
          pkg.dependencies?.[dep] ? `Version: ${pkg.dependencies[dep]}` : 'Missing');
      });

      return true;
    } catch (error) {
      this.recordTest('package.json valid JSON', false, `Parse error: ${error.message}`);
      return false;
    }
  }

  async validateDependencies() {
    this.log('📦 Validating dependencies...', 'info');

    // Check if node_modules exists
    this.checkFileExists('node_modules', 'node_modules directory exists');

    // Run npm audit for security vulnerabilities
    await this.runCommand('npm audit --audit-level=high', 'Security audit (high-level vulnerabilities)');

    // Check for outdated packages (non-breaking)
    try {
      await this.runCommand('npm outdated', 'Check for outdated packages', false);
    } catch (error) {
      // npm outdated exits with 1 when packages are outdated, which is expected
      this.recordTest('Check for outdated packages', true, 'Completed outdated check');
    }
  }

  validateProjectStructure() {
    this.log('🏗️ Validating project structure...', 'info');

    const criticalFiles = [
      'pages/_app.tsx',
      'pages/_document.tsx',
      'pages/index.tsx',
      'components/Layout.tsx',
      'lib/data-ingestion.ts',
      'styles/premium-theme.css',
      'public/brand/logo.svg'
    ];

    criticalFiles.forEach(file => {
      this.checkFileExists(file, `Critical file: ${file}`);
    });

    const criticalDirectories = [
      'pages',
      'components',
      'lib',
      'styles',
      'public'
    ];

    criticalDirectories.forEach(dir => {
      this.checkFileExists(dir, `Critical directory: ${dir}`);
    });
  }

  async validateTypeScript() {
    this.log('📝 Validating TypeScript...', 'info');

    // Check TypeScript configuration
    this.checkFileExists('tsconfig.json', 'TypeScript config exists');
    this.checkFileExists('next-env.d.ts', 'Next.js TypeScript definitions');

    // Run TypeScript compiler check
    await this.runCommand('npx tsc --noEmit', 'TypeScript compilation check');
  }

  async validateLinting() {
    this.log('🔍 Validating code quality...', 'info');

    // Check if ESLint config exists
    const eslintConfigs = ['.eslintrc.json', '.eslintrc.js', 'eslint.config.js'];
    let hasEslintConfig = false;

    eslintConfigs.forEach(config => {
      if (fs.existsSync(config)) {
        hasEslintConfig = true;
        this.recordTest('ESLint configuration', true, `Found: ${config}`);
      }
    });

    if (!hasEslintConfig) {
      this.recordTest('ESLint configuration', false, 'No ESLint config found');
    }

    // Run linting if available
    try {
      await this.runCommand('npm run lint', 'ESLint validation');
    } catch (error) {
      this.log('No lint script available, skipping', 'warning');
    }
  }

  async validateBuild() {
    this.log('🚀 Validating build process...', 'info');

    // Clean previous builds
    if (fs.existsSync('.next')) {
      fs.rmSync('.next', { recursive: true });
      this.log('Cleaned previous build directory', 'info');
    }

    // Run production build
    const buildResult = await this.runCommand('npm run build', 'Production build');

    if (buildResult.success) {
      // Check build artifacts
      this.checkFileExists('.next', 'Build directory created');
      this.checkFileExists('.next/static', 'Static assets generated');

      // Check for build manifest
      const manifestPath = '.next/build-manifest.json';
      if (this.checkFileExists(manifestPath, 'Build manifest created')) {
        try {
          const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
          this.recordTest('Build manifest valid', true, `Pages: ${Object.keys(manifest.pages || {}).length}`);
        } catch (error) {
          this.recordTest('Build manifest valid', false, `Parse error: ${error.message}`);
        }
      }
    }

    return buildResult.success;
  }

  validateCopyrightNotices() {
    this.log('©️ Validating copyright notices...', 'info');

    const filesToCheck = [
      'components/Layout.tsx',
      'lib/data-ingestion.ts',
      'lib/performance.ts',
      'styles/premium-theme.css'
    ];

    filesToCheck.forEach(file => {
      this.checkFileContent(file, 'Mark Lindon — BlueSphere', `Copyright notice in ${file}`);
      this.checkFileContent(file, '2025', `Current year in ${file}`);
    });
  }

  async validatePageRoutes() {
    this.log('🛣️ Validating page routes...', 'info');

    const pagesDir = 'pages';
    if (!fs.existsSync(pagesDir)) {
      this.recordTest('Pages directory exists', false, 'Pages directory not found');
      return;
    }

    const pages = fs.readdirSync(pagesDir)
      .filter(file => file.endsWith('.tsx') || file.endsWith('.ts'))
      .filter(file => !file.startsWith('_'));

    this.recordTest('Page count', pages.length > 0, `Found ${pages.length} pages`);

    // Validate each page can be imported
    for (const page of pages) {
      const pagePath = path.join(pagesDir, page);
      const content = fs.readFileSync(pagePath, 'utf8');

      // Check for React import
      const hasReactImport = content.includes('import') && (
        content.includes('react') ||
        content.includes('React') ||
        content.includes('from "react"') ||
        content.includes("from 'react'")
      );

      this.recordTest(`Page ${page} has React import`, hasReactImport,
        hasReactImport ? 'React properly imported' : 'Missing React import');

      // Check for default export
      const hasDefaultExport = content.includes('export default');
      this.recordTest(`Page ${page} has default export`, hasDefaultExport,
        hasDefaultExport ? 'Default export found' : 'Missing default export');
    }
  }

  validateEnvironmentSetup() {
    this.log('🌍 Validating environment setup...', 'info');

    // Check Node.js version
    try {
      const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
      const versionNumber = parseFloat(nodeVersion.slice(1));
      const minVersion = 18.0;

      this.recordTest('Node.js version', versionNumber >= minVersion,
        `Current: ${nodeVersion}, Required: >= ${minVersion}`);
    } catch (error) {
      this.recordTest('Node.js version check', false, `Error: ${error.message}`);
    }

    // Check npm version
    try {
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      this.recordTest('npm version', true, `Version: ${npmVersion}`);
    } catch (error) {
      this.recordTest('npm version check', false, `Error: ${error.message}`);
    }
  }

  async validateAPIEndpoints() {
    this.log('🌐 Validating API endpoints...', 'info');

    // Test NOAA NDBC API accessibility
    try {
      const testUrl = 'https://www.ndbc.noaa.gov/data/realtime2/41001.txt';
      const response = await this.httpGet(testUrl);
      this.recordTest('NOAA NDBC API accessibility', response.statusCode === 200,
        `Status: ${response.statusCode}`);
    } catch (error) {
      this.recordTest('NOAA NDBC API accessibility', false, `Error: ${error.message}`);
    }

    // Test OCEARCH API accessibility
    try {
      const testUrl = 'https://www.ocearch.org/tracker/api/public/search/sharks';
      const response = await this.httpGet(testUrl);
      this.recordTest('OCEARCH API accessibility', response.statusCode === 200,
        `Status: ${response.statusCode}`);
    } catch (error) {
      this.recordTest('OCEARCH API accessibility', false, `Error: ${error.message}`);
    }
  }

  httpGet(url) {
    return new Promise((resolve, reject) => {
      const req = https.get(url, { timeout: 10000 }, (res) => {
        resolve({ statusCode: res.statusCode });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  generateReport() {
    const endTime = Date.now();
    const duration = Math.round((endTime - this.startTime) / 1000);

    this.log('\n📊 TEST HARNESS REPORT', 'info');
    this.log('═'.repeat(50), 'info');
    this.log(`Total Tests: ${this.testResults.length}`, 'info');
    this.log(`Passed: ${this.passedTests}`, 'success');
    this.log(`Failed: ${this.failedTests}`, this.failedTests > 0 ? 'error' : 'success');
    this.log(`Duration: ${duration}s`, 'info');
    this.log(`Success Rate: ${Math.round((this.passedTests / this.testResults.length) * 100)}%`,
      this.failedTests === 0 ? 'success' : 'warning');
    this.log('═'.repeat(50), 'info');

    if (this.failedTests > 0) {
      this.log('\n❌ FAILED TESTS:', 'error');
      this.testResults
        .filter(test => !test.passed)
        .forEach(test => {
          this.log(`  • ${test.testName}: ${test.details}`, 'error');
        });
    }

    // Write detailed report to file
    const reportPath = 'test-harness-report.json';
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.testResults.length,
        passed: this.passedTests,
        failed: this.failedTests,
        duration: duration,
        successRate: Math.round((this.passedTests / this.testResults.length) * 100)
      },
      tests: this.testResults
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    this.log(`\n📄 Detailed report saved to: ${reportPath}`, 'info');

    return this.failedTests === 0;
  }

  async runAllTests() {
    this.log('🚀 Starting BlueSphere Test Harness', 'info');
    this.log(`Working directory: ${process.cwd()}`, 'info');

    try {
      // Environment and setup validation
      this.validateEnvironmentSetup();
      this.validatePackageJson();
      this.validateProjectStructure();

      // Dependencies and code quality
      await this.validateDependencies();
      this.validateCopyrightNotices();

      // Code validation
      await this.validateTypeScript();
      await this.validateLinting();
      this.validatePageRoutes();

      // External dependencies
      await this.validateAPIEndpoints();

      // Final build test
      await this.validateBuild();

    } catch (error) {
      this.log(`Fatal error during testing: ${error.message}`, 'error');
      this.recordTest('Test harness execution', false, `Fatal error: ${error.message}`);
    }

    const success = this.generateReport();

    if (success) {
      this.log('\n🎉 ALL TESTS PASSED! Website is ready for deployment.', 'success');
      process.exit(0);
    } else {
      this.log('\n💥 TESTS FAILED! Please fix issues before deploying.', 'error');
      process.exit(1);
    }
  }
}

// Run the test harness if called directly
if (require.main === module) {
  const harness = new BlueSphereTestHarness();
  harness.runAllTests().catch(error => {
    console.error('Test harness crashed:', error);
    process.exit(1);
  });
}

module.exports = BlueSphereTestHarness;