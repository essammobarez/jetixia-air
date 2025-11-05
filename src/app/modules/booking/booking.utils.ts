import { FlightBooking } from "./booking.model";

/**
 * Generate booking ID with slug format:
 * WH-{wholesalerSlug}-AG-{agencySlug}-TKT-{sequenceNumber}
 * Example: WH-GWT-AG-TES-TKT-00001
 *
 * Falls back to simple TKT-{sequenceNumber} if slugs not provided
 */
export async function generateBookingSlug(
  wholesalerSlug?: string,
  agencySlug?: string
) {
  let prefix = "TKT";
  let useSlugFormat = false;

  // If both slugs provided, use slug format
  if (wholesalerSlug && agencySlug) {
    // Clean the slugs to remove any existing prefixes
    const cleanWholesalerSlug = wholesalerSlug.replace(/^WH-/, "");
    const cleanAgencySlug = agencySlug.replace(/^AG-/, "");

    // Create prefix with wholesaler and agency slugs
    prefix = `WH-${cleanWholesalerSlug}-AG-${cleanAgencySlug}-TKT`;
    useSlugFormat = true;
  }

  // Search for the latest booking with this prefix
  const lastBooking = await FlightBooking.findOne(
    {
      bookingId: {
        $regex: `^${prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-\\d{${
          useSlugFormat ? 5 : 8
        }}$`,
      },
    },
    { bookingId: 1, sequenceNumber: 1 },
    { sort: { sequenceNumber: -1 } }
  );

  const lastSeq = lastBooking?.sequenceNumber || 0;
  const nextSeq = lastSeq + 1;

  // Format: WH-GWT-AG-TES-TKT-00001 (with slugs) or TKT-00000001 (without slugs)
  const paddingLength = useSlugFormat ? 5 : 8;
  const bookingId = `${prefix}-${nextSeq
    .toString()
    .padStart(paddingLength, "0")}`;
  const ticketId = bookingId; // Alias

  return {
    bookingId,
    ticketId,
    sequenceNumber: nextSeq,
  };
}

/**
 * Extract wholesaler and agency slugs from booking ID
 * Example: WH-GWT-AG-TES-TKT-00001 → { wholesalerSlug: "GWT", agencySlug: "TES" }
 */
export function parseBookingSlug(bookingId: string): {
  wholesalerSlug?: string;
  agencySlug?: string;
  sequenceNumber: string;
} {
  // Pattern: WH-{wholesaler}-AG-{agency}-TKT-{sequence}
  const slugPattern = /^WH-([A-Z0-9]+)-AG-([A-Z0-9]+)-TKT-(\d+)$/;
  const simplePattern = /^TKT-(\d+)$/;

  const slugMatch = bookingId.match(slugPattern);
  if (slugMatch) {
    return {
      wholesalerSlug: slugMatch[1],
      agencySlug: slugMatch[2],
      sequenceNumber: slugMatch[3],
    };
  }

  const simpleMatch = bookingId.match(simplePattern);
  if (simpleMatch) {
    return {
      sequenceNumber: simpleMatch[1],
    };
  }

  return {
    sequenceNumber: "0",
  };
}

