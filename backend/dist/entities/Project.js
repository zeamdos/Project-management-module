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
exports.Project = exports.ProjectHealth = exports.ProjectStatus = void 0;
const typeorm_1 = require("typeorm");
const Organization_1 = require("./Organization");
const Milestone_1 = require("./Milestone");
const Team_1 = require("./Team");
const Task_1 = require("./Task");
const Repository_1 = require("./Repository");
const ProgressUpdate_1 = require("./ProgressUpdate");
var ProjectStatus;
(function (ProjectStatus) {
    ProjectStatus["PLANNING"] = "planning";
    ProjectStatus["ACTIVE"] = "active";
    ProjectStatus["ON_HOLD"] = "on_hold";
    ProjectStatus["COMPLETED"] = "completed";
    ProjectStatus["CANCELLED"] = "cancelled";
})(ProjectStatus || (exports.ProjectStatus = ProjectStatus = {}));
var ProjectHealth;
(function (ProjectHealth) {
    ProjectHealth["ON_TRACK"] = "on_track";
    ProjectHealth["AT_RISK"] = "at_risk";
    ProjectHealth["CRITICAL"] = "critical";
})(ProjectHealth || (exports.ProjectHealth = ProjectHealth = {}));
let Project = class Project {
};
exports.Project = Project;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Project.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], Project.prototype, "orgId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Organization_1.Organization, organization => organization.projects),
    (0, typeorm_1.JoinColumn)({ name: 'org_id' }),
    __metadata("design:type", Organization_1.Organization)
], Project.prototype, "organization", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], Project.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Project.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Project.prototype, "goals", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json', nullable: true }),
    __metadata("design:type", Object)
], Project.prototype, "techStack", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Object)
], Project.prototype, "startDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Object)
], Project.prototype, "deadline", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 7 }),
    __metadata("design:type", Number)
], Project.prototype, "updateIntervalDays", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar', length: 50,
        enum: ProjectStatus,
        default: ProjectStatus.PLANNING
    }),
    __metadata("design:type", String)
], Project.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar', length: 50,
        enum: ProjectHealth,
        default: ProjectHealth.ON_TRACK
    }),
    __metadata("design:type", String)
], Project.prototype, "health", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Project.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Project.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Milestone_1.Milestone, milestone => milestone.project),
    __metadata("design:type", Array)
], Project.prototype, "milestones", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Team_1.Team, team => team.project),
    __metadata("design:type", Array)
], Project.prototype, "teams", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Task_1.Task, task => task.project),
    __metadata("design:type", Array)
], Project.prototype, "tasks", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Repository_1.Repository, repository => repository.project),
    __metadata("design:type", Array)
], Project.prototype, "repositories", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ProgressUpdate_1.ProgressUpdate, progressUpdate => progressUpdate.project),
    __metadata("design:type", Array)
], Project.prototype, "progressUpdates", void 0);
exports.Project = Project = __decorate([
    (0, typeorm_1.Entity)('project')
], Project);
