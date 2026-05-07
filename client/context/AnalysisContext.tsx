// frontend/src/context/AnalysisContext.tsx
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { api } from '@/config/api';

// Export the Issue interface (renamed from DetailedIssue for compatibility)
export interface Issue {
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

// Export detailed interfaces
export interface ImageMetric {
  url: string;
  size: number;
  duration: number;
}

export interface ResourceMetric {
  url: string;
  duration: number;
  type: string;
}

// Frontend Analysis Result
export interface FrontendAnalysis {
  url: string;
  performanceScore: number;
  lighthouseScore: number;
  loadTime: string;
  totalSize: string;
  totalRequests: number;
  metrics: {
    fcp: string;
    lcp: string;
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
  };
  issues: Issue[];
  largestImage: ImageMetric | null;
  slowestResource: ResourceMetric | null;
  recommendations: string[];
}

// Backend Analysis Result
export interface BackendAnalysis {
  endpoint: string;
  status: number;
  statusText: string;
  responseTime: string;
  averageResponseTime: string;
  responseSize: string;
  healthScore: number;
  issues: Issue[];
  headers: {
    contentType?: string;
    cacheControl?: string;
    server?: string;
  };
  recommendations: string[];
  timestamp: string;
}

// Combined Analysis Result
export interface AnalysisResult {
  success: boolean;
  type: 'frontend' | 'backend';
  data: FrontendAnalysis | BackendAnalysis;
}

// Type guard functions
export function isFrontendAnalysis(data: FrontendAnalysis | BackendAnalysis): data is FrontendAnalysis {
  return (data as FrontendAnalysis).performanceScore !== undefined;
}

export function isBackendAnalysis(data: FrontendAnalysis | BackendAnalysis): data is BackendAnalysis {
  return (data as BackendAnalysis).healthScore !== undefined;
}

interface AnalysisContextType {
  isLoading: boolean;
  result: AnalysisResult | null;
  error: string | null;
  analyzeFrontend: (url: string) => Promise<void>;
  analyzeBackend: (endpoint: string) => Promise<void>;
  clearResult: () => void;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeFrontend = async (url: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.analyze.frontend(url);
      setResult({
        success: true,
        type: 'frontend',
        data: response.data as FrontendAnalysis,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to analyze frontend';
      setError(message);
      console.error('Analysis error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeBackend = async (endpoint: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.analyze.backend(endpoint);
      setResult({
        success: true,
        type: 'backend',
        data: response.data as BackendAnalysis,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to analyze backend';
      setError(message);
      console.error('Analysis error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const clearResult = () => {
    setResult(null);
    setError(null);
  };

  return (
    <AnalysisContext.Provider value={{
      isLoading,
      result,
      error,
      analyzeFrontend,
      analyzeBackend,
      clearResult
    }}>
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const context = useContext(AnalysisContext);
  if (!context) {
    throw new Error('useAnalysis must be used within AnalysisProvider');
  }
  return context;
}