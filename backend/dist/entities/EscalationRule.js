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
exports.EscalationRule = void 0;
const typeorm_1 = require("typeorm");
const Organization_1 = require("./Organization");
const Notification_1 = require("./Notification");
let EscalationRule = class EscalationRule {
};
exports.EscalationRule = EscalationRule;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], EscalationRule.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], EscalationRule.prototype, "orgId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Organization_1.Organization, organization => organization.escalationRules),
    (0, typeorm_1.JoinColumn)({ name: 'org_id' }),
    __metadata("design:type", Organization_1.Organization)
], EscalationRule.prototype, "organization", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], EscalationRule.prototype, "scope", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], EscalationRule.prototype, "trigger", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], EscalationRule.prototype, "offsetHours", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], EscalationRule.prototype, "targetRole", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar', length: 50,
        enum: Notification_1.NotificationChannel
    }),
    __metadata("design:type", String)
], EscalationRule.prototype, "channel", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], EscalationRule.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], EscalationRule.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], EscalationRule.prototype, "updatedAt", void 0);
exports.EscalationRule = EscalationRule = __decorate([
    (0, typeorm_1.Entity)('escalation_rule')
], EscalationRule);
