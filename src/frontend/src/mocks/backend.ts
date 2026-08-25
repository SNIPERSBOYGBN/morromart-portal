import type {
  Announcement,
  Application,
  backendInterface,
  Department,
  Position,
  Session,
  Settings,
  User,
} from "../backend";
import {
  AnnouncementType,
  ApplicationStatus,
  PositionType,
  Role,
} from "../backend";
import { Principal } from "@icp-sdk/core/principal";

const adminPrincipal = Principal.fromText("aaaaa-aa");
const reviewerPrincipal = Principal.fromText("aaaaa-ab");
const leadPrincipal = Principal.fromText("aaaaa-ac");
const applicantPrincipal = Principal.fromText("aaaaa-ad");

const session: Session = {
  expiresAt: BigInt(9999999999999),
  username: "Admin User",
  userId: adminPrincipal,
  discordId: "1256345285752389662",
};

const adminUser: User = {
  id: adminPrincipal,
  departments: [BigInt(1), BigInt(2), BigInt(3)],
  username: "Admin User",
  role: Role.admin,
  discordId: "1256345285752389662",
};

const departments: Department[] = [
  { id: BigInt(1), name: "Engineering", description: "Software and platform engineering roles." },
  { id: BigInt(2), name: "Design", description: "Product and visual design roles." },
  { id: BigInt(3), name: "Operations", description: "Community and operations roles." },
];

const positions: Position[] = [
  {
    id: BigInt(1),
    title: "Senior Frontend Engineer",
    open: true,
    description:
      "Build delightful, accessible interfaces for our recruitment platform using React and TypeScript.",
    positionType: PositionType.paid,
    requirements: ["5+ years of React", "TypeScript experience", "Strong CSS skills"],
    departmentId: BigInt(1),
  },
  {
    id: BigInt(2),
    title: "Product Designer",
    open: true,
    description:
      "Own the end-to-end design of our portal, from wireframes to polished high-fidelity UI.",
    positionType: PositionType.contract,
    requirements: ["Portfolio required", "Figma proficiency", "Design systems experience"],
    departmentId: BigInt(2),
  },
  {
    id: BigInt(3),
    title: "Community Moderator",
    open: true,
    description:
      "Help keep our Discord community welcoming, organized, and on-topic.",
    positionType: PositionType.unpaid,
    requirements: ["Active community member", "Good communication", "Conflict resolution"],
    departmentId: BigInt(3),
  },
];

const announcements: Announcement[] = [
  {
    id: BigInt(1),
    title: "Welcome to the portal",
    message: "Applications for the new season are now open. Good luck!",
    active: true,
    announcementType: AnnouncementType.info,
    createdAt: BigInt(1700000000000),
  },
  {
    id: BigInt(2),
    title: "Deadline approaching",
    message: "Applications close this Friday at 11:59 PM UTC.",
    active: true,
    announcementType: AnnouncementType.warning,
    createdAt: BigInt(1700000000000),
  },
  {
    id: BigInt(3),
    title: "System maintenance",
    message: "The portal will be briefly unavailable on Sunday for maintenance.",
    active: true,
    announcementType: AnnouncementType.error,
    createdAt: BigInt(1700000000000),
  },
  {
    id: BigInt(4),
    title: "Hiring event",
    message: "Join our live hiring Q&A session this Thursday.",
    active: true,
    announcementType: AnnouncementType.other,
    color: "#8b5cf6",
    icon: "megaphone",
    createdAt: BigInt(1700000000000),
  },
];

const applications: Application[] = [
  {
    id: BigInt(1),
    status: ApplicationStatus.pendingReview,
    applicantId: applicantPrincipal,
    responses: ["I have 6 years of React experience.", "I love building accessible UIs."],
    submittedAt: BigInt(1700000000000),
    applicantDiscordId: "111111111111111111",
    positionId: BigInt(1),
  },
  {
    id: BigInt(2),
    status: ApplicationStatus.underReview,
    applicantId: reviewerPrincipal,
    responses: ["I am a designer with a strong portfolio."],
    submittedAt: BigInt(1700000000000),
    applicantDiscordId: "222222222222222222",
    positionId: BigInt(2),
  },
];

