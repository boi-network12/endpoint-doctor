// server/src/services/performance.service.ts

import axios from 'axios';
import * as puppeteer from 'puppeteer';
import * as chromeLauncher from 'chrome-launcher';
import os from 'os';
import path from 'path';
import fs from 'fs';

export interface DetailedIssue {
  type: 'image' | 'css' | 'javascript' | 'html' | 'network' | 'server' | 'database' | 'api';
  severity: 'critical' | 'warning' | 'info';
  location: string;
  message: string;
  impact: string;
  recommendation: string;
  currentValue?: string;
  suggestedValue?: string;
  codeExample?: string;
}


export const runFrontendAnalysis = async (url: string) => {
  let chrome: any = null;
  let browser: puppeteer.Browser | null = null;

  // Use os.tmpdir() for better cross-platform compatibility
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(7);
  const customTempDir = path.join(os.tmpdir(), `lighthouse-analysis-${timestamp}-${randomId}`);
  
  // Ensure temp directory exists
  if (!fs.existsSync(customTempDir)) {
    fs.mkdirSync(customTempDir, { recursive: true });
  }

  // Set environment variables for temp directories
  process.env.TMPDIR = customTempDir;
  process.env.TEMP = customTempDir;
  process.env.TMP = customTempDir;

  try {
    // Launch Chrome with Windows-optimized flags
    chrome = await chromeLauncher.launch({
      chromeFlags: [
        '--headless=new',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--disable-background-networking',
        '--no-default-browser-check',
        '--disable-default-apps',
        '--disable-features=VizDisplayCompositor',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-breakpad',
        '--disable-sync',
        '--disable-component-extensions-with-background-pages',
        '--disable-extensions',
        '--disable-logging',
        '--log-level=3',
        '--silent-debugger-extension-api',
        '--disable-features=Translate,OptimizationHints,MediaRouter',
        `--user-data-dir=${path.join(customTempDir, 'chrome-profile')}`,
        '--disk-cache-dir=' + path.join(customTempDir, 'cache'),
      ],
      logLevel: 'error' as const,
    });

    // Connect puppeteer
    browser = await puppeteer.connect({
      browserURL: `http://localhost:${chrome.port}`,
      defaultViewport: null,
    });

    const page = await browser.newPage();

    // Set timeouts
    await page.setDefaultNavigationTimeout(60000);
    await page.setDefaultTimeout(60000);
    await page.setViewport({ width: 1920, height: 1080 });

    // Set user agent
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36'
    );

    // Remove webdriver flag
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    // Track network requests
    const networkRequests: Array<{
      url: string;
      resourceType: string;
      size: number;
      status?: number;
    }> = [];

    page.on('request', (request) => {
      networkRequests.push({
        url: request.url(),
        resourceType: request.resourceType(),
        size: 0,
      });
    });

    page.on('response', async (response) => {
      const req = networkRequests.find((r) => r.url === response.url());
      if (req) {
        try {
          const buffer = await response.buffer().catch(() => null);
          req.size = buffer?.length || 0;
          req.status = response.status();
        } catch (_) {}
      }
    });

    console.log(`🚀 Analyzing: ${url}`);

    // Navigate to URL
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });

    // Wait for dynamic content
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Get page metrics
    const metrics = await page.evaluate(() => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paintData = performance.getEntriesByType('paint');
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

      const totalSize = resources.reduce((sum, r) => sum + (r.transferSize || 0), 0);

      return {
        loadTime: perfData?.loadEventEnd && perfData?.loadEventStart ? 
          perfData.loadEventEnd - perfData.loadEventStart : 0,
        totalSize,
        totalResources: resources.length,
        fcp: paintData.find((p) => p.name === 'first-contentful-paint')?.startTime || 0,
        lcp: (performance as any).getEntriesByType('largest-contentful-paint')?.[0]?.startTime ||
          (perfData?.loadEventEnd - perfData?.loadEventStart) || 0,
        imageCount: document.querySelectorAll('img').length,
        scriptCount: document.querySelectorAll('script[src]').length,
        stylesheetCount: document.querySelectorAll('link[rel="stylesheet"]').length,
      };
    });

    const htmlContent = await page.content();
    const htmlSize = Buffer.byteLength(htmlContent, 'utf8');

    // Run Lighthouse analysis (with error handling)
    let lighthouseMetrics = {
      performance: 0,
      accessibility: 0,
      bestPractices: 0,
      seo: 0,
    };

    try {
      const lighthouse = (await import('lighthouse')).default;
      
      // Create a custom report directory that won't conflict
      const lighthouseReportDir = path.join(customTempDir, 'reports');
      if (!fs.existsSync(lighthouseReportDir)) {
        fs.mkdirSync(lighthouseReportDir, { recursive: true });
      }

      const flags = {
        port: chrome.port,
        output: 'json' as const,
        logLevel: 'error' as const,
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        // Critical: Disable saving to disk to avoid permission issues
        outputPath: false as any,
      };

      const config = {
        extends: 'lighthouse:default',
        settings: {
          maxWaitForLoad: 60000,
          throttling: {
            cpuSlowdownMultiplier: 1,
            downloadThroughputKbps: 10240,
            uploadThroughputKbps: 3072,
            rttMs: 40,
          },
          disableStorageReset: true,
          skipAudits: ['screenshot-thumbnails', 'final-screenshot'],
          // Prevent Lighthouse from creating files
          disableDeviceScreenEmulation: false,
          emulatedUserAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      };

      const lighthouseResult = await lighthouse(url, flags, config);

      if (lighthouseResult?.lhr) {
        const lhr = lighthouseResult.lhr;
        lighthouseMetrics = {
          performance: lhr.categories.performance?.score || 0,
          accessibility: lhr.categories.accessibility?.score || 0,
          bestPractices: lhr.categories['best-practices']?.score || 0,
          seo: lhr.categories.seo?.score || 0,
        };
      }
    } catch (lighthouseError: any) {
      console.warn('Lighthouse warning (continuing with basic metrics):', lighthouseError?.message || lighthouseError);
    }

    // Detect issues
    const issues: DetailedIssue[] = [];

    // Load time issues
    if (metrics.loadTime > 8000 && metrics.loadTime !== 0) {
      issues.push({
        type: 'network',
        severity: 'critical',
        location: url,
        message: 'Page took too long to load',
        impact: 'Poor user experience and high bounce rate',
        recommendation: 'Optimize server response time, enable caching, and reduce page weight',
        currentValue: `${(metrics.loadTime / 1000).toFixed(2)}s`,
        suggestedValue: '< 3s',
      });
    }

    // HTML size issues
    if (htmlSize > 1024 * 100) {
      const sizeKB = (htmlSize / 1024).toFixed(1);
      issues.push({
        type: 'html',
        severity: htmlSize > 1024 * 500 ? 'critical' : 'warning',
        location: 'HTML Document',
        message: `Large HTML document (${sizeKB}KB)`,
        impact: 'Increases download and parsing time',
        recommendation: 'Minify HTML and remove unnecessary content',
        currentValue: `${sizeKB}KB`,
        suggestedValue: '< 50KB',
      });
    }

    // Large images
    const largeImages = networkRequests
      .filter((r) => r.resourceType === 'image' && r.size > 500000)
      .sort((a, b) => b.size - a.size);

    largeImages.slice(0, 5).forEach((img) => {
      const sizeMB = (img.size / (1024 * 1024)).toFixed(2);
      issues.push({
        type: 'image',
        severity: Number(sizeMB) > 2 ? 'critical' : 'warning',
        location: img.url,
        message: `Large image (${sizeMB}MB)`,
        impact: 'Significantly slows down page load',
        recommendation: 'Compress images and use modern formats (WebP/AVIF)',
        currentValue: `${sizeMB}MB`,
        suggestedValue: '< 200KB',
      });
    });

    // Render blocking resources
    const renderBlockingCount = networkRequests.filter(
      (r) => (r.resourceType === 'stylesheet' || r.resourceType === 'script') && r.size > 50000
    ).length;

    if (renderBlockingCount > 3) {
      issues.push({
        type: 'network',
        severity: 'warning',
        location: 'Render-blocking resources',
        message: `${renderBlockingCount} render-blocking resources detected`,
        impact: 'Delays First Contentful Paint',
        recommendation: 'Use async/defer for scripts and inline critical CSS',
      });
    }

    // Calculate score
    let performanceScore = 100;
    performanceScore -= issues.filter((i) => i.severity === 'critical').length * 15;
    performanceScore -= issues.filter((i) => i.severity === 'warning').length * 6;
    performanceScore = Math.max(0, Math.min(100, performanceScore));

    const loadTimeSeconds = metrics.loadTime > 0 ? metrics.loadTime / 1000 : 0;

    const result = {
      url,
      performanceScore: Math.round(performanceScore),
      lighthouseScore: Math.round(lighthouseMetrics.performance * 100),
      loadTime: loadTimeSeconds > 0 ? `${loadTimeSeconds.toFixed(2)}s` : 'N/A',
      totalSize: `${(metrics.totalSize / (1024 * 1024)).toFixed(2)}MB`,
      totalRequests: metrics.totalResources,
      metrics: {
        fcp: metrics.fcp > 0 ? `${(metrics.fcp / 1000).toFixed(2)}s` : 'N/A',
        lcp: metrics.lcp > 0 ? `${(metrics.lcp / 1000).toFixed(2)}s` : 'N/A',
        performance: lighthouseMetrics.performance,
        accessibility: lighthouseMetrics.accessibility,
        bestPractices: lighthouseMetrics.bestPractices,
        seo: lighthouseMetrics.seo,
        imageCount: metrics.imageCount,
        scriptCount: metrics.scriptCount,
        stylesheetCount: metrics.stylesheetCount,
      },
      issues: issues.sort((a, b) => {
        const order = { critical: 0, warning: 1, info: 2 };
        return order[a.severity] - order[b.severity];
      }),
      recommendations: generateRecommendations(issues),
    };

    // Close page before cleanup
    await page.close().catch(() => {});

    return result;

  } catch (error: any) {
    console.error('Frontend Analysis Error:', error);

    return {
      url,
      performanceScore: 0,
      lighthouseScore: 0,
      loadTime: 'N/A',
      totalSize: 'N/A',
      totalRequests: 0,
      metrics: {
        fcp: 'N/A', lcp: 'N/A',
        performance: 0, accessibility: 0, bestPractices: 0, seo: 0,
        imageCount: 0, scriptCount: 0, stylesheetCount: 0,
      },
      issues: [{
        type: 'network',
        severity: 'critical',
        location: url,
        message: 'Analysis failed: ' + (error.message || 'Unknown error'),
        impact: 'Could not complete performance analysis',
        recommendation: 'Make sure the website is publicly accessible and try again',
        currentValue: error.message || 'Unknown error',
      }],
      recommendations: ['Check URL accessibility and try again'],
    };
  } finally {
    // Clean up in reverse order with proper error handling
    if (browser) {
      try { 
        await browser.close(); 
      } catch (e: any) {
        if (!e.message?.includes('already closed')) {
          console.warn('Browser close error:', e.message);
        }
      }
    }

    if (chrome) {
      try {
        await chrome.kill();
        // Windows needs extra time for file handle release
        if (process.platform === 'win32') {
          await new Promise(r => setTimeout(r, 2000));
        }
      } catch (e) {
        console.warn('Error killing Chrome:', e);
      }
    }

    // Wait a bit for processes to fully terminate
    await new Promise(r => setTimeout(r, 1000));
        
      // Windows-specific cleanup with retry and force kill check
      if (process.platform === 'win32') {
        try {
          // Force garbage collection of any lingering handles
          global.gc && global.gc();
          
          // Use a more aggressive cleanup approach on Windows
          const { exec } = require('child_process');
          const util = require('util');
          const execPromise = util.promisify(exec);
          
          // Use Windows command line to force delete
          await execPromise(`rmdir /s /q "${customTempDir}" 2>nul`).catch(() => {});
        } catch (cleanupError) {
          console.warn('Windows cleanup fallback attempted');
        }
      }

      // Clean up temporary directory with retry logic
      let retries = 5;
      let delay = 500;


      while (retries > 0) {
      try {
        if (fs.existsSync(customTempDir)) {
          // On Windows, try to delete individual files first
          if (process.platform === 'win32') {
            const files = fs.readdirSync(customTempDir);
            for (const file of files) {
              try {
                const filePath = path.join(customTempDir, file);
                if (fs.statSync(filePath).isDirectory()) {
                  fs.rmSync(filePath, { recursive: true, force: true });
                } else {
                  fs.unlinkSync(filePath);
                }
              } catch (e) {
                // Ignore individual file errors
              }
            }
          }
          
          // Now try to delete the main directory
          fs.rmSync(customTempDir, { 
            recursive: true, 
            force: true,
            maxRetries: 3,
            retryDelay: 300 
          });
        }
        break;
      } catch (cleanupError: any) {
        retries--;
        if (retries > 0) {
          console.warn(`Cleanup retry (${retries} left):`, cleanupError.message);
          await new Promise(r => setTimeout(r, delay));
          delay *= 1.5; // Exponential backoff
        } else {
          // Mark for deletion on next boot if all else fails
          if (process.platform === 'win32') {
            try {
              const { exec } = require('child_process');
              const util = require('util');
              const execPromise = util.promisify(exec);
              await execPromise(`del /f /q "${customTempDir}"`);
            } catch (finalError) {
              console.warn('⚠️ Could not clean temp dir, will be cleaned on next reboot:', customTempDir);
            }
          } else {
            console.warn('⚠️ Could not fully clean temp dir:', customTempDir);
          }
        }
      }
    }
  }
};

