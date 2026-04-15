import appointmentModel from "../models/appointmentModel.js";
import doctorModel from "../models/doctorModel.js";

// Marks expired online-pending appointments as cancelled and releases
// their slots. Lazy cleanup — called from bookAppointment and doctorList.
// Safe to run in serverless (no persistent timers).
const sweepExpiredOnlineBookings = async ({ docId } = {}) => {
  const filter = {
    paymentMethod: "online",
    payment: false,
    cancelled: false,
    paymentExpiresAt: { $lt: new Date() },
  };
  if (docId) filter.docId = docId;

  const expired = await appointmentModel.find(filter);
  if (expired.length === 0) return 0;

  await appointmentModel.updateMany(
    { _id: { $in: expired.map((a) => a._id) } },
    { $set: { cancelled: true } }
  );

  // Group slot releases by doctor so we issue one update per doctor.
  const slotsByDoctor = new Map();
  for (const appt of expired) {
    const key = String(appt.docId);
    if (!slotsByDoctor.has(key)) slotsByDoctor.set(key, []);
    slotsByDoctor.get(key).push({
      slotDate: appt.slotDate,
      slotTime: appt.slotTime,
    });
  }

  await Promise.all(
    [...slotsByDoctor.entries()].map(async ([docIdKey, slots]) => {
      const update = {};
      for (const { slotDate, slotTime } of slots) {
        const path = `slots_booked.${slotDate}`;
        // Multiple pulls from the same path need to be combined.
        if (!update[path]) update[path] = { $in: [] };
        update[path].$in.push(slotTime);
      }
      const pullSpec = {};
      for (const [path, val] of Object.entries(update)) {
        pullSpec[path] = val;
      }
      await doctorModel.findByIdAndUpdate(docIdKey, { $pull: pullSpec });
    })
  );

  return expired.length;
};

export default sweepExpiredOnlineBookings;
