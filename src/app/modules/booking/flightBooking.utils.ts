import { FlightBooking } from "./flightBooking.model";

/**
 * Generate flight booking ID with format:
 * WH-{wholesalerSlug}-AG-{agencySlug}-TKT-{sequenceNumber}
 * Example: WH-GWT-AG-TES-TKT-00001
 */
export async function generateFlightBookingSlug(
  wholesalerSlug: string,
  agencySlug: string
) {
  // 0. Validate inputs
  if (!wholesalerSlug) {
    throw new Error("Wholesaler slug is required");
  }
  if (!agencySlug) {
    throw new Error("Agency slug is required");
  }

  // 1. Clean the slugs to remove any existing prefixes
  const cleanWholesalerSlug = wholesalerSlug.replace(/^WH-/, "");
  const cleanAgencySlug = agencySlug.replace(/^AG-/, "");

  // 2. Final flight booking prefix with TKT
  const prefix = `WH-${cleanWholesalerSlug}-AG-${cleanAgencySlug}-TKT`; // e.g., WH-GWT-AG-TES-TKT

  // 3. Search for the latest flightBookingId with this prefix
  const lastBooking = await FlightBooking.findOne(
    {
      flightBookingId: {
        $regex: `^${prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-\\d{5}$`,
      },
    },
    { flightBookingId: 1, sequenceNumber: 1 },
    { sort: { sequenceNumber: -1 } }
  );

  const lastSeq = lastBooking?.sequenceNumber || 0;
  const nextSeq = lastSeq + 1;

  const flightBookingId = `${prefix}-${nextSeq.toString().padStart(5, "0")}`;

  return {
    flightBookingId,
    sequenceNumber: nextSeq,
  };
}
