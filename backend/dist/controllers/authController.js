"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDevelopers = exports.updateProfile = exports.getProfile = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const data_source_1 = require("../config/data-source");
const User_1 = require("../entities/User");
const Organization_1 = require("../entities/Organization");
const Skill_1 = require("../entities/Skill");
const UserSkill_1 = require("../entities/UserSkill");
const config_1 = require("../config");
const userRepository = data_source_1.AppDataSource.getRepository(User_1.User);
const orgRepository = data_source_1.AppDataSource.getRepository(Organization_1.Organization);
const skillRepository = data_source_1.AppDataSource.getRepository(Skill_1.Skill);
const userSkillRepository = data_source_1.AppDataSource.getRepository(UserSkill_1.UserSkill);
const register = async (req, res) => {
    try {
        const { name, email, phone, password, role = User_1.UserRole.DEVELOPER, team, // 'ui_ux' | 'frontend' | 'backend'
        specialty, skills, // array or comma-separated string
        githubUsername, telegramId, orgName } = req.body;
        // Validation: Phone and Team are required for developers
        const chosenRole = role === 'manager' || role === User_1.UserRole.MANAGER ? User_1.UserRole.MANAGER : User_1.UserRole.DEVELOPER;
        const devSpecialty = team || specialty || 'frontend';
        if (chosenRole === User_1.UserRole.DEVELOPER) {
            if (!phone) {
                return res.status(400).json({ error: 'Phone number is required for developers' });
            }
            if (!devSpecialty) {
                return res.status(400).json({ error: 'Team (UI/UX, Frontend, or Backend) is required' });
            }
            if (!skills || (Array.isArray(skills) && skills.length === 0)) {
                return res.status(400).json({ error: 'Developer skills are required' });
            }
        }
        // Check if user exists by email or phone
        const existingByEmail = email ? await userRepository.findOne({ where: { email } }) : null;
        if (existingByEmail) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }
        if (phone) {
            const existingByPhone = await userRepository.findOne({ where: { phone } });
            if (existingByPhone) {
                return res.status(400).json({ error: 'User with this phone number already exists' });
            }
        }
        // Hash password
        const passwordHash = await bcryptjs_1.default.hash(password || '123456', 10);
        // Create or get organization
        let organization;
        const targetOrg = orgName || 'Default Workspace';
        organization = await orgRepository.findOne({ where: { name: targetOrg } });
        if (!organization) {
            organization = orgRepository.create({ name: targetOrg });
            await orgRepository.save(organization);
        }
        // Create user
        const user = new User_1.User();
        user.name = name;
        user.email = email || `${phone || Date.now()}@workspace.local`;
        user.phone = phone || null;
        user.passwordHash = passwordHash;
        user.role = chosenRole;
        user.orgId = organization.id;
        user.status = User_1.UserStatus.ACTIVE;
        user.specialty = devSpecialty;
        user.githubUsername = githubUsername || null;
        user.telegramId = telegramId ? String(telegramId) : null;
        await userRepository.save(user);
        // Parse and save skills
        const skillList = Array.isArray(skills)
            ? skills
            : typeof skills === 'string'
                ? skills.split(',').map((s) => s.trim()).filter(Boolean)
                : [];
        for (const skillName of skillList) {
            let skillEntity = await skillRepository.findOne({ where: { name: skillName } });
            if (!skillEntity) {
                skillEntity = skillRepository.create({
                    name: skillName,
                    specialty: devSpecialty,
                    status: Skill_1.SkillStatus.ACTIVE,
                });
                await skillRepository.save(skillEntity);
            }
            const userSkill = userSkillRepository.create({
                userId: user.id,
                skillId: skillEntity.id,
                proficiency: UserSkill_1.Proficiency.INTERMEDIATE,
                yearsExperience: 1,
            });
            await userSkillRepository.save(userSkill);
        }
        // Generate token
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role, orgId: user.orgId }, config_1.config.jwt.secret, { expiresIn: config_1.config.jwt.expiresIn });
        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                specialty: user.specialty,
                githubUsername: user.githubUsername,
                telegramId: user.telegramId,
                skills: skillList,
            },
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, phone, phoneOrEmail, password } = req.body;
        const identifier = (phoneOrEmail || email || phone || '').trim();
        if (!identifier || !password) {
            return res.status(400).json({ error: 'Phone/Email and password are required' });
        }
        // Find user by email OR phone
        let user = await userRepository.findOne({ where: { email: identifier } });
        if (!user) {
            user = await userRepository.findOne({ where: { phone: identifier } });
        }
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Check password
        const isValidPassword = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Check status
        if (user.status !== User_1.UserStatus.ACTIVE) {
            return res.status(403).json({ error: 'Account is not active' });
        }
        // Fetch user skills
        const userSkills = await userSkillRepository.find({
            where: { userId: user.id },
            relations: ['skill'],
        });
        const skills = userSkills.map(us => us.skill?.name).filter(Boolean);
        // Generate token
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role, orgId: user.orgId }, config_1.config.jwt.secret, { expiresIn: config_1.config.jwt.expiresIn });
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                specialty: user.specialty,
                githubUsername: user.githubUsername,
                telegramId: user.telegramId,
                skills,
                orgId: user.orgId,
            },
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.login = login;
const getProfile = async (req, res) => {
    try {
        const user = await userRepository.findOne({
            where: { id: req.userId },
            relations: ['organization'],
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const userSkills = await userSkillRepository.find({
            where: { userId: user.id },
            relations: ['skill'],
        });
        const skills = userSkills.map(us => us.skill?.name).filter(Boolean);
        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            specialty: user.specialty,
            telegramId: user.telegramId,
            githubUsername: user.githubUsername,
            timezone: user.timezone,
            language: user.language,
            status: user.status,
            skills,
            organization: user.organization
                ? {
                    id: user.organization.id,
                    name: user.organization.name,
                }
                : null,
        });
    }
    catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getProfile = getProfile;
const updateProfile = async (req, res) => {
    try {
        const { name, specialty, phone, telegramId, githubUsername, timezone, language, skills } = req.body;
        const user = await userRepository.findOne({ where: { id: req.userId } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (name)
            user.name = name;
        if (specialty !== undefined)
            user.specialty = specialty;
        if (phone !== undefined)
            user.phone = phone;
        if (telegramId !== undefined)
            user.telegramId = telegramId ? String(telegramId) : null;
        if (githubUsername !== undefined)
            user.githubUsername = githubUsername;
        if (timezone !== undefined)
            user.timezone = timezone;
        if (language !== undefined)
            user.language = language;
        await userRepository.save(user);
        if (skills && Array.isArray(skills)) {
            await userSkillRepository.delete({ userId: user.id });
            for (const skillName of skills) {
                let skillEntity = await skillRepository.findOne({ where: { name: skillName } });
                if (!skillEntity) {
                    skillEntity = skillRepository.create({
                        name: skillName,
                        specialty: user.specialty || 'general',
                        status: Skill_1.SkillStatus.ACTIVE,
                    });
                    await skillRepository.save(skillEntity);
                }
                await userSkillRepository.save(userSkillRepository.create({
                    userId: user.id,
                    skillId: skillEntity.id,
                    proficiency: UserSkill_1.Proficiency.INTERMEDIATE,
                    yearsExperience: 1,
                }));
            }
        }
        const updatedUserSkills = await userSkillRepository.find({
            where: { userId: user.id },
            relations: ['skill'],
        });
        res.json({
            message: 'Profile updated successfully',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                specialty: user.specialty,
                telegramId: user.telegramId,
                githubUsername: user.githubUsername,
                skills: updatedUserSkills.map(us => us.skill?.name).filter(Boolean),
                timezone: user.timezone,
                language: user.language,
            },
        });
    }
    catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.updateProfile = updateProfile;
const getDevelopers = async (req, res) => {
    try {
        const developers = await userRepository.find({
            where: { orgId: req.orgId, role: User_1.UserRole.DEVELOPER },
            order: { name: 'ASC' },
        });
        const results = await Promise.all(developers.map(async (dev) => {
            const uSkills = await userSkillRepository.find({
                where: { userId: dev.id },
                relations: ['skill'],
            });
            return {
                id: dev.id,
                name: dev.name,
                email: dev.email,
                phone: dev.phone,
                specialty: dev.specialty,
                githubUsername: dev.githubUsername,
                telegramId: dev.telegramId,
                skills: uSkills.map(s => s.skill?.name).filter(Boolean),
            };
        }));
        res.json({ developers: results });
    }
    catch (error) {
        console.error('Get developers error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getDevelopers = getDevelopers;
