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
exports.GitActivity = exports.GitActivityType = void 0;
// src/entities/GitActivity.ts
const typeorm_1 = require("typeorm");
const Repository_1 = require("./Repository");
const User_1 = require("./User");
const Task_1 = require("./Task");
var GitActivityType;
(function (GitActivityType) {
    GitActivityType["COMMIT"] = "COMMIT";
    GitActivityType["PULL_REQUEST"] = "PULL_REQUEST";
    GitActivityType["PR_REVIEW"] = "PR_REVIEW";
})(GitActivityType || (exports.GitActivityType = GitActivityType = {}));
let GitActivity = class GitActivity {
};
exports.GitActivity = GitActivity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], GitActivity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int" }),
    __metadata("design:type", Number)
], GitActivity.prototype, "repositoryId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Repository_1.Repository, (repo) => repo.gitActivities, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "repository_id" }),
    __metadata("design:type", Repository_1.Repository)
], GitActivity.prototype, "repository", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", nullable: true }),
    __metadata("design:type", Object)
], GitActivity.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, { onDelete: "SET NULL", nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "user_id" }),
    __metadata("design:type", Object)
], GitActivity.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", nullable: true }),
    __metadata("design:type", Object)
], GitActivity.prototype, "taskId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Task_1.Task, { onDelete: "SET NULL", nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "task_id" }),
    __metadata("design:type", Object)
], GitActivity.prototype, "task", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: GitActivityType,
    }),
    __metadata("design:type", String)
], GitActivity.prototype, "activityType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar" }),
    __metadata("design:type", String)
], GitActivity.prototype, "externalId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], GitActivity.prototype, "message", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", nullable: true }),
    __metadata("design:type", Object)
], GitActivity.prototype, "url", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], GitActivity.prototype, "createdAt", void 0);
exports.GitActivity = GitActivity = __decorate([
    (0, typeorm_1.Entity)("git_activities")
], GitActivity);
