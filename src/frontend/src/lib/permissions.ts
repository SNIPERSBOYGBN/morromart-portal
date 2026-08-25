import { Role } from "@/backend";

/**
 * Numeric rank for each role, ordered by the permission hierarchy:
 * Blacklisted < Dprt Blacklisted < Applicant < Dprt Reviewer < Reviewer < Dprt Lead < Admin.
 */
export const ROLE_LEVEL: Record<Role, number> = {
  [Role.blacklisted]: 0,
  [Role.dprtBlacklisted]: 1,
  [Role.applicant]: 2,
  [Role.dprtReviewer]: 3,
  [Role.reviewer]: 4,
  [Role.dprtLead]: 5,
  [Role.admin]: 6,
};

/** True when the given role is at or above the required hierarchy level. */
export function canAccess(
  role: Role | null | undefined,
  requiredLevel: number,
): boolean {
  if (!role) return false;
  return ROLE_LEVEL[role] >= requiredLevel;
}

/** Applications requires Dprt Lead or above. */
export const canViewApplications = (role?: Role | null) =>
  canAccess(role, ROLE_LEVEL[Role.dprtLead]);

/** Departments requires Admin. */
export const canViewDepartments = (role?: Role | null) =>
  canAccess(role, ROLE_LEVEL[Role.admin]);

/** Staff is visible to Dprt Lead and above (full management is Admin-only). */
export const canViewStaff = (role?: Role | null) =>
  canAccess(role, ROLE_LEVEL[Role.dprtLead]);

/** Review requires Dprt Reviewer or above. */
export const canViewReview = (role?: Role | null) =>
  canAccess(role, ROLE_LEVEL[Role.dprtReviewer]);

/** Settings requires Admin. */
export const canViewSettings = (role?: Role | null) =>
  canAccess(role, ROLE_LEVEL[Role.admin]);
