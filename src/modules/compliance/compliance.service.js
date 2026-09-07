const prisma = require('../../config/db');

const addDocument = async (hostelId, ownerId, data) => {
  const hostel = await prisma.hostel.findFirst({ where: { id: Number(hostelId), ownerId: Number(ownerId) } });
  if (!hostel) throw new Error("Unauthorized");

  const { documentName, documentType, fileUrl, issuedBy, issuedDate, expiryDate, notes } = data;
  
  let status = 'ACTIVE';
  if (expiryDate && new Date(expiryDate) < new Date()) {
    status = 'EXPIRED';
  }

  return await prisma.complianceDocument.create({
    data: {
      hostelId: Number(hostelId),
      documentName, documentType, fileUrl, issuedBy, 
      issuedDate: issuedDate ? new Date(issuedDate) : null,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      notes, status
    }
  });
};

const getHostelDocuments = async (hostelId, ownerId) => {
  // Verify ownership
  const hostel = await prisma.hostel.findFirst({
    where: {
      id: parseInt(hostelId),
      ownerId: parseInt(ownerId)
    }
  })
  if (!hostel) throw new Error('Hostel not found or unauthorized')

  const documents = await prisma.complianceDocument.findMany({
    where: { hostelId: parseInt(hostelId) },
    orderBy: { createdAt: 'desc' }
  })

  const today = new Date()
  const thirtyDaysFromNow = new Date(
    today.getTime() + 30 * 24 * 60 * 60 * 1000
  )

  // Auto-update expired/expiring documents
  const updatePromises = []

  const updatedDocuments = documents.map(doc => {
    if (!doc.expiryDate) return doc

    let newStatus = doc.status

    if (doc.expiryDate < today) {
      newStatus = 'EXPIRED'
    } else if (doc.expiryDate < thirtyDaysFromNow) {
      newStatus = 'PENDING_RENEWAL'
    } else {
      newStatus = 'ACTIVE'
    }

    if (newStatus !== doc.status) {
      updatePromises.push(
        prisma.complianceDocument.update({
          where: { id: doc.id },
          data: { status: newStatus }
        })
      )
    }

    return { ...doc, status: newStatus }
  })

  // Run all updates in background
  if (updatePromises.length > 0) {
    await Promise.all(updatePromises)
  }

  // Calculate summary
  const summary = {
    total: updatedDocuments.length,
    active: updatedDocuments.filter(d => d.status === 'ACTIVE').length,
    expired: updatedDocuments.filter(d => d.status === 'EXPIRED').length,
    pending_renewal: updatedDocuments.filter(
      d => d.status === 'PENDING_RENEWAL'
    ).length
  }

  return { documents: updatedDocuments, summary }
}

const updateDocument = async (documentId, ownerId, data) => {
  const doc = await prisma.complianceDocument.findUnique({ where: { id: Number(documentId) }, include: { hostel: true } });
  if (!doc || doc.hostel.ownerId !== Number(ownerId)) throw new Error("Unauthorized");

  const { documentName, documentType, fileUrl, issuedBy, issuedDate, expiryDate, notes } = data;

  let status = doc.status;
  if (expiryDate) {
    status = new Date(expiryDate) < new Date() ? 'EXPIRED' : 'ACTIVE';
  }

  return await prisma.complianceDocument.update({
    where: { id: Number(documentId) },
    data: {
      documentName, documentType, fileUrl, issuedBy,
      issuedDate: issuedDate ? new Date(issuedDate) : undefined,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      notes, status
    }
  });
};

const deleteDocument = async (documentId, ownerId) => {
  const doc = await prisma.complianceDocument.findUnique({ where: { id: Number(documentId) }, include: { hostel: true } });
  if (!doc || doc.hostel.ownerId !== Number(ownerId)) throw new Error("Unauthorized");

  await prisma.complianceDocument.delete({ where: { id: Number(documentId) } });
  return { success: true };
};

const getExpiringDocuments = async (hostelId, ownerId) => {
  const hostel = await prisma.hostel.findFirst({ where: { id: Number(hostelId), ownerId: Number(ownerId) } });
  if (!hostel) throw new Error("Unauthorized");

  const now = new Date();
  const next30Days = new Date();
  next30Days.setDate(next30Days.getDate() + 30);

  return await prisma.complianceDocument.findMany({
    where: { 
      hostelId: Number(hostelId), 
      status: 'ACTIVE',
      expiryDate: { lte: next30Days, gt: now }
    },
    orderBy: { expiryDate: 'asc' }
  });
};

const addHostelRule = async (hostelId, ownerId, data) => {
  const hostel = await prisma.hostel.findFirst({ where: { id: Number(hostelId), ownerId: Number(ownerId) } });
  if (!hostel) throw new Error("Unauthorized");

  return await prisma.hostelRule.create({
    data: {
      hostelId: Number(hostelId),
      title: data.title,
      description: data.description,
      penaltyAmount: data.penaltyAmount ? Number(data.penaltyAmount) : null
    }
  });
};

