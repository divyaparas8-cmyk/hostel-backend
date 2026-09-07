const studentService = require('./student.service')

const getDashboard = async (req, res) => {
  try {
    const dashboard = await studentService.getStudentDashboard(req.user.id)
    return res.status(200).json({
      success: true,
      message: 'Dashboard data fetched successfully',
      data: dashboard
    })
  } catch (error) {
    console.error('Student dashboard error:', error)
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    })
  }
}

module.exports = { getDashboard }