const staff: User[] = [
  adminUser,
  {
    id: reviewerPrincipal,
    departments: [BigInt(1), BigInt(2), BigInt(3)],
    username: "Reviewer One",
    role: Role.reviewer,
    discordId: "333333333333333333",
  },
  {
    id: leadPrincipal,
    departments: [BigInt(1)],
    username: "Lead One",
    role: Role.dprtLead,
    discordId: "444444444444444444",
  },
  {
    id: applicantPrincipal,
    departments: [],
    username: "Applicant One",
    role: Role.applicant,
    discordId: "555555555555555555",
  },
];

const settings: Settings = {
  guildRequired: true,
  clientId: "1256345285752389662",
  guildId: "1247576109990809733",
  clientSecret: "mock-secret",
  botToken: "mock-token",
};

export const mockBackend: backendInterface = {
  addStaffMember: async (discordId, username, role, depts) => ({
    id: adminPrincipal,
    departments: depts,
    username,
    role,
    discordId,
  }),
  blacklistApplicant: async () => undefined,
  changePermission: async (_id, role, depts) => ({
    id: adminPrincipal,
    departments: depts,
    username: "Admin User",
    role,
    discordId: "1256345285752389662",
  }),
  createDepartment: async (name, description) => ({
    id: BigInt(99),
    name,
    description,
  }),
  createPosition: async (title, description, requirements, positionType, departmentId) => ({
    id: BigInt(99),
    title,
    description,
    requirements,
    positionType,
    departmentId,
    open: true,
  }),
  deactivateAnnouncement: async () => undefined,
  deleteDepartment: async () => undefined,
  discordLoginComplete: async () => session,
  discordLoginStart: async () => "https://discord.com/oauth2/authorize?mock=1",
  execute: async () => ({ hasMore: false, rows: [] }),
  getApplication: async (id) => applications.find((a) => a.id === id) ?? null,
  getCallerPermission: async () => adminUser,
  getCurrentUser: async () => session,
  getDepartment: async (id) => departments.find((d) => d.id === id) ?? null,
  getPosition: async (id) => positions.find((p) => p.id === id) ?? null,
  getSettings: async () => settings,
  listAnnouncements: async () => announcements,
  listApplications: async () => applications,
  listApplicationsForReview: async () => applications,
  listDepartments: async () => departments,
  listPositions: async () => positions,
  listStaff: async () => staff,
  logout: async () => undefined,
  openApplicationForReview: async (id) =>
    applications.find((a) => a.id === id) ?? applications[0],
  postAnnouncement: async (title, message, announcementType, color, icon) => ({
    id: BigInt(99),
    title,
    message,
    active: true,
    announcementType,
    color: color ?? undefined,
    icon: icon ?? undefined,
    createdAt: BigInt(1700000000000),
  }),
  schema: async () => "mock schema",
  sendBotDm: async () => undefined,
  setApplicationStatus: async (id, status, feedback, internalNotes) => ({
    ...(applications.find((a) => a.id === id) ?? applications[0]),
    status,
    feedback: feedback ?? undefined,
    internalNotes: internalNotes ?? undefined,
  }),
  setGuildId: async () => undefined,
  setGuildRequired: async () => undefined,
  setPositionOpen: async (id, open) => ({
    ...(positions.find((p) => p.id === id) ?? positions[0]),
    open,
  }),
  submitApplication: async (positionId, responses) => ({
    id: BigInt(99),
    status: ApplicationStatus.pendingReview,
    applicantId: adminPrincipal,
    responses,
    submittedAt: BigInt(1700000000000),
    applicantDiscordId: "1256345285752389662",
    positionId,
  }),
  transform: async (input) => ({
    status: BigInt(200),
    body: input.response.body,
    headers: input.response.headers,
  }),
  updateDepartment: async (id, name, description) => ({
    id,
    name,
    description,
  }),
  updatePosition: async (id, title, description, requirements, positionType, departmentId) => ({
    id,
    title,
    description,
    requirements,
    positionType,
    departmentId,
    open: true,
  }),
  updateSettings: async () => undefined,
};
