import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type DiscordId = string;
export type Timestamp = bigint;
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<HttpHeader>;
}
export type PositionId = bigint;
export interface HttpRequestResult {
    status: bigint;
    body: Uint8Array;
    headers: Array<HttpHeader>;
}
export interface User {
    id: UserId;
    departments: Array<DepartmentId>;
    username: string;
    role: Role;
    discordId: DiscordId;
}
export interface Application {
    id: ApplicationId;
    status: ApplicationStatus;
    applicantId: UserId;
    responses: Array<string>;
    submittedAt: Timestamp;
    feedback?: string;
    applicantDiscordId: DiscordId;
    positionId: PositionId;
    internalNotes?: string;
}
export type DepartmentId = bigint;
export interface HttpHeader {
    value: string;
    name: string;
}
export type UserId = Principal;
export interface Settings {
    guildRequired: boolean;
    clientId: string;
    guildId: string;
    clientSecret: string;
    botToken: string;
}
export interface Session {
    expiresAt: Timestamp;
    username: string;
    userId: UserId;
    discordId: DiscordId;
}
export interface Result {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export interface Position {
    id: PositionId;
    title: string;
    open: boolean;
    description: string;
    positionType: PositionType;
    requirements: Array<string>;
    departmentId: DepartmentId;
}
export interface TransformationInput {
    context: Uint8Array;
    response: HttpRequestResult;
}
export interface Department {
    id: DepartmentId;
    name: string;
    description: string;
}
export interface Cell {
    value: Value;
    name: string;
}
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export type ApplicationId = bigint;
export type AnnouncementId = bigint;
export interface Announcement {
    id: AnnouncementId;
    title: string;
    active: boolean;
    announcementType: AnnouncementType;
    icon?: string;
    createdAt: Timestamp;
    color?: string;
    message: string;
}
export enum AnnouncementType {
    warning = "warning",
    other = "other",
    info = "info",
    error = "error"
}
export enum ApplicationStatus {
    pendingReview = "pendingReview",
    underReview = "underReview",
    rejected = "rejected",
    accepted = "accepted"
}
export enum BlacklistScope {
    full = "full",
    department = "department"
}
export enum PositionType {
    contract = "contract",
    paid = "paid",
    unpaid = "unpaid"
}
export enum Role {
    applicant = "applicant",
    dprtLead = "dprtLead",
    admin = "admin",
    reviewer = "reviewer",
    blacklisted = "blacklisted",
    dprtReviewer = "dprtReviewer",
    dprtBlacklisted = "dprtBlacklisted"
}
export interface backendInterface {
    addStaffMember(discordId: DiscordId, username: string, role: Role, departments: Array<DepartmentId>): Promise<User>;
    blacklistApplicant(applicationId: ApplicationId, scope: BlacklistScope, reason: string): Promise<void>;
    changePermission(userId: UserId, role: Role, departments: Array<DepartmentId>): Promise<User>;
    createDepartment(name: string, description: string): Promise<Department>;
    createPosition(title: string, description: string, requirements: Array<string>, positionType: PositionType, departmentId: DepartmentId): Promise<Position>;
    deactivateAnnouncement(id: AnnouncementId): Promise<void>;
    deleteDepartment(id: DepartmentId): Promise<void>;
    discordLoginComplete(code: string): Promise<Session>;
    discordLoginStart(): Promise<string>;
    execute(qJson: string): Promise<Result>;
    getApplication(id: ApplicationId): Promise<Application | null>;
    getCallerPermission(): Promise<User | null>;
    getCurrentUser(): Promise<Session | null>;
    getDepartment(id: DepartmentId): Promise<Department | null>;
    getPosition(id: PositionId): Promise<Position | null>;
    getSettings(): Promise<Settings>;
    listAnnouncements(): Promise<Array<Announcement>>;
    listApplications(): Promise<Array<Application>>;
    listApplicationsForReview(): Promise<Array<Application>>;
    listDepartments(): Promise<Array<Department>>;
    listPositions(): Promise<Array<Position>>;
    listStaff(): Promise<Array<User>>;
    logout(): Promise<void>;
    openApplicationForReview(id: ApplicationId): Promise<Application>;
    postAnnouncement(title: string, message: string, announcementType: AnnouncementType, color: string | null, icon: string | null): Promise<Announcement>;
    schema(): Promise<string>;
    sendBotDm(discordId: DiscordId, message: string): Promise<void>;
    setApplicationStatus(id: ApplicationId, status: ApplicationStatus, feedback: string | null, internalNotes: string | null): Promise<Application>;
    setGuildId(guildId: string): Promise<void>;
    setGuildRequired(required: boolean): Promise<void>;
    setPositionOpen(id: PositionId, open: boolean): Promise<Position>;
    submitApplication(positionId: PositionId, responses: Array<string>): Promise<Application>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateDepartment(id: DepartmentId, name: string, description: string): Promise<Department>;
    updatePosition(id: PositionId, title: string, description: string, requirements: Array<string>, positionType: PositionType, departmentId: DepartmentId): Promise<Position>;
    updateSettings(newSettings: Settings): Promise<void>;
}
