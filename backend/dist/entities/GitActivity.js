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
const typeorm_1 = require("typeorm");
const Repository_1 = require("./Repository");
const User_1 = require("./User");
const Task_1 = require("./Task");
var GitActivityType;
(function (GitActivityType) {
    GitActivityType["COMMIT"] = "commit";
    GitActivityType["PULL_REQUEST"] = "pull_request";
    GitActivityType["REVIEW"] = "review";
})(GitActivityType || (exports.GitActivityType = GitActivityType = {}));
let GitActivity = class GitActivity {
};
exports.GitActivity = GitActivity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], GitActivity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], GitActivity.prototype, "repoId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Repository_1.Repository, repository => repository.gitActivities),
    (0, typeorm_1.JoinColumn)({ name: 'repo_id' }),
    __metadata("design:type", Repository_1.Repository)
], GitActivity.prototype, "repository", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], GitActivity.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, user => user.gitActivities),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", User_1.User)
], GitActivity.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], GitActivity.prototype, "taskId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Task_1.Task, task => task.gitActivities),
    (0, typeorm_1.JoinColumn)({ name: 'task_id' }),
    __metadata("design:type", Task_1.Task)
], GitActivity.prototype, "task", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar', length: 50,
        enum: GitActivityType
    }),
    __metadata("design:type", String)
], GitActivity.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], GitActivity.prototype, "reference", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", Object)
], GitActivity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json', nullable: true }),
    __metadata("design:type", Object)
], GitActivity.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime' }),
    __metadata("design:type", Date)
], GitActivity.prototype, "timestamp", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], GitActivity.prototype, "createdAt", void 0);
exports.GitActivity = GitActivity = __decorate([
    (0, typeorm_1.Entity)('git_activity')
], GitActivity);
