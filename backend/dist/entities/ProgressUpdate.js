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
exports.ProgressUpdate = exports.Confidence = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
const Project_1 = require("./Project");
var Confidence;
(function (Confidence) {
    Confidence["LOW"] = "low";
    Confidence["MEDIUM"] = "medium";
    Confidence["HIGH"] = "high";
})(Confidence || (exports.Confidence = Confidence = {}));
let ProgressUpdate = class ProgressUpdate {
};
exports.ProgressUpdate = ProgressUpdate;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ProgressUpdate.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], ProgressUpdate.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, user => user.progressUpdates),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", User_1.User)
], ProgressUpdate.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], ProgressUpdate.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Project_1.Project, project => project.progressUpdates),
    (0, typeorm_1.JoinColumn)({ name: 'project_id' }),
    __metadata("design:type", Project_1.Project)
], ProgressUpdate.prototype, "project", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], ProgressUpdate.prototype, "cycle", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], ProgressUpdate.prototype, "workDone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], ProgressUpdate.prototype, "nextSteps", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], ProgressUpdate.prototype, "blockers", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar', length: 50,
        enum: Confidence
    }),
    __metadata("design:type", String)
], ProgressUpdate.prototype, "confidence", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime' }),
    __metadata("design:type", Date)
], ProgressUpdate.prototype, "updateDate", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ProgressUpdate.prototype, "createdAt", void 0);
exports.ProgressUpdate = ProgressUpdate = __decorate([
    (0, typeorm_1.Entity)('progress_update')
], ProgressUpdate);
