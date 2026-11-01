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
exports.Review = exports.ReviewDecision = void 0;
const typeorm_1 = require("typeorm");
const Task_1 = require("./Task");
const User_1 = require("./User");
var ReviewDecision;
(function (ReviewDecision) {
    ReviewDecision["APPROVED"] = "approved";
    ReviewDecision["CHANGES_REQUESTED"] = "changes_requested";
    ReviewDecision["REJECTED"] = "rejected";
})(ReviewDecision || (exports.ReviewDecision = ReviewDecision = {}));
let Review = class Review {
};
exports.Review = Review;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Review.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], Review.prototype, "prOrTaskId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Task_1.Task, task => task.reviews),
    (0, typeorm_1.JoinColumn)({ name: 'pr_or_task_id' }),
    __metadata("design:type", Task_1.Task)
], Review.prototype, "task", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], Review.prototype, "reviewerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, user => user.reviews),
    (0, typeorm_1.JoinColumn)({ name: 'reviewer_id' }),
    __metadata("design:type", User_1.User)
], Review.prototype, "reviewer", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar', length: 50,
        enum: ReviewDecision,
        nullable: true
    }),
    __metadata("design:type", Object)
], Review.prototype, "decision", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Review.prototype, "comment", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Object)
], Review.prototype, "reviewDate", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Review.prototype, "createdAt", void 0);
exports.Review = Review = __decorate([
    (0, typeorm_1.Entity)('review')
], Review);