function generateRecommendations(issues: DetailedIssue[]): string[] {
  const recs = new Set<string>();

  // ALWAYS provide recommendations based on actual issues found
  issues.forEach(issue => {
    if (issue.severity === 'critical') {
      recs.add(`⚠️ CRITICAL: ${issue.recommendation}`);
    } else if (issue.severity === 'warning') {
      recs.add(`📌 ${issue.recommendation}`);
    }
  });

  // Add specific recommendations based on issue patterns
  if (issues.some(i => i.message.includes('render-blocking'))) {
    recs.add('🚀 Defer non-critical JavaScript and CSS to improve FCP');
  }
  
  if (issues.some(i => i.type === 'image')) {
    recs.add('🖼️ Implement lazy loading: <img loading="lazy" src="...">');
    recs.add('🎨 Convert images to WebP format for ~30% smaller file sizes');
  }
  
  if (issues.some(i => i.type === 'html' && i.message.includes('Large HTML'))) {
    recs.add('📦 Enable HTML minification on your server (e.g., html-minifier-terser)');
  }

  // If NO issues found at all
  if (recs.size === 0) {
    recs.add('✅ Your website looks well optimized!');
    recs.add('📊 Continue monitoring performance metrics regularly');
  }

  return Array.from(recs).slice(0, 8);
}

