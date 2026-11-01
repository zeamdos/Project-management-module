"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const dotenv = __importStar(require("dotenv"));
const path_1 = __importDefault(require("path"));
const Organization_1 = require("../entities/Organization");
const User_1 = require("../entities/User");
const Project_1 = require("../entities/Project");
const Milestone_1 = require("../entities/Milestone");
const Team_1 = require("../entities/Team");
const TeamMember_1 = require("../entities/TeamMember");
const Task_1 = require("../entities/Task");
const TaskDependency_1 = require("../entities/TaskDependency");
const TaskRequiredSkill_1 = require("../entities/TaskRequiredSkill");
const Skill_1 = require("../entities/Skill");
const UserSkill_1 = require("../entities/UserSkill");
const Repository_1 = require("../entities/Repository");
const GitActivity_1 = require("../entities/GitActivity");
const Review_1 = require("../entities/Review");
const ProgressUpdate_1 = require("../entities/ProgressUpdate");
const Notification_1 = require("../entities/Notification");
const EscalationRule_1 = require("../entities/EscalationRule");
const AuditLog_1 = require("../entities/AuditLog");
const Policy_1 = require("../entities/Policy");
dotenv.config();
const entities = [
    Organization_1.Organization,
    User_1.User,
    Project_1.Project,
    Milestone_1.Milestone,
    Team_1.Team,
    TeamMember_1.TeamMember,
    Task_1.Task,
    TaskDependency_1.TaskDependency,
    TaskRequiredSkill_1.TaskRequiredSkill,
    Skill_1.Skill,
    UserSkill_1.UserSkill,
    Repository_1.Repository,
    GitActivity_1.GitActivity,
    Review_1.Review,
    ProgressUpdate_1.ProgressUpdate,
    Notification_1.Notification,
    EscalationRule_1.EscalationRule,
    AuditLog_1.AuditLog,
    Policy_1.Policy,
];
const isMySQLConfigured = process.env.DB_TYPE === 'mysql';
exports.AppDataSource = isMySQLConfigured
    ? new typeorm_1.DataSource({
        type: 'mysql',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        username: process.env.DB_USERNAME || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_DATABASE || 'project_management',
        synchronize: true,
        logging: false,
        entities,
    })
    : new typeorm_1.DataSource({
        type: 'sqlite',
        database: path_1.default.join(__dirname, '../../database.sqlite'),
        synchronize: true,
        logging: false,
        entities,
    });
