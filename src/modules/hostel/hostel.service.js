const prisma = require('../../config/db');

/**
 * Create a new hostel (Default status: PENDING)
 */
const createHostel = async (ownerId, data) => {
  const { 
    name, address, city, state, pincode, gender, totalCapacity, description, amenities, rules,
    contactName, contactPhone, contactEmail, totalFloors, floorPricing, addons, photos
  } = data;
  
  const hostel = await prisma.hostel.create({
    data: {
      ownerId: Number(ownerId),
      name, address, city, state, pincode, gender, totalCapacity: Number(totalCapacity) || 0,
      description, amenities, rules, photos,
      contactName, contactPhone, contactEmail,
      totalFloors: Number(totalFloors) || 1,
      floorPricing, addons
    }
  });



  return hostel;
};

/**
 * Get all hostels of a specific owner
 */
const getOwnerHostels = async (ownerId) => {
  const hostels = await prisma.hostel.findMany({
    where: { ownerId: parseInt(ownerId) },
    include: {
      rooms: {
        include: {
          beds: {
            select: { isOccupied: true }
          }
        }
      },
      _count: {
        select: {
          rooms: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Add computed stats
  return Promise.all(hostels.map(async hostel => {
    let availableBeds = 0
    let totalBeds = 0

    hostel.rooms.forEach(room => {
      room.beds.forEach(bed => {
        totalBeds++
        if (!bed.isOccupied) availableBeds++
      })
    })

    const pendingBookingsCount = await prisma.booking.count({
      where: {
        status: 'PENDING',
        bed: { room: { hostelId: hostel.id } }
      }
    });

    const { rooms, ...hostelData } = hostel
    return {
      ...hostelData,
      totalResidents: totalBeds - availableBeds,
      availableBeds,
      totalBeds,
      totalRooms: hostel._count.rooms,
      pendingBookings: pendingBookingsCount
    }
  }))
}

/**
 * Get specific hostel by ID and verify ownership
 */
const getHostelById = async (hostelId, ownerId) => {
  const hostel = await prisma.hostel.findFirst({
    where: { id: Number(hostelId), ownerId: Number(ownerId) },
    include: {
      rooms: { include: { _count: { select: { beds: true } } } },
      _count: { select: { rooms: true } }
    }
  });

  if (!hostel) throw new Error("Hostel not found or unauthorized access");
  return hostel;
};

/**
 * Update hostel details (must be owner)
 */
const updateHostel = async (hostelId, ownerId, data) => {
  // Verify ownership first
  const existing = await prisma.hostel.findFirst({ where: { id: Number(hostelId), ownerId: Number(ownerId) } });
  if (!existing) throw new Error("Hostel not found or unauthorized access");

  const hostel = await prisma.hostel.update({
    where: { id: Number(hostelId) },
    data
  });
  return hostel;
};

/**
 * Delete hostel (Soft approach - fail if active students exist)
 */
const deleteHostel = async (hostelId, ownerId) => {
  const existing = await prisma.hostel.findFirst({ where: { id: Number(hostelId), ownerId: Number(ownerId) } });
  if (!existing) throw new Error("Hostel not found or unauthorized access");

  // Check if any beds are occupied
  const occupiedBeds = await prisma.bed.count({
    where: { room: { hostelId: Number(hostelId) }, isOccupied: true }
  });

  if (occupiedBeds > 0) {
    throw new Error("Cannot delete hostel with active residents. Checkout all residents first.");
  }

  await prisma.hostel.delete({ where: { id: Number(hostelId) } });
  return { success: true };
};

/**
 * Get public ACTIVE hostels for students to browse
 */
const getPublicHostels = async (filters = {}) => {
  const {
    city,
    gender,
    minPrice,
    maxPrice,
    page = 1,
    limit = 10
  } = filters

  const skip = (parseInt(page) - 1) * parseInt(limit)
  const take = parseInt(limit)

  // Build where clause
  const where = {
    status: 'ACTIVE'
  }

  if (city) {
    where.city = { contains: city }
  }

  if (gender) {
    where.gender = gender
  }

  // Price filter - filter hostels that have rooms in price range
  if (minPrice || maxPrice) {
    where.rooms = {
      some: {
        pricePerMonth: {
          ...(minPrice && { gte: parseFloat(minPrice) }),
          ...(maxPrice && { lte: parseFloat(maxPrice) })
        }
      }
    }
  }

  const [hostels, total] = await Promise.all([
    prisma.hostel.findMany({
      where,
      skip,
      take,
      include: {
        owner: {
          select: { name: true, phone: true }
        },
        rooms: {
          include: {
            beds: {
              select: { isOccupied: true }
            }
          }
        },
        _count: {
          select: { rooms: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.hostel.count({ where })
  ])

  // Calculate available beds and price range for each hostel
  const hostelsWithStats = hostels.map(hostel => {
    let availableBeds = 0
    let prices = []

    hostel.rooms.forEach(room => {
      prices.push(parseFloat(room.pricePerMonth))
      room.beds.forEach(bed => {
        if (!bed.isOccupied) availableBeds++
      })
    })

    const { rooms, ...hostelData } = hostel
    return {
      ...hostelData,
      availableBeds,
      totalRooms: hostel._count.rooms,
      startingPrice: prices.length > 0 ? Math.min(...prices) : null,
      priceRange: prices.length > 0 ? {
        min: Math.min(...prices),
        max: Math.max(...prices)
      } : null
    }
  })

  return {
    hostels: hostelsWithStats,
    total,
    page: parseInt(page),
    totalPages: Math.ceil(total / take)
  }
}

/**
 * Get full public hostel details
 */
const getPublicHostelById = async (hostelId) => {
  const hostel = await prisma.hostel.findFirst({
    where: { id: Number(hostelId), status: 'ACTIVE' },
    include: {
      rooms: {
        where: { isAvailable: true },
        include: { _count: { select: { beds: { where: { isOccupied: false } } } } }
      },
      owner: { select: { name: true, phone: true } }
    }
  });

  if (!hostel) throw new Error("Hostel not found or not active");
  return hostel;
};

module.exports = {
  createHostel, getOwnerHostels, getHostelById, updateHostel, deleteHostel, getPublicHostels, getPublicHostelById
};