const getHostelRules = async (hostelId) => {
  return await prisma.hostelRule.findMany({
    where: { hostelId: Number(hostelId) },
    orderBy: { createdAt: 'desc' }
  });
};

const reportViolation = async (hostelId, ownerId, data) => {
  const hostel = await prisma.hostel.findFirst({ where: { id: Number(hostelId), ownerId: Number(ownerId) } });
  if (!hostel) throw new Error("Unauthorized");

  return await prisma.complianceViolation.create({
    data: {
      hostelId: Number(hostelId),
      studentId: Number(data.studentId),
      ruleId: Number(data.ruleId),
      date: data.date ? new Date(data.date) : new Date(),
      remarks: data.remarks
    }
  });
};

const getHostelViolations = async (hostelId) => {
  return await prisma.complianceViolation.findMany({
    where: { hostelId: Number(hostelId) },
    include: {
      student: { select: { name: true, email: true } },
      rule: { select: { title: true, penaltyAmount: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
};

const getAgreements = async (hostelId, ownerId) => {
  const hostel = await prisma.hostel.findFirst({ where: { id: Number(hostelId), ownerId: Number(ownerId) } });
  if (!hostel) throw new Error("Unauthorized");

  // Auto-create agreements for all approved students who don't have one yet
  const approvedBookings = await prisma.booking.findMany({
    where: { status: 'APPROVED', bed: { room: { hostelId: Number(hostelId) } } },
    include: { student: { select: { id: true, name: true } }, bed: { include: { room: { select: { roomNumber: true } } } } }
  });

  for (const booking of approvedBookings) {
    const existing = await prisma.agreement.findUnique({
      where: { studentId_hostelId: { studentId: booking.studentId, hostelId: Number(hostelId) } }
    });
    if (!existing) {
      await prisma.agreement.create({
        data: { studentId: booking.studentId, hostelId: Number(hostelId) }
      });
    }
  }

  return await prisma.agreement.findMany({
    where: { hostelId: Number(hostelId) },
    include: { student: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' }
  });
};

const updateAgreementStatus = async (agreementId, ownerId, data) => {
  const agreement = await prisma.agreement.findUnique({
    where: { id: Number(agreementId) },
    include: { hostel: true }
  });
  if (!agreement || agreement.hostel.ownerId !== Number(ownerId)) throw new Error("Unauthorized");

  const updateData = { status: data.status };
  if (data.status === 'SENT') updateData.sentDate = new Date();
  if (data.status === 'SIGNED') {
    updateData.signedDate = new Date();
    updateData.method = data.method || 'Digital';
  }

  return await prisma.agreement.update({
    where: { id: Number(agreementId) },
    data: updateData
  });
};

const updateHostelRule = async (ruleId, ownerId, data) => {
  const rule = await prisma.hostelRule.findUnique({
    where: { id: Number(ruleId) },
    include: { hostel: true }
  });
  if (!rule || rule.hostel.ownerId !== Number(ownerId)) throw new Error("Unauthorized");

  return await prisma.hostelRule.update({
    where: { id: Number(ruleId) },
    data: {
      title: data.title,
      description: data.description,
      penaltyAmount: data.penaltyAmount ? Number(data.penaltyAmount) : null
    }
  });
};

const deleteHostelRule = async (ruleId, ownerId) => {
  const rule = await prisma.hostelRule.findUnique({
    where: { id: Number(ruleId) },
    include: { hostel: true }
  });
  if (!rule || rule.hostel.ownerId !== Number(ownerId)) throw new Error("Unauthorized");

  // First delete any associated violations to prevent foreign key errors
  await prisma.complianceViolation.deleteMany({
    where: { ruleId: Number(ruleId) }
  });

  await prisma.hostelRule.delete({
    where: { id: Number(ruleId) }
  });

  return { success: true };
};

const updateViolationStatus = async (violationId, ownerId, status) => {
  const violation = await prisma.complianceViolation.findUnique({
    where: { id: Number(violationId) },
    include: { hostel: true }
  });
  if (!violation || violation.hostel.ownerId !== Number(ownerId)) throw new Error("Unauthorized");

  return await prisma.complianceViolation.update({
    where: { id: Number(violationId) },
    data: { status }
  });
};

const deleteViolation = async (violationId, ownerId) => {
  const violation = await prisma.complianceViolation.findUnique({
    where: { id: Number(violationId) },
    include: { hostel: true }
  });
  if (!violation || violation.hostel.ownerId !== Number(ownerId)) throw new Error("Unauthorized");

  await prisma.complianceViolation.delete({
    where: { id: Number(violationId) }
  });

  return { success: true };
};

module.exports = {
  addDocument, getHostelDocuments, updateDocument, deleteDocument, getExpiringDocuments,
  addHostelRule, getHostelRules, updateHostelRule, deleteHostelRule,
  reportViolation, getHostelViolations, updateViolationStatus, deleteViolation,
  getAgreements, updateAgreementStatus
};
