const express = require('express')
const router = express.Router()
const { getDashboard } = require('./student.controller')
const { verifyToken } = require('../../middlewares/auth.middleware')
const { authorizeRoles } = require('../../middlewares/role.middleware')

// GET /api/v1/student/dashboard
router.get('/dashboard', 
  verifyToken, 
  authorizeRoles('STUDENT'), 
  getDashboard
)

module.exports = router
