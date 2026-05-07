// frontend/src/components/ResultsDisplay.tsx
'use client';

import { AnalysisResult, Issue, isFrontendAnalysis, isBackendAnalysis } from '@/context/AnalysisContext';
import { AlertCircle, AlertTriangle, Info, Code, FileCode, Zap, Cpu, Eye } from 'lucide-react';
import { useState } from 'react';

interface ResultsDisplayProps {
  result: AnalysisResult;
}

export default function ResultsDisplay({ result }: ResultsDisplayProps) {
  const [expandedIssue, setExpandedIssue] = useState<number | null>(null);

  // Frontend results
  if (result.type === 'frontend' && isFrontendAnalysis(result.data)) {
    const data = result.data;
    return (
      <div className="mt-8 w-full max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Score Cards */}
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <div className="rounded-2xl border border-black/10 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-6 backdrop-blur-xl dark:border-white/10">
            <p className="text-sm text-zinc-500">Performance Score</p>
            <h3 className="mt-2 text-4xl font-bold text-cyan-500">{data.performanceScore}/100</h3>
            <p className="text-xs text-zinc-400 mt-1">Lighthouse: {data.lighthouseScore}/100</p>
          </div>

          <div className="rounded-2xl border border-black/10 bg-black/[0.03] p-6 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.03]">
            <p className="text-sm text-zinc-500">Load Time</p>
            <h3 className="mt-2 text-3xl font-bold">{data.loadTime}</h3>
            <p className="text-xs text-zinc-400">{data.totalSize} · {data.totalRequests} requests</p>
          </div>

          <div className="rounded-2xl border border-black/10 bg-black/[0.03] p-6 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.03]">
            <p className="text-sm text-zinc-500">Core Web Vitals</p>
            <div className="mt-2 space-y-1">
              <p className="text-sm"><span className="text-zinc-400">FCP:</span> {data.metrics.fcp}</p>
              <p className="text-sm"><span className="text-zinc-400">LCP:</span> {data.metrics.lcp}</p>
            </div>
          </div>
        </div>

        {/* Issues List */}
        <div className="rounded-2xl border border-black/10 bg-white/40 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
          <div className="border-b border-black/10 p-6 dark:border-white/10">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-cyan-500" />
              Detected Issues ({data.issues.length})
            </h2>
          </div>

          <div className="divide-y divide-black/10 dark:divide-white/10">
            {data.issues.map((issue: Issue, idx: number) => (
              <div key={idx} className="p-6 hover:bg-black/5 dark:hover:bg-white/5 transition">
                <div 
                  className="flex items-start gap-4 cursor-pointer"
                  onClick={() => setExpandedIssue(expandedIssue === idx ? null : idx)}
                >
                  <div className="flex-shrink-0">
                    {issue.severity === 'critical' && <AlertCircle className="h-5 w-5 text-red-500" />}
                    {issue.severity === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                    {issue.severity === 'info' && <Info className="h-5 w-5 text-blue-500" />}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-semibold">{issue.message}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        issue.severity === 'critical' ? 'bg-red-500/20 text-red-500' :
                        issue.severity === 'warning' ? 'bg-yellow-500/20 text-yellow-500' :
                        'bg-blue-500/20 text-blue-500'
                      }`}>
                        {issue.severity.toUpperCase()}
                      </span>
                      <span className="text-xs text-zinc-400">{issue.type}</span>
                    </div>
                    
                    <p className="text-sm text-zinc-500 mt-1">{issue.location}</p>
                    
                    {expandedIssue === idx && (
                      <div className="mt-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
                        <p className="text-sm"><strong>Impact:</strong> {issue.impact}</p>
                        
                        {issue.currentValue && issue.suggestedValue && (
                          <div className="bg-black/5 dark:bg-white/5 rounded-lg p-3">
                            <p className="text-sm flex justify-between">
                              <span>Current: <span className="text-red-500">{issue.currentValue}</span></span>
                              <span>→</span>
                              <span>Suggested: <span className="text-green-500">{issue.suggestedValue}</span></span>
                            </p>
                          </div>
                        )}
                        
                        <div className="bg-cyan-500/10 rounded-lg p-4 border border-cyan-500/20">
                          <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                            <Code className="h-4 w-4" />
                            Recommendation
                          </p>
                          <p className="text-sm">{issue.recommendation}</p>
                          
                          {issue.codeExample && (
                            <pre className="mt-3 bg-black/50 rounded-lg p-3 text-xs overflow-x-auto">
                              <code>{issue.codeExample}</code>
                            </pre>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <button className="text-zinc-400 hover:text-cyan-500 transition">
                    {expandedIssue === idx ? '▼' : '▶'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {data.recommendations && data.recommendations.length > 0 && (
            <div className="border-t border-black/10 p-6 dark:border-white/10">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-cyan-500" />
                Top Recommendations
              </h3>
              <ul className="space-y-2">
                {data.recommendations.map((rec: string, idx: number) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <span className="text-cyan-500">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Backend results
  if (result.type === 'backend' && isBackendAnalysis(result.data)) {
    const data = result.data;
    return (
      <div className="mt-8 w-full max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Score Cards */}
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <div className="rounded-2xl border border-black/10 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-6 backdrop-blur-xl dark:border-white/10">
            <p className="text-sm text-zinc-500">Health Score</p>
            <h3 className="mt-2 text-4xl font-bold text-cyan-500">{data.healthScore}/100</h3>
          </div>

          <div className="rounded-2xl border border-black/10 bg-black/[0.03] p-6 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.03]">
            <p className="text-sm text-zinc-500">Response Time</p>
            <h3 className="mt-2 text-3xl font-bold">{data.responseTime}</h3>
            <p className="text-xs text-zinc-400">Avg: {data.averageResponseTime}</p>
          </div>

          <div className="rounded-2xl border border-black/10 bg-black/[0.03] p-6 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.03]">
            <p className="text-sm text-zinc-500">Response Size</p>
            <h3 className="mt-2 text-3xl font-bold">{data.responseSize}</h3>
            <p className="text-xs text-zinc-400">Status: {data.status} {data.statusText}</p>
          </div>
        </div>

        {/* Issues List */}
        <div className="rounded-2xl border border-black/10 bg-white/40 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
          <div className="border-b border-black/10 p-6 dark:border-white/10">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Cpu className="h-5 w-5 text-cyan-500" />
              API Issues ({data.issues.length})
            </h2>
          </div>

          <div className="divide-y divide-black/10 dark:divide-white/10">
            {data.issues.map((issue: Issue, idx: number) => (
              <div key={idx} className="p-6 hover:bg-black/5 dark:hover:bg-white/5 transition">
                <div 
                  className="flex items-start gap-4 cursor-pointer"
                  onClick={() => setExpandedIssue(expandedIssue === idx ? null : idx)}
                >
                  <div className="flex-shrink-0">
                    {issue.severity === 'critical' && <AlertCircle className="h-5 w-5 text-red-500" />}
                    {issue.severity === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                    {issue.severity === 'info' && <Info className="h-5 w-5 text-blue-500" />}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-semibold">{issue.message}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        issue.severity === 'critical' ? 'bg-red-500/20 text-red-500' :
                        issue.severity === 'warning' ? 'bg-yellow-500/20 text-yellow-500' :
                        'bg-blue-500/20 text-blue-500'
                      }`}>
                        {issue.severity.toUpperCase()}
                      </span>
                      <span className="text-xs text-zinc-400">{issue.type}</span>
                    </div>
                    
                    <p className="text-sm text-zinc-500 mt-1">{issue.location}</p>
                    
                    {expandedIssue === idx && (
                      <div className="mt-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
                        <p className="text-sm"><strong>Impact:</strong> {issue.impact}</p>
                        
                        {issue.currentValue && issue.suggestedValue && (
                          <div className="bg-black/5 dark:bg-white/5 rounded-lg p-3">
                            <p className="text-sm flex justify-between">
                              <span>Current: <span className="text-red-500">{issue.currentValue}</span></span>
                              <span>→</span>
                              <span>Suggested: <span className="text-green-500">{issue.suggestedValue}</span></span>
                            </p>
                          </div>
                        )}
                        
                        <div className="bg-cyan-500/10 rounded-lg p-4 border border-cyan-500/20">
                          <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            Recommendation
                          </p>
                          <p className="text-sm">{issue.recommendation}</p>
                          
                          {issue.codeExample && (
                            <pre className="mt-3 bg-black/50 rounded-lg p-3 text-xs overflow-x-auto">
                              <code>{issue.codeExample}</code>
                            </pre>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <button className="text-zinc-400 hover:text-cyan-500 transition">
                    {expandedIssue === idx ? '▼' : '▶'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {data.recommendations && data.recommendations.length > 0 && (
            <div className="border-t border-black/10 p-6 dark:border-white/10">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <FileCode className="h-4 w-4 text-cyan-500" />
                Optimization Suggestions
              </h3>
              <ul className="space-y-2">
                {data.recommendations.map((rec: string, idx: number) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <span className="text-cyan-500">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Fallback for any other case
  return null;
}