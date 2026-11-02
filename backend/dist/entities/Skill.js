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
exports.Skill = void 0;
// src/entities/Skill.ts
const typeorm_1 = require("typeorm");
const Organization_1 = require("./Organization");
const UserSkill_1 = require("./UserSkill");
const TaskRequiredSkill_1 = require("./TaskRequiredSkill");
let Skill = class Skill {
};
exports.Skill = Skill;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Skill.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Skill.prototype, "orgId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Organization_1.Organization, (org) => org.skills, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "org_id" }),
    __metadata("design:type", Organization_1.Organization)
], Skill.prototype, "organization", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Skill.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => UserSkill_1.UserSkill, (us) => us.skill, { cascade: true }),
    __metadata("design:type", Array)
], Skill.prototype, "userSkills", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => TaskRequiredSkill_1.TaskRequiredSkill, (trs) => trs.skill, { cascade: true }),
    __metadata("design:type", Array)
], Skill.prototype, "taskRequiredSkills", void 0);
exports.Skill = Skill = __decorate([
    (0, typeorm_1.Entity)("skills")
], Skill);
