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
exports.Task = exports.TaskPriority = exports.TaskStatus = void 0;
const typeorm_1 = require("typeorm");
const Project_1 = require("./Project");
const Team_1 = require("./Team");
const User_1 = require("./User");
const TaskDependency_1 = require("./TaskDependency");
const TaskRequiredSkill_1 = require("./TaskRequiredSkill");
const GitActivity_1 = require("./GitActivity");
const Review_1 = require("./Review");
var TaskStatus;
(function (TaskStatus) {
    TaskStatus["TODO"] = "todo";
    TaskStatus["IN_PROGRESS"] = "in_progress";
    TaskStatus["IN_REVIEW"] = "in_review";
    TaskStatus["DONE"] = "done";
    TaskStatus["BLOCKED"] = "blocked";
})(TaskStatus || (exports.TaskStatus = TaskStatus = {}));
var TaskPriority;
(function (TaskPriority) {
    TaskPriority["LOW"] = "low";
    TaskPriority["MEDIUM"] = "medium";
    TaskPriority["HIGH"] = "high";
    TaskPriority["CRITICAL"] = "critical";
})(TaskPriority || (exports.TaskPriority = TaskPriority = {}));
let Task = class Task {
};
exports.Task = Task;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Task.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], Task.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Project_1.Project, project => project.tasks),
    (0, typeorm_1.JoinColumn)({ name: 'project_id' }),
    __metadata("design:type", Project_1.Project)
], Task.prototype, "project", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], Task.prototype, "teamId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Team_1.Team, team => team.tasks),
    (0, typeorm_1.JoinColumn)({ name: 'team_id' }),
    __metadata("design:type", Team_1.Team)
], Task.prototype, "team", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], Task.prototype, "assigneeId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, user => user.assignedTasks),
    (0, typeorm_1.JoinColumn)({ name: 'assignee_id' }),
    __metadata("design:type", User_1.User)
], Task.prototype, "assignee", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], Task.prototype, "parentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Task, task => task.subtasks),
    (0, typeorm_1.JoinColumn)({ name: 'parent_id' }),
    __metadata("design:type", Task)
], Task.prototype, "parent", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], Task.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Task.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Task.prototype, "acceptanceCriteria", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar', length: 50,
        enum: TaskPriority,
        default: TaskPriority.MEDIUM
    }),
    __metadata("design:type", String)
], Task.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], Task.prototype, "estimateHours", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar', length: 50,
        enum: TaskStatus,
        default: TaskStatus.TODO
    }),
    __metadata("design:type", String)
], Task.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Object)
], Task.prototype, "deadline", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Task.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Task.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Task, task => task.parent),
    __metadata("design:type", Array)
], Task.prototype, "subtasks", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => TaskDependency_1.TaskDependency, taskDependency => taskDependency.task),
    __metadata("design:type", Array)
], Task.prototype, "dependencies", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => TaskDependency_1.TaskDependency, taskDependency => taskDependency.dependsOnTask),
    __metadata("design:type", Array)
], Task.prototype, "dependentTasks", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => TaskRequiredSkill_1.TaskRequiredSkill, taskRequiredSkill => taskRequiredSkill.task),
    __metadata("design:type", Array)
], Task.prototype, "requiredSkills", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => GitActivity_1.GitActivity, gitActivity => gitActivity.task),
    __metadata("design:type", Array)
], Task.prototype, "gitActivities", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Review_1.Review, review => review.task),
    __metadata("design:type", Array)
], Task.prototype, "reviews", void 0);
exports.Task = Task = __decorate([
    (0, typeorm_1.Entity)('task')
], Task);
