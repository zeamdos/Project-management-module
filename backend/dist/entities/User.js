"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.UserStatus = exports.UserRole = void 0;
const typeorm_1 = require("typeorm");
const Organization_1 = require("./Organization");
const TeamMember_1 = require("./TeamMember");
const UserSkill_1 = require("./UserSkill");
const Task_1 = require("./Task");
const GitActivity_1 = require("./GitActivity");
const Review_1 = require("./Review");
const ProgressUpdate_1 = require("./ProgressUpdate");
const Notification_1 = require("./Notification");
const AuditLog_1 = require("./AuditLog");
const Team_1 = require("./Team");
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["MANAGER"] = "manager";
    UserRole["TEAM_LEAD"] = "team_lead";
    UserRole["REVIEWER"] = "reviewer";
    UserRole["DEVELOPER"] = "developer";
    UserRole["EXECUTIVE"] = "executive";
})(UserRole || (exports.UserRole = UserRole = {}));
var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "active";
    UserStatus["INACTIVE"] = "inactive";
    UserStatus["SUSPENDED"] = "suspended";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
let User = class User {
};
exports.User = User;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], User.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], User.prototype, "orgId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Organization_1.Organization, organization => organization.users),
    (0, typeorm_1.JoinColumn)({ name: 'org_id' }),
    __metadata("design:type", Organization_1.Organization)
], User.prototype, "organization", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], User.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, unique: true }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], User.prototype, "passwordHash", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar', length: 50,
        enum: UserRole,
        default: UserRole.DEVELOPER
    }),
    __metadata("design:type", String)
], User.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "specialty", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "telegramId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "githubUsername", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "githubToken", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "timezone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10, default: 'en' }),
    __metadata("design:type", String)
], User.prototype, "language", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar', length: 50,
        enum: UserStatus,
        default: UserStatus.ACTIVE
    }),
    __metadata("design:type", String)
], User.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], User.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], User.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => TeamMember_1.TeamMember, teamMember => teamMember.user),
    __metadata("design:type", Array)
], User.prototype, "teamMemberships", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => UserSkill_1.UserSkill, userSkill => userSkill.user),
    __metadata("design:type", Array)
], User.prototype, "skills", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Task_1.Task, task => task.assignee),
    __metadata("design:type", Array)
], User.prototype, "assignedTasks", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => GitActivity_1.GitActivity, gitActivity => gitActivity.user),
    __metadata("design:type", Array)
], User.prototype, "gitActivities", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Review_1.Review, review => review.reviewer),
    __metadata("design:type", Array)
], User.prototype, "reviews", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ProgressUpdate_1.ProgressUpdate, progressUpdate => progressUpdate.user),
    __metadata("design:type", Array)
], User.prototype, "progressUpdates", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Notification_1.Notification, notification => notification.user),
    __metadata("design:type", Array)
], User.prototype, "notifications", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => AuditLog_1.AuditLog, auditLog => auditLog.actor),
    __metadata("design:type", Array)
], User.prototype, "auditLogs", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Team_1.Team, team => team.lead),
    __metadata("design:type", Array)
], User.prototype, "ledTeams", void 0);
exports.User = User = __decorate([
    (0, typeorm_1.Entity)('user')
], User);
