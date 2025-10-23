import { Agency } from "../../agency/agency.model";
import { SubAgent } from "../subAgency.model";
import AppError from "../../../errors/AppError";
import httpStatus from "http-status";
import { USER_ROLE } from "../../user/user.constant";


export const verifyAgencyAndSubAgentOwnership = async (
  currentUser: { role: string; agencyId?: string; wholesalerId?: string },
  agencyId: string,
  subAgentId?: string
) => {
  const agency = await Agency.findById(agencyId);
  if (!agency) throw new AppError(httpStatus.NOT_FOUND, "Agency not found");

  if (currentUser.role === USER_ROLE.agency_admin) {
    if (String(currentUser.agencyId) !== String(agency._id)) {
      throw new AppError(httpStatus.FORBIDDEN, "You are not allowed to access this agency");
    }
  }

  if (currentUser.role === USER_ROLE.whole_saler) {
    if (String(currentUser.wholesalerId) !== String(agency.wholesaler)) {
      throw new AppError(httpStatus.FORBIDDEN, "You are not allowed to access this agency");
    }
  }

  if (subAgentId) {
    const subAgent = await SubAgent.findById(subAgentId);
    if (!subAgent) throw new AppError(httpStatus.NOT_FOUND, "SubAgent not found");

    if (String(subAgent.agency) !== String(agency._id)) {
      throw new AppError(httpStatus.FORBIDDEN, "SubAgent does not belong to this agency");
    }
  }

  return true;
};
