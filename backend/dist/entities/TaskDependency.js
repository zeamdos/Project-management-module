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
exports.TaskDependency = void 0;
const typeorm_1 = require("typeorm");
const Task_1 = require("./Task");
let TaskDependency = class TaskDependency {
};
exports.TaskDependency = TaskDependency;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], TaskDependency.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], TaskDependency.prototype, "taskId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Task_1.Task, task => task.dependencies),
    (0, typeorm_1.JoinColumn)({ name: 'task_id' }),
    __metadata("design:type", Task_1.Task)
], TaskDependency.prototype, "task", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], TaskDependency.prototype, "dependsOnTaskId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Task_1.Task, task => task.dependentTasks),
    (0, typeorm_1.JoinColumn)({ name: 'depends_on_task_id' }),
    __metadata("design:type", Task_1.Task)
], TaskDependency.prototype, "dependsOnTask", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TaskDependency.prototype, "createdAt", void 0);
exports.TaskDependency = TaskDependency = __decorate([
    (0, typeorm_1.Entity)('task_dependency')
], TaskDependency);
