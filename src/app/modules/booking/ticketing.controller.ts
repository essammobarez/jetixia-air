import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { issueTicket } from "./ticketing.service";
import { TicketingRequest } from "./ticketing.interface";

const issueFlightTicket = catchAsync(async (req: Request, res: Response) => {
  const ticketingRequest: TicketingRequest = {
    bookingId: req.params.bookingId,
  };

  const result = await issueTicket(ticketingRequest);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Ticket issued successfully! Booking is now confirmed.",
    data: result,
  });
});

export const TicketingController = {
  issueFlightTicket,
};
