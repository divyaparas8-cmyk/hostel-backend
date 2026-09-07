const express = require('express');
const cors = require('cors');

// Import routes
const authRoutes = require('./modules/auth/auth.routes');
const adminRoutes = require('./modules/admin/admin.routes');
const hostelRoutes = require('./modules/hostel/hostel.routes');
const roomRoutes = require('./modules/room/room.routes');
const bookingRoutes = require('./modules/booking/booking.routes');
const rentRoutes = require('./modules/rent/rent.routes');
const maintenanceRoutes = require('./modules/maintenance/maintenance.routes');
const messRoutes = require('./modules/mess/mess.routes');
const noticeRoutes = require('./modules/notice/notice.routes');
const gatepassRoutes = require('./modules/gatepass/gatepass.routes');
const visitorRoutes = require('./modules/visitor/visitor.routes');
const requestRoutes = require('./modules/request/request.routes');

// New modules
const settingsRoutes = require('./modules/admin/settings/settings.routes');
const facilitiesRoutes = require('./modules/facilities/facilities.routes');
const complianceRoutes = require('./modules/compliance/compliance.routes');
const communicationRoutes = require('./modules/communication/communication.routes');
const notificationRoutes = require('./modules/notification/notification.routes');

// Add new owner and student routes
const ownerRoutes = require('./modules/owner/owner.routes')
const studentRoutes = require('./modules/student/student.routes')

const app = express();

// Middlewares
const corsOptions = {
  origin: function (origin, callback) {
    callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}
app.use(cors(corsOptions))
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Root route
app.get('/', (req, res) => {
  res.json({ message: "HMS API is running", version: "1.0.0" });
});

// Mount routes
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/admin', adminRoutes)
app.use('/api/v1/admin/settings', settingsRoutes)
app.use('/api/v1/hostels', hostelRoutes)
app.use('/api/v1/rooms', roomRoutes)
app.use('/api/v1/bookings', bookingRoutes)
app.use('/api/v1/rent', rentRoutes)
app.use('/api/v1/maintenance', maintenanceRoutes)
app.use('/api/v1/mess', messRoutes)
app.use('/api/v1/notices', noticeRoutes)
app.use('/api/v1/gatepasses', gatepassRoutes)
app.use('/api/v1/visitors', visitorRoutes)
app.use('/api/v1/requests', requestRoutes)
app.use('/api/v1/facilities', facilitiesRoutes)
app.use('/api/v1/compliance', complianceRoutes)
app.use('/api/v1/communications', communicationRoutes)
app.use('/api/v1/owner', ownerRoutes)
app.use('/api/v1/student', studentRoutes)

// Keeping notifications route that wasn't strictly in the list but was there previously
app.use('/api/v1/notifications', notificationRoutes)

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

module.exports = app;