// 
export const runBackendAnalysis = async (endpoint: string) => {
  // 
  const issues: DetailedIssue[] = [];
  const startTime = Date.now();

  try {
    const start = Date.now();
    const response = await axios.get(endpoint, {
      timeout: 30000,
      validateStatus: () => true,
    });
    const responseTime = Date.now() - start;

    if (responseTime > 2000) {
      issues.push({
        type: 'api',
        severity: responseTime > 5000 ? 'critical' : 'warning',
        location: endpoint,
        message: `Slow response time: ${responseTime}ms`,
        impact: 'Users experience significant delays when calling this endpoint',
        recommendation: 'Implement caching, optimize database queries, or consider using a CDN',
        currentValue: `${responseTime}ms`,
        suggestedValue: '< 200ms',
        codeExample: `// Redis caching example\nconst cacheKey = \`api:\${req.url}\`;\nlet data = await redis.get(cacheKey);\nif (!data) {\n  data = await fetchFromDatabase();\n  await redis.setex(cacheKey, 300, JSON.stringify(data));\n}\nres.json(data);`,
      });
    }

    if (response.status >= 500) {
      issues.push({
        type: 'server',
        severity: 'critical',
        location: endpoint,
        message: `Server error: ${response.status}`,
        impact: 'The endpoint is failing to respond correctly',
        recommendation: 'Check server logs, implement proper error handling, and add monitoring',
        currentValue: `HTTP ${response.status}`,
        suggestedValue: 'HTTP 200',
      });
    } else if (response.status >= 400) {
      issues.push({
        type: 'api',
        severity: 'warning',
        location: endpoint,
        message: `Client error: ${response.status}`,
        impact: 'The request might be malformed or missing required parameters',
        recommendation: 'Validate request parameters and improve error messages',
        currentValue: `HTTP ${response.status}`,
        suggestedValue: 'HTTP 200',
      });
    }

    const responseSize = JSON.stringify(response.data).length;
    const sizeKB = (responseSize / 1024).toFixed(2);

    if (responseSize > 1024 * 100) {
      issues.push({
        type: 'api',
        severity: responseSize > 1024 * 500 ? 'critical' : 'warning',
        location: endpoint,
        message: `Large response payload: ${sizeKB}KB`,
        impact: 'Large payloads increase transfer time and parse time on client',
        recommendation: 'Implement pagination, field selection, or compression (gzip)',
        currentValue: `${sizeKB}KB`,
        suggestedValue: '< 50KB',
        codeExample: `// GraphQL field selection\nquery {\n  user(id: "123") {\n    id\n    name\n    email\n  }\n}`,
      });
    }

    if (!response.headers['cache-control']) {
      issues.push({
        type: 'network',
        severity: 'info',
        location: 'Response Headers',
        message: 'Missing Cache-Control header',
        impact: 'Responses are not being cached, causing repeated full requests',
        recommendation: 'Add appropriate Cache-Control headers for static or semi-static data',
        codeExample: `res.set('Cache-Control', 'public, max-age=300');`,
      });
    }

    if (
      !response.headers['content-type']?.toString().includes('application/json') &&
      typeof response.data === 'object'
    ) {
      issues.push({
        type: 'server',
        severity: 'warning',
        location: 'Response Headers',
        message: 'Missing or incorrect Content-Type header',
        impact: 'Clients may not properly parse the response',
        recommendation: 'Always set correct Content-Type header for API responses',
        codeExample: `res.setHeader('Content-Type', 'application/json');\nres.json(data);`,
      });
    }

    const timings: number[] = [responseTime];
    for (let i = 0; i < 2; i++) {
      const reqStart = Date.now();
      await axios.get(endpoint, { timeout: 30000 });
      timings.push(Date.now() - reqStart);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const avgTime = timings.reduce((a, b) => a + b, 0) / timings.length;
    const isConsistent = Math.max(...timings) - Math.min(...timings) < 500;

    if (!isConsistent && avgTime > 1000) {
      issues.push({
        type: 'server',
        severity: 'warning',
        location: endpoint,
        message: 'Inconsistent response times detected',
        impact: 'Unstable performance indicates server load or database issues',
        recommendation: 'Investigate server load, database query performance, or implement rate limiting',
        currentValue: `Variance: ${Math.max(...timings) - Math.min(...timings)}ms`,
        suggestedValue: '< 200ms variance',
      });
    }

    const healthScore = Math.max(
      0,
      100 -
        issues.filter((i) => i.severity === 'critical').length * 25 -
        issues.filter((i) => i.severity === 'warning').length * 10 -
        issues.filter((i) => i.severity === 'info').length * 5
    );

    return {
      endpoint,
      status: response.status,
      statusText: response.statusText,
      responseTime: `${responseTime}ms`,
      averageResponseTime: `${Math.round(avgTime)}ms`,
      responseSize: `${sizeKB}KB`,
      healthScore: Math.round(healthScore),
      issues: issues.sort((a, b) => {
        const severityOrder = { critical: 0, warning: 1, info: 2 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      }),
      headers: {
        contentType: response.headers['content-type'],
        cacheControl: response.headers['cache-control'],
        server: response.headers['server'],
      },
      recommendations: generateBackendRecommendations(issues),
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const err = error as any;
    if (err.code === 'ECONNREFUSED') {
      throw new Error(`Cannot connect to ${endpoint}. Server might be down or unreachable.`);
    }
    if (err.code === 'ETIMEDOUT') {
      throw new Error(`Request to ${endpoint} timed out after 30 seconds.`);
    }
    throw error;
  }
};

function generateBackendRecommendations(issues: DetailedIssue[]): string[] {
  const recommendations = new Set<string>();

  for (const issue of issues) {
    if (issue.severity === 'critical') {
      recommendations.add(issue.recommendation);
    }
  }

  if (issues.some((i) => i.type === 'api' && i.message.includes('response time'))) {
    recommendations.add('Implement database indexing and query optimization');
    recommendations.add('Add Redis or Memcached for caching frequent requests');
  }

  if (issues.some((i) => i.message.includes('payload'))) {
    recommendations.add('Enable gzip compression on your server');
    recommendations.add('Implement GraphQL or sparse fields for precise data fetching');
  }

  return Array.from(recommendations).slice(0, 5);
}