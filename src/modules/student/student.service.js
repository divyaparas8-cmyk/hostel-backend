const prisma = require('../../config/db')

// Get complete student dashboard data in one API call
const getStudentDashboard = async (studentId) => {
  
  // Step 1: Find active booking with all details
  const activeBooking = await prisma.booking.findFirst({
    where: {
      studentId: parseInt(studentId),
      status: 'APPROVED'
    },
    include: {
      bed: {
        include: {
          room: {
            include: {
              hostel: {
                select: {
                  id: true,
                  name: true,
                  address: true,
                  city: true,
                  state: true
                }
              }
            }
          }
        }
      }
    }
  })

  // If no active booking, return limited data
  if (!activeBooking) {
    return {
      active_booking: null,
      upcoming_rent: null,
      todays_meal: null,
      unread_notices: 0,
      open_complaints: 0,
      pending_gatepasses: 0,
      unread_communications: 0
    }
  }

  const hostelId = activeBooking.bed.room.hostel.id

  // Step 2: Get today's day of week for mess menu
  const days = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY',
                 'THURSDAY','FRIDAY','SATURDAY']
  const todayDay = days[new Date().getDay()]

  // Step 3: Run all queries in parallel for performance
  const [
    upcomingRent,
    todaysMeals,
    unreadNoticesCount,
    openComplaints,
    pendingGatepasses,
    unreadCommunications
  ] = await Promise.all([
    
    // Next pending rent payment
    prisma.rentPayment.findFirst({
      where: {
        studentId: parseInt(studentId),
        paymentStatus: 'PENDING'
      },
      orderBy: { dueDate: 'asc' }
    }),

    // Today's mess menu
    prisma.messMenu.findMany({
      where: {
        hostelId: hostelId,
        day: todayDay
      }
    }),

    // Notices in last 7 days
    prisma.notice.count({
      where: {
        hostelId: hostelId,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    }),

    // Open maintenance requests
    prisma.maintenanceRequest.count({
      where: {
        studentId: parseInt(studentId),
        status: 'OPEN'
      }
    }),

    // Pending gate passes
    prisma.gatePass.count({
      where: {
        studentId: parseInt(studentId),
        status: 'PENDING'
      }
    }),

    // Unread communications
    prisma.communication.count({
      where: {
        hostelId: hostelId,
        readReceipts: {
          none: {
            studentId: parseInt(studentId)
          }
        }
      }
    })
  ])

  // Format today's meals as object
  const todaysMealMap = {}
  todaysMeals.forEach(meal => {
    todaysMealMap[meal.mealType] = {
      items: meal.items,
      timing: meal.timing
    }
  })

  return {
    active_booking: {
      id: activeBooking.id,
      hostel: activeBooking.bed.room.hostel,
      room_number: activeBooking.bed.room.roomNumber,
      bed_number: activeBooking.bed.bedNumber,
      floor: activeBooking.bed.room.floor,
      price_per_month: activeBooking.bed.room.pricePerMonth,
      check_in_date: activeBooking.checkInDate
    },
    upcoming_rent: upcomingRent,
    todays_meal: todaysMealMap,
    unread_notices: unreadNoticesCount,
    open_complaints: openComplaints,
    pending_gatepasses: pendingGatepasses,
    unread_communications: unreadCommunications
  }
}

module.exports = { getStudentDashboard }
