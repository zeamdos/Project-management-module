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
exports.Task = exports.TaskRole = exports.TaskStatus = void 0;
const typeorm_1 = require("typeorm");
const Project_1 = require("./Project");
const Team_1 = require("./Team");
const User_1 = require("./User");
const Milestone_1 = require("./Milestone");
const TaskRequiredSkill_1 = require("./TaskRequiredSkill");
const TaskDependency_1 = require("./TaskDependency");
const Review_1 = require("./Review");
var TaskStatus;
(function (TaskStatus) {
    TaskStatus["TODO"] = "TODO";
    TaskStatus["IN_PROGRESS"] = "IN_PROGRESS";
    TaskStatus["IN_REVIEW"] = "IN_REVIEW";
    TaskStatus["DONE"] = "DONE";
    TaskStatus["BLOCKED"] = "BLOCKED";
    TaskStatus["PENDING"] = "PENDING";
})(TaskStatus || (exports.TaskStatus = TaskStatus = {}));
var TaskRole;
(function (TaskRole) {
    TaskRole["FRONTEND"] = "frontend";
    TaskRole["BACKEND"] = "backend";
    TaskRole["UI_UX"] = "ui_ux";
    TaskRole["AI"] = "ai";
})(TaskRole || (exports.TaskRole = TaskRole = {}));
let Task = class Task {
};
exports.Task = Task;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Task.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Task.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Project_1.Project, (project) => project.tasks, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "project_id" }),
    __metadata("design:type", Project_1.Project)
], Task.prototype, "project", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", nullable: true }),
    __metadata("design:type", Object)
], Task.prototype, "teamId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Team_1.Team, (team) => team.tasks, { onDelete: "SET NULL", nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "team_id" }),
    __metadata("design:type", Object)
], Task.prototype, "team", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", nullable: true }),
    __metadata("design:type", Object)
], Task.prototype, "assigneeId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, { onDelete: "SET NULL", nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "assignee_id" }),
    __metadata("design:type", Object)
], Task.prototype, "assignee", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", nullable: true }),
    __metadata("design:type", Object)
], Task.prototype, "milestoneId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Milestone_1.Milestone, (milestone) => milestone.tasks, { onDelete: "SET NULL", nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "milestone_id" }),
    __metadata("design:type", Object)
], Task.prototype, "milestone", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Task.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], Task.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: TaskStatus,
        default: TaskStatus.TODO,
    }),
    __metadata("design:type", String)
], Task.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: TaskRole,
    }),
    __metadata("design:type", String)
], Task.prototype, "requiredRole", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp", nullable: true }),
    __metadata("design:type", Object)
], Task.prototype, "deadline", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", nullable: true }),
    __metadata("design:type", Object)
], Task.prototype, "parentTaskId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Task, (task) => task.subtasks, { onDelete: "CASCADE", nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "parent_task_id" }),
    __metadata("design:type", Object)
], Task.prototype, "parentTask", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Task, (task) => task.parentTask, { cascade: true }),
    __metadata("design:type", Array)
], Task.prototype, "subtasks", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Task.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Task.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => TaskRequiredSkill_1.TaskRequiredSkill, (trs) => trs.task, { cascade: true }),
    __metadata("design:type", Array)
], Task.prototype, "requiredSkills", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => TaskDependency_1.TaskDependency, (td) => td.task, { cascade: true }),
    __metadata("design:type", Array)
], Task.prototype, "dependencies", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Review_1.Review, (review) => review.task, { cascade: true }),
    __metadata("design:type", Array)
], Task.prototype, "reviews", void 0);
exports.Task = Task = __decorate([
    (0, typeorm_1.Entity)("tasks")
], Task);
