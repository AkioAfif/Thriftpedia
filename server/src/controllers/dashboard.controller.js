const dashboardService = require('../services/dashboard.service');

async function getSummary(req, res) {
  const data = await dashboardService.getSummary();
  res.status(200).json({
    message: 'Dashboard summary retrieved',
    data,
  });
}

module.exports = { getSummary };