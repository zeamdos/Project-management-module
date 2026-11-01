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
exports.UserSkill = exports.Proficiency = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
const Skill_1 = require("./Skill");
var Proficiency;
(function (Proficiency) {
    Proficiency["BEGINNER"] = "beginner";
    Proficiency["INTERMEDIATE"] = "intermediate";
    Proficiency["ADVANCED"] = "advanced";
    Proficiency["EXPERT"] = "expert";
})(Proficiency || (exports.Proficiency = Proficiency = {}));
let UserSkill = class UserSkill {
};
exports.UserSkill = UserSkill;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], UserSkill.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], UserSkill.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, user => user.skills),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", User_1.User)
], UserSkill.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], UserSkill.prototype, "skillId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Skill_1.Skill, skill => skill.userSkills),
    (0, typeorm_1.JoinColumn)({ name: 'skill_id' }),
    __metadata("design:type", Skill_1.Skill)
], UserSkill.prototype, "skill", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar', length: 50,
        enum: Proficiency
    }),
    __metadata("design:type", String)
], UserSkill.prototype, "proficiency", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], UserSkill.prototype, "yearsExperience", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], UserSkill.prototype, "confirmedBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], UserSkill.prototype, "createdAt", void 0);
exports.UserSkill = UserSkill = __decorate([
    (0, typeorm_1.Entity)('user_skill')
], UserSkill);
