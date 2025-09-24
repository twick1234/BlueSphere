#!/usr/bin/env node

/**
 * BlueSphere Test Coverage Runner
 * Comprehensive test execution with coverage analysis and reporting
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestCoverageRunner {
  constructor() {
    this.rootDir = path.join(__dirname, '..');
    this.coverageDir = path.join(this.rootDir, 'coverage');
    this.testsDir = path.join(this.rootDir, '__tests__');
  }

  // Run all tests with coverage
  async runFullCoverage() {
    console.log('🧪 Running BlueSphere Test Suite with Coverage Analysis\n');

    try {
      console.log('📊 Executing comprehensive test suite...');

      const result = execSync('npm test -- --coverage --verbose', {
        cwd: this.rootDir,
        stdio: 'inherit'
      });

      console.log('\n✅ Test execution completed successfully!');

      // Analyze coverage results
      await this.analyzeCoverage();

      // Generate coverage report
      await this.generateReport();

    } catch (error) {
      console.error('\n❌ Test execution failed:', error.message);
      process.exit(1);
    }
  }

  // Run specific test categories
  async runCategory(category) {
    const categories = {
      unit: '__tests__/lib/',
      integration: '__tests__/integration/',
      performance: '__tests__/integration/performance-memory.test.ts',
      validation: '__tests__/lib/api-validation.test.ts',
      cache: '__tests__/lib/marineDataCache.test.ts',
      marine: '__tests__/lib/marine-data-processing.test.ts'
    };

    if (!categories[category]) {
      console.error(`❌ Unknown category: ${category}`);
      console.log('Available categories:', Object.keys(categories).join(', '));
      process.exit(1);
    }

    console.log(`🧪 Running ${category} tests with coverage...\n`);

    try {
      execSync(`npm test ${categories[category]} -- --coverage`, {
        cwd: this.rootDir,
        stdio: 'inherit'
      });

      console.log(`\n✅ ${category} tests completed successfully!`);
    } catch (error) {
      console.error(`\n❌ ${category} tests failed:`, error.message);
      process.exit(1);
    }
  }

  // Analyze coverage results
  async analyzeCoverage() {
    const coverageFile = path.join(this.coverageDir, 'coverage-summary.json');

    if (!fs.existsSync(coverageFile)) {
      console.log('📊 Coverage summary not found, generating...');
      return;
    }

    try {
      const coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));

      console.log('\n📊 Coverage Analysis:');
      console.log('=' .repeat(50));

      // Overall coverage
      const total = coverage.total;
      console.log(`Overall Coverage:`);
      console.log(`  Lines:      ${total.lines.pct}% (${total.lines.covered}/${total.lines.total})`);
      console.log(`  Functions:  ${total.functions.pct}% (${total.functions.covered}/${total.functions.total})`);
      console.log(`  Branches:   ${total.branches.pct}% (${total.branches.covered}/${total.branches.total})`);
      console.log(`  Statements: ${total.statements.pct}% (${total.statements.covered}/${total.statements.total})`);

      // Check if coverage meets targets
      const targets = {
        lines: 90,
        functions: 90,
        branches: 85,
        statements: 90
      };

      console.log('\n🎯 Coverage Target Analysis:');
      const results = {};
      for (const [metric, target] of Object.entries(targets)) {
        const actual = total[metric].pct;
        const meets = actual >= target;
        results[metric] = { actual, target, meets };

        const status = meets ? '✅' : '❌';
        console.log(`  ${metric}: ${status} ${actual}% (target: ${target}%)`);
      }

      // Utility functions specific analysis
      console.log('\n🔧 Utility Functions Coverage:');
      const libFiles = Object.keys(coverage).filter(file => file.includes('/lib/'));

      if (libFiles.length > 0) {
        let libTotal = { lines: 0, functions: 0, branches: 0, statements: 0 };
        let libCovered = { lines: 0, functions: 0, branches: 0, statements: 0 };

        libFiles.forEach(file => {
          const fileCov = coverage[file];
          Object.keys(libTotal).forEach(metric => {
            libTotal[metric] += fileCov[metric].total;
            libCovered[metric] += fileCov[metric].covered;
          });
        });

        Object.keys(libTotal).forEach(metric => {
          const pct = libTotal[metric] > 0 ? Math.round((libCovered[metric] / libTotal[metric]) * 100) : 0;
          const status = pct >= 95 ? '✅' : '❌';
          console.log(`  ${metric}: ${status} ${pct}% (${libCovered[metric]}/${libTotal[metric]})`);
        });
      }

      // File-by-file coverage for low coverage files
      console.log('\n📋 Files Needing Attention (<90% coverage):');
      const lowCoverageFiles = Object.entries(coverage)
        .filter(([file, data]) =>
          file !== 'total' &&
          data.lines &&
          data.lines.pct < 90
        )
        .sort(([,a], [,b]) => a.lines.pct - b.lines.pct);

      if (lowCoverageFiles.length === 0) {
        console.log('  🎉 All files meet coverage targets!');
      } else {
        lowCoverageFiles.slice(0, 10).forEach(([file, data]) => {
          const relativePath = file.replace(this.rootDir, '').replace(/^\//, '');
          console.log(`  📄 ${relativePath}: ${data.lines.pct}%`);
        });

        if (lowCoverageFiles.length > 10) {
          console.log(`  ... and ${lowCoverageFiles.length - 10} more files`);
        }
      }

    } catch (error) {
      console.error('❌ Error analyzing coverage:', error.message);
    }
  }

  // Generate comprehensive coverage report
  async generateReport() {
    console.log('\n📋 Generating Coverage Reports...');

    const reportTypes = [
      { type: 'html', description: 'HTML Report' },
      { type: 'lcov', description: 'LCOV Report' },
      { type: 'text', description: 'Text Summary' }
    ];

    reportTypes.forEach(({ type, description }) => {
      const outputPath = type === 'html'
        ? path.join(this.coverageDir, 'lcov-report/index.html')
        : path.join(this.coverageDir, `${type}.info`);

      if (fs.existsSync(outputPath)) {
        console.log(`  ✅ ${description}: ${outputPath}`);
      } else {
        console.log(`  ❌ ${description}: Not generated`);
      }
    });

    // Open HTML report if available
    const htmlReport = path.join(this.coverageDir, 'lcov-report/index.html');
    if (fs.existsSync(htmlReport)) {
      console.log(`\n🌐 Open HTML report: file://${htmlReport}`);
    }
  }

  // Run performance benchmarks
  async runPerformanceBenchmarks() {
    console.log('⚡ Running Performance Benchmarks...\n');

    const benchmarkTests = [
      '__tests__/integration/performance-memory.test.ts',
      '__tests__/lib/marineDataCache.test.ts',
      '__tests__/lib/performance.test.ts'
    ];

    for (const test of benchmarkTests) {
      console.log(`📊 Benchmarking: ${test}`);

      try {
        execSync(`npm test ${test} -- --verbose`, {
          cwd: this.rootDir,
          stdio: 'inherit'
        });
      } catch (error) {
        console.error(`❌ Benchmark failed for ${test}:`, error.message);
      }
    }
  }

  // Memory leak detection
  async runMemoryTests() {
    console.log('🧠 Running Memory Leak Detection Tests...\n');

    try {
      // Run with increased memory monitoring
      execSync('node --expose-gc node_modules/.bin/jest __tests__/integration/performance-memory.test.ts --detectOpenHandles', {
        cwd: this.rootDir,
        stdio: 'inherit',
        env: { ...process.env, NODE_OPTIONS: '--expose-gc' }
      });

      console.log('\n✅ Memory tests completed successfully!');
    } catch (error) {
      console.error('\n❌ Memory tests failed:', error.message);
    }
  }

  // Generate test statistics
  async generateStats() {
    console.log('📈 Generating Test Statistics...\n');

    try {
      // Count test files
      const testFiles = this.countTestFiles();

      // Run tests and capture output
      const testOutput = execSync('npm test -- --passWithNoTests --verbose', {
        cwd: this.rootDir,
        encoding: 'utf8'
      });

      // Parse test results
      const stats = this.parseTestOutput(testOutput);

      console.log('📊 Test Suite Statistics:');
      console.log('=' .repeat(40));
      console.log(`Total Test Files: ${testFiles.total}`);
      console.log(`  Unit Tests: ${testFiles.unit}`);
      console.log(`  Integration Tests: ${testFiles.integration}`);
      console.log(`  Utility Tests: ${testFiles.utils}`);

      if (stats) {
        console.log(`\nTest Execution Results:`);
        console.log(`  Total Tests: ${stats.total || 'N/A'}`);
        console.log(`  Passed: ${stats.passed || 'N/A'}`);
        console.log(`  Failed: ${stats.failed || 0}`);
        console.log(`  Skipped: ${stats.skipped || 0}`);
      }

    } catch (error) {
      console.error('❌ Error generating stats:', error.message);
    }
  }

  // Count test files by category
  countTestFiles() {
    const count = (dir) => {
      if (!fs.existsSync(dir)) return 0;
      return fs.readdirSync(dir)
        .filter(file => file.endsWith('.test.ts') || file.endsWith('.test.tsx'))
        .length;
    };

    return {
      total: count(this.testsDir) + count(path.join(this.testsDir, 'lib')) +
             count(path.join(this.testsDir, 'integration')) + count(path.join(this.testsDir, 'utils')),
      unit: count(path.join(this.testsDir, 'lib')),
      integration: count(path.join(this.testsDir, 'integration')),
      utils: count(path.join(this.testsDir, 'utils'))
    };
  }

  // Parse Jest output for statistics
  parseTestOutput(output) {
    try {
      const lines = output.split('\n');
      const summaryLine = lines.find(line => line.includes('Tests:') && line.includes('passed'));

      if (!summaryLine) return null;

      const match = summaryLine.match(/(\d+)\s+passed(?:,\s+(\d+)\s+failed)?(?:,\s+(\d+)\s+skipped)?/);
      if (!match) return null;

      return {
        passed: parseInt(match[1]),
        failed: match[2] ? parseInt(match[2]) : 0,
        skipped: match[3] ? parseInt(match[3]) : 0,
        total: parseInt(match[1]) + (match[2] ? parseInt(match[2]) : 0) + (match[3] ? parseInt(match[3]) : 0)
      };
    } catch (error) {
      return null;
    }
  }

  // Print usage information
  printUsage() {
    console.log(`
🧪 BlueSphere Test Coverage Runner

Usage: node scripts/test-coverage.js [command]

Commands:
  full            Run full test suite with coverage (default)
  unit            Run unit tests only
  integration     Run integration tests only
  performance     Run performance benchmarks
  memory          Run memory leak detection tests
  stats           Generate test statistics
  help            Show this help message

Categories:
  unit            All utility function tests (__tests__/lib/)
  integration     Integration and workflow tests
  performance     Performance-specific tests
  validation      API validation tests
  cache           Cache management tests
  marine          Marine data processing tests

Examples:
  node scripts/test-coverage.js full
  node scripts/test-coverage.js unit
  node scripts/test-coverage.js performance
  node scripts/test-coverage.js stats
`);
  }
}

// Main execution
async function main() {
  const runner = new TestCoverageRunner();
  const command = process.argv[2] || 'full';

  switch (command) {
    case 'full':
      await runner.runFullCoverage();
      break;
    case 'unit':
    case 'integration':
    case 'performance':
    case 'validation':
    case 'cache':
    case 'marine':
      await runner.runCategory(command);
      break;
    case 'benchmarks':
      await runner.runPerformanceBenchmarks();
      break;
    case 'memory':
      await runner.runMemoryTests();
      break;
    case 'stats':
      await runner.generateStats();
      break;
    case 'help':
    case '--help':
    case '-h':
      runner.printUsage();
      break;
    default:
      console.error(`❌ Unknown command: ${command}`);
      runner.printUsage();
      process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = TestCoverageRunner;