const prisma = require('../../config/db');

const createRequest = async (studentId, data) => {
  const { hostelId, type, description } = data;

  const validTypes = ['ROOM_CHANGE', 'HOSTEL_SWITCH', 'LATE_ENTRY', 'FACILITY_CHANGE', 'OTHER'];
  if (!validTypes.includes(type)) throw new Error("Invalid request type");

  // Verify active booking
  const activeBooking = await prisma.booking.findFirst({
    where: { studentId: Number(studentId), status: 'APPROVED', bed: { room: { hostelId: Number(hostelId) } } }
  });

  if (!activeBooking) throw new Error("You must have an active booking in this hostel to raise a request");

  return await prisma.request.create({
    data: { studentId: Number(studentId), hostelId: Number(hostelId), type, description }
  });
};

const getStudentRequests = async (studentId) => {
  return await prisma.request.findMany({
    where: { studentId: Number(studentId) },
    include: { hostel: { select: { name: true } } },
    orderBy: { createdAt: 'desc' }
  });
};

const getHostelRequests = async (hostelId, ownerId, filters) => {
  const hostel = await prisma.hostel.findFirst({ where: { id: Number(hostelId), ownerId: Number(ownerId) } });
  if (!hostel) throw new Error("Unauthorized");

  const where = { hostelId: Number(hostelId) };
  if (filters.status) where.status = filters.status;
  if (filters.type) where.type = filters.type;

  return await prisma.request.findMany({
    where,
    include: { student: { select: { name: true, phone: true } } },
    orderBy: { createdAt: 'desc' }
  });
};

const updateRequestStatus = async (requestId, ownerId, status, ownerNote) => {
  const request = await prisma.request.findUnique({ where: { id: Number(requestId) } });
  if (!request) throw new Error("Request not found");

  const hostel = await prisma.hostel.findFirst({ where: { id: request.hostelId, ownerId: Number(ownerId) } });
  if (!hostel) throw new Error("Unauthorized");

  const updatedReq = await prisma.request.update({
    where: { id: Number(requestId) },
    data: { status, ownerNote }
  });

  // Apply facility changes to the student's booking if approved
  if (status === 'APPROVED' && request.type === 'FACILITY_CHANGE') {
    const desc = request.description;
    const actionMatch = desc.match(/Request to (Add|Remove|Update) (\w+)/);
    
    if (actionMatch) {
      const action = actionMatch[1]; // Add, Remove, Update
      const facilityName = actionMatch[2]; // AC, WiFi, Laundry, Parking, Gym, Locker
      
      const booking = await prisma.booking.findFirst({
        where: { studentId: request.studentId, status: 'APPROVED' },
        include: { residentFacility: true, parkingSlot: true }
      });

      if (booking) {
        const updateData = {};
        const isRemove = action === 'Remove';

        if (facilityName === 'AC') {
          updateData.acEnabled = !isRemove;
        } else if (facilityName === 'Gym') {
          updateData.gymEnabled = !isRemove;
        } else if (facilityName === 'Locker') {
          updateData.lockerNo = isRemove ? null : 'L-' + Math.floor(Math.random() * 1000);
        } else if (facilityName === 'Laundry') {
          if (isRemove) {
            updateData.laundryDays = 0;
          } else {
            const detailMatch = desc.match(/\[(\d+)\s+days/i);
            updateData.laundryDays = detailMatch ? parseInt(detailMatch[1]) : 2;
          }
        } else if (facilityName === 'WiFi') {
          if (isRemove) {
            updateData.wifiStatus = 'Suspended';
            updateData.wifiTierId = null;
          } else {
            updateData.wifiStatus = 'Active';
            
            // Try to extract tier name from description: e.g. "Request to Add WiFi [Basic (10Mbps)]"
            const detailMatch = desc.match(/\[(.*?)\]/);
            if (detailMatch) {
              const tierName = detailMatch[1].split(' (')[0]; // Gets "Basic"
              const selectedTier = await prisma.wifiTier.findFirst({ 
                where: { hostelId: request.hostelId, name: { contains: tierName } } 
              });
              if (selectedTier) updateData.wifiTierId = selectedTier.id;
            }
            
            // Fallback to first available tier
            if (!updateData.wifiTierId) {
              const defaultTier = await prisma.wifiTier.findFirst({ where: { hostelId: request.hostelId } });
              if (defaultTier) updateData.wifiTierId = defaultTier.id;
            }
          }
        }

        if (Object.keys(updateData).length > 0) {
           await prisma.residentFacility.upsert({
             where: { bookingId: booking.id },
             update: updateData,
             create: { bookingId: booking.id, ...updateData }
           });
        }

        if (facilityName === 'Parking') {
           if (isRemove && booking.parkingSlot) {
             await prisma.parkingSlot.update({
               where: { id: booking.parkingSlot.id },
               data: { status: 'Available', assignedBookingId: null }
             });
           } else if (!isRemove && !booking.parkingSlot) {
             const detailMatch = desc.match(/\[(Car|Bike)\]/i);
             const type = detailMatch ? detailMatch[1] : 'Bike';
             const slot = await prisma.parkingSlot.findFirst({
               where: { hostelId: request.hostelId, status: 'Available', type }
             });
             if (slot) {
               await prisma.parkingSlot.update({
                 where: { id: slot.id },
                 data: { status: 'Occupied', assignedBookingId: booking.id }
               });
             }
           }
        }
      }
    }
  }

  return updatedReq;
};

module.exports = {
  createRequest, getStudentRequests, getHostelRequests, updateRequestStatus
};
