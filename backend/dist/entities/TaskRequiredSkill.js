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
exports.TaskRequiredSkill = void 0;
const typeorm_1 = require("typeorm");
const Task_1 = require("./Task");
const Skill_1 = require("./Skill");
const UserSkill_1 = require("./UserSkill");
let TaskRequiredSkill = class TaskRequiredSkill {
};
exports.TaskRequiredSkill = TaskRequiredSkill;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], TaskRequiredSkill.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], TaskRequiredSkill.prototype, "taskId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Task_1.Task, task => task.requiredSkills),
    (0, typeorm_1.JoinColumn)({ name: 'task_id' }),
    __metadata("design:type", Task_1.Task)
], TaskRequiredSkill.prototype, "task", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], TaskRequiredSkill.prototype, "skillId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Skill_1.Skill, skill => skill.taskRequiredSkills),
    (0, typeorm_1.JoinColumn)({ name: 'skill_id' }),
    __metadata("design:type", Skill_1.Skill)
], TaskRequiredSkill.prototype, "skill", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar', length: 50,
        enum: UserSkill_1.Proficiency
    }),
    __metadata("design:type", String)
], TaskRequiredSkill.prototype, "minimumProficiency", void 0);
exports.TaskRequiredSkill = TaskRequiredSkill = __decorate([
    (0, typeorm_1.Entity)('task_required_skill')
], TaskRequiredSkill);
