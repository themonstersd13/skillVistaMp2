const express = require('express');
const ApiResponse = require('../../utils/apiResponse');

const router = express.Router();

router.get('/', (req, res) => {
  return ApiResponse.success(
    res,
    {
      service: 'SkillVista Backend',
      status: 'ok',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
    'Health check passed.'
  );
});

module.exports = router;
