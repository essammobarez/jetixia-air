import express from 'express';
import { SabreTestController } from './sabre-test.controller';

const router = express.Router();

/**
 * Sabre Test Routes
 * Test Sabre API integration
 */

// Test authentication only
router.get('/auth', SabreTestController.testAuth);

// Test connection (auth + simple API call)
router.get('/connection', SabreTestController.testConnection);

// Test flight search
router.get('/flight-search', SabreTestController.testFlightSearch);

// Run all tests
router.get('/all', SabreTestController.testAll);

// Debug credentials
router.get('/debug', SabreTestController.debugCredentials);

export const SabreTestRoutes = router;

