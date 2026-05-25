import crypto from 'crypto';

const BASE = process.env.MEETING_BASE_URL || 'https://meet.example.com';

export function createMeetingLink({ appointmentId, doctorId } = {}) {
  const id = crypto.randomBytes(8).toString('hex');
  const path = `${id}`;
  return `${BASE}/${path}`;
}

export default { createMeetingLink };
