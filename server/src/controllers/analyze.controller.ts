// server/src/controllers/analyze.controller.ts
import { Request, Response } from 'express';
import { runFrontendAnalysis, runBackendAnalysis } from '../services/performance.service';
import { asyncHandler } from '../utils/asyncHandler';

export const analyzeFrontend = asyncHandler(async (req: Request, res: Response) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({
      success: false,
      message: 'URL is required'
    });
  }
  
  // Validate URL format
  try {
    new URL(url);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid URL format. Please include http:// or https://'
    });
  }
  
  const result = await runFrontendAnalysis(url);
  
  res.status(200).json({
    success: true,
    type: 'frontend',
    data: result
  });
});

export const analyzeBackend = asyncHandler(async (req: Request, res: Response) => {
  const { endpoint } = req.body;
  
  if (!endpoint) {
    return res.status(400).json({
      success: false,
      message: 'Endpoint URL is required'
    });
  }
  
  // Validate URL format
  try {
    new URL(endpoint);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid endpoint URL format. Please include http:// or https://'
    });
  }
  
  const result = await runBackendAnalysis(endpoint);
  
  res.status(200).json({
    success: true,
    type: 'backend',
    data: result
  });
});