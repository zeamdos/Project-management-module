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
exports.Organization = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
const Project_1 = require("./Project");
const EscalationRule_1 = require("./EscalationRule");
const Policy_1 = require("./Policy");
const AuditLog_1 = require("./AuditLog");
let Organization = class Organization {
};
exports.Organization = Organization;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Organization.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], Organization.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json', nullable: true }),
    __metadata("design:type", Object)
], Organization.prototype, "settings", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], Organization.prototype, "plan", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10, default: 'en' }),
    __metadata("design:type", String)
], Organization.prototype, "defaultLanguage", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Organization.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Organization.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => User_1.User, user => user.organization),
    __metadata("design:type", Array)
], Organization.prototype, "users", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Project_1.Project, project => project.organization),
    __metadata("design:type", Array)
], Organization.prototype, "projects", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => EscalationRule_1.EscalationRule, rule => rule.organization),
    __metadata("design:type", Array)
], Organization.prototype, "escalationRules", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Policy_1.Policy, policy => policy.organization),
    __metadata("design:type", Array)
], Organization.prototype, "policies", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => AuditLog_1.AuditLog, auditLog => auditLog.organization),
    __metadata("design:type", Array)
], Organization.prototype, "auditLogs", void 0);
exports.Organization = Organization = __decorate([
    (0, typeorm_1.Entity)('organization')
], Organization);
