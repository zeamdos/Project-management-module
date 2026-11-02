"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AITaskService = void 0;
const openai_1 = __importDefault(require("openai"));
const typeorm_1 = require("typeorm");
const data_source_1 = require("../config/data-source");
const Team_1 = require("../entities/Team");
const Task_1 = require("../entities/Task");
const User_1 = require("../entities/User");
const NotificationService_1 = require("./NotificationService");
// Task.requiredRole -> User.specialty (compared in lower case)
const ROLE_TO_SPECIALTY = {
    [Task_1.TaskRole.FRONTEND]: "frontend",
    [Task_1.TaskRole.BACKEND]: "backend",
    [Task_1.TaskRole.UI_UX]: "ui/ux",
    [Task_1.TaskRole.AI]: "ai",
};
// Extra people in a team (more people than work areas) support and review another area.
const reviewArea = (forTitle) => ({
    title: `Review and support: ${forTitle}`,
    steps: [
        `Find the person who owns "${forTitle}" (see who does what above) and ask what is hardest or slowest in their part.`,
        "Read every pull request for that area within a day and leave clear comments.",
        "Write tests or documentation for that area, and fix small bugs you find.",
        "Take over any piece the owner hands you, and say in your update note what you took.",
    ],
    handIn: ["Review comments on the pull requests of that area", "Tests or documentation for that area"],
    doneWhen: ["Every pull request in that area has been reviewed", "The tests you wrote pass"],
});
const ROLES = [
    {
        role: Task_1.TaskRole.UI_UX,
        team: "UI/UX",
        pattern: /\b(ux|ui|ui\/ux|design|wireframes?|mockups?|prototype|figma)\b/,
        title: "UI/UX design",
        goal: "Design every screen and the user flow, so the Frontend team can build without guessing.",
        share: 0.3,
        areas: [
            {
                title: "User flow and wireframes",
                steps: [
                    "List every screen the project needs, using the PM notes (for example login, main page, forms, admin).",
                    "Draw the user flow: what the user does first, next, and what happens when something goes wrong.",
                    "Sketch a wireframe for each screen (rough layout only) and share them with the team.",
                ],
                handIn: ["The user flow", "Wireframes for all screens"],
                doneWhen: ["Every screen in the PM notes has a wireframe", "Your PM has reviewed the flow"],
            },
            {
                title: "Prototype and visual style",
                steps: [
                    "Choose the colors, fonts and spacing and write them down.",
                    "Turn the wireframes into a clickable prototype in Figma.",
                    "Design the empty, loading and error state of every screen.",
                ],
                handIn: ["A clickable prototype link", "A short style guide"],
                doneWhen: ["The main flow can be clicked through from start to end", "Your PM approved the look"],
            },
            {
                title: "Design spec and hand-off",
                steps: [
                    "List every component (buttons, forms, cards) with sizes and states.",
                    "Export icons and images, and add the Figma link and exports to a /design folder in the repository.",
                    "Walk the Frontend team through the design and answer their questions.",
                ],
                handIn: ["A design spec", "The /design folder in the repository"],
                doneWhen: ["The Frontend developers can build every screen without asking what it should look like"],
            },
            {
                title: "Design review and usability check",
                steps: [
                    "Let 2 or 3 people try the prototype and write down where they get stuck.",
                    "Fix the problems you found in the design.",
                    "Compare the built pages with the design and leave comments on the Frontend pull requests.",
                ],
                handIn: ["A list of problems found and fixed", "Review comments on the Frontend pull requests"],
                doneWhen: ["The built pages match the approved design"],
            },
        ],
    },
    {
        role: Task_1.TaskRole.FRONTEND,
        team: "Frontend",
        pattern: /\b(frontend|front-end|react|vue|angular|pages?|screens?|dashboard|forms?|website|web app)\b/,
        title: "Frontend development",
        goal: "Build the screens users see and connect them to the backend API.",
        share: 0.85,
        areas: [
            {
                title: "Project setup and sign-in pages",
                steps: [
                    "Set up the app in the repository (for example React, TypeScript and Vite) with clear folders: pages, components, services.",
                    "Set up page routing and one shared API file that every page uses.",
                    "Build the login and register pages and connect them to the Backend sign-in.",
                ],
                handIn: ["A running app", "Working sign-in and sign-out"],
                doneWhen: ["A user can sign in and out", "Others can run the app by following the README"],
            },
            {
                title: "Main pages and components",
                steps: [
                    "Build each main page from the UI/UX design.",
                    "Build reusable components (buttons, forms, cards) that the others can use too.",
                    "Use placeholder data until the API is ready.",
                ],
                handIn: ["All main pages", "A set of reusable components"],
                doneWhen: ["The pages match the approved design"],
            },
            {
                title: "Connecting pages to the API",
                steps: [
                    "Get the endpoint list from the Backend team and agree any change with them.",
                    "Connect every page to the API through the shared API file.",
                    "Show a loading state, an empty state and a clear error message on every page.",
                ],
                handIn: ["Pages that show real data"],
                doneWhen: ["No page uses fake data any more", "Errors show a message instead of a blank page"],
            },
            {
                title: "Phone layout and polish",
                steps: [
                    "Make every page work on a phone and on a desktop.",
                    "Check keyboard use and readable contrast.",
                    "Fix spacing and small details so the pages match the design.",
                ],
                handIn: ["Responsive pages"],
                doneWhen: ["No page scrolls sideways on a phone", "The pages match the design"],
            },
            {
                title: "Testing and bug fixes",
                steps: [
                    "Click through every flow and write down each bug you find.",
                    "Fix the bugs, or pass them to the person who owns that area.",
                    "Write in the README how to install and run the app.",
                ],
                handIn: ["The bug list", "The README with run steps"],
                doneWhen: ["The main flows work without errors", "Your PM can run the app by following the README"],
            },
        ],
    },
    {
        role: Task_1.TaskRole.BACKEND,
        team: "Backend",
        pattern: /\b(backend|back-end|api|apis|database|server|auth|authentication|endpoints?|sql|node)\b/,
        title: "Backend and database",
        goal: "Build the API and the database that the rest of the project depends on.",
        share: 0.7,
        areas: [
            {
                title: "Database design and setup",
                steps: [
                    "List the data the project stores, using the PM notes (for example users and tickets).",
                    "Draw the tables and how they link to each other.",
                    "Set up the server in the repository (for example Node, Express and TypeScript) with a database connection and a .env.example file. Never commit real secrets.",
                    "Create the tables and check they were created correctly.",
                ],
                handIn: ["A running server with the tables", "A .env.example with the variable names only"],
                doneWhen: ["The tables match your plan", "Your teammates can connect to the database"],
            },
            {
                title: "Sign-in and security",
                steps: [
                    "Build registration and sign-in with hashed passwords.",
                    "Give out token-based sessions (JWT) and protect the private routes.",
                    "Add roles, and a limit on failed sign-in attempts.",
                ],
                handIn: ["Working sign-in and registration endpoints"],
                doneWhen: ["A wrong password is rejected", "Private routes are closed without a token"],
            },
            {
                title: "Core API endpoints",
                steps: [
                    "Agree the endpoint names with the Frontend team before you build them.",
                    "Build create, list, read, update and delete for the main data.",
                    "Return clear JSON that the Frontend can use directly.",
                ],
                handIn: ["The main endpoints, working"],
                doneWhen: ["The Frontend developers can use every endpoint without asking you for changes"],
            },
            {
                title: "Validation, errors and logging",
                steps: [
                    "Validate every input before it reaches the database.",
                    "Return clear error messages with the right status codes.",
                    "Log errors without writing secrets into the logs.",
                ],
                handIn: ["Validated endpoints with clear errors"],
                doneWhen: ["Bad input never crashes the server", "Every error tells the caller what went wrong"],
            },
            {
                title: "API documentation and testing",
                steps: [
                    "Write the endpoint list (method, path, request, response) in the README.",
                    "Test every endpoint, including wrong input.",
                    "Write in the README how to install and run the server.",
                ],
                handIn: ["The endpoint list in the README", "Your test results"],
                doneWhen: ["Frontend and AI can use the API from the README alone"],
            },
        ],
    },
    {
        role: Task_1.TaskRole.AI,
        team: "AI",
        pattern: /\b(ai|ml|machine learning|chatbot|nlp|llm|recommendation|prediction|neural)\b/,
        title: "AI features",
        goal: "Build the AI part of the project and make it easy for the Backend to call.",
        share: 0.75,
        areas: [
            {
                title: "Data and samples",
                steps: [
                    "Write down exactly what the AI part must do, using the PM notes (for example answer questions or suggest a category).",
                    "Collect or write at least 20 examples of real input and the answer you expect.",
                    "Split them into examples to practise with and examples kept only for testing.",
                ],
                handIn: ["A sample data file", "A one-page description of what the AI must do"],
                doneWhen: ["Your PM agrees that the examples show what is wanted"],
            },
            {
                title: "Build the AI feature",
                steps: [
                    "Choose an approach (for example a prompt to an LLM service, or a small classifier).",
                    "Build a first version and try it on your practice examples.",
                    "Improve the prompts or rules for the cases it gets wrong.",
                ],
                handIn: ["A working first version"],
                doneWhen: ["It handles most of your practice examples correctly"],
            },
            {
                title: "Connecting it to the backend",
                steps: [
                    "Wrap it in one clear function or endpoint with a simple input and output.",
                    "Agree the format with the Backend team.",
                    "Handle failures safely (timeout, empty input, unknown question) with a default answer.",
                    "Keep API keys in .env only, never in the repository.",
                ],
                handIn: ["The function or endpoint", "Notes on the input and output format"],
                doneWhen: ["The Backend developers can call it", "A failure returns a safe default answer"],
            },
            {
                title: "Testing and quality",
                steps: [
                    "Run the examples kept for testing and count how often the answer is right.",
                    "Fix the worst mistakes and test again.",
                    "Write in the README how to run and test the AI part.",
                ],
                handIn: ["Your test results", "The README"],
                doneWhen: ["It answers the test examples correctly most of the time (ask your PM for the target)"],
            },
        ],
    },
];
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "team";
const day = (d) => d.toISOString().slice(0, 10);
const flat = (lists) => [].concat(...lists);
class AITaskService {
    /**
     * Main entry point: decomposes project requirements into structured tasks.
     * If OPENAI_API_KEY is configured, uses OpenAI GPT-4o-mini for intelligent task breakdown and developer matching.
     * Seamlessly falls back to heuristic engine if OpenAI is not configured or encounters errors.
     */
    static async processAndAssignProject(projectId, description, orgId, brief) {
        const info = {
            name: brief?.name || "Project",
            deadline: brief?.deadline ?? null,
            requirements: brief?.requirements ?? null,
            repoUrl: brief?.repoUrl ?? null,
        };
        const apiKey = process.env.OPENAI_API_KEY?.trim();
        if (apiKey && apiKey.startsWith("sk-")) {
            try {
                console.log(`[AITaskService] Decomposing project #${projectId} using OpenAI...`);
                const aiTasks = await this.decomposeWithOpenAI(projectId, description, orgId, info);
                if (aiTasks && aiTasks.length > 0) {
                    console.log(`[AITaskService] Successfully decomposed project #${projectId} into ${aiTasks.length} AI-generated tasks.`);
                    return aiTasks;
                }
            }
            catch (err) {
                console.warn(`[AITaskService] OpenAI API error (${err?.message || err}). Falling back to heuristic engine.`);
            }
        }
        return this.processWithHeuristics(projectId, description, orgId, info);
    }
    /**
     * Real AI Task Decomposition using OpenAI API
     */
    static async decomposeWithOpenAI(projectId, description, orgId, info) {
        const apiKey = process.env.OPENAI_API_KEY?.trim();
        if (!apiKey)
            return null;
        const userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
        const taskRepo = data_source_1.AppDataSource.getRepository(Task_1.Task);
        const teamRepo = data_source_1.AppDataSource.getRepository(Team_1.Team);
        const allDevs = await userRepo.find({
            where: { orgId, role: User_1.UserRole.DEVELOPER, status: User_1.UserStatus.ACTIVE },
        });
        const devProfiles = await Promise.all(allDevs.map(async (d) => {
            const activeTasks = await taskRepo.count({
                where: { assigneeId: d.id, status: (0, typeorm_1.Not)(Task_1.TaskStatus.DONE) },
            });
            return {
                id: d.id,
                name: d.name,
                email: d.email,
                specialty: (d.specialty || "frontend").toLowerCase(),
                activeTasks,
            };
        }));
        const openai = new openai_1.default({ apiKey });
        const systemPrompt = `You are a Principal Technical Architect & Engineering Manager in an enterprise software organization.
Decompose project briefs into granular, enterprise-ready technical tasks for developers across disciplines (frontend, backend, ui/ux, ai).
Distribute tasks across available developers by matching technical specialty and balancing active workload.
Output valid JSON only.`;
        const userPrompt = `Decompose this enterprise software project into discrete engineering tasks:

PROJECT NAME: ${info.name}
DESCRIPTION: ${description}
REQUIREMENTS: ${info.requirements || "Standard enterprise requirements (clean architecture, unit tests, responsive UI, secure APIs)"}
TARGET DEADLINE: ${info.deadline ? info.deadline.toISOString().slice(0, 10) : "Not specified"}
REPOSITORY: ${info.repoUrl || "Enterprise repo"}

ACTIVE DEVELOPERS IN ORGANIZATION:
${JSON.stringify(devProfiles, null, 2)}

TASK SPECIFICATION RULES:
1. Break down into discrete tasks across required roles ("frontend", "backend", "ui/ux", "ai").
2. For each task, select the optimal developer ID from the active developers based on specialty match and lower activeTasks count. If no developer fits, set suggestedAssigneeId to null.
3. For each task, specify:
   - "team": Name of the team (e.g. "Frontend", "Backend", "UI/UX", "AI")
   - "role": "frontend" | "backend" | "ui/ux" | "ai"
   - "title": Specific, actionable task title (e.g. "Implement JWT Auth & RBAC Middleware")
   - "goal": 1-2 sentences on high-level business/technical goal
   - "suggestedAssigneeId": Number (developer ID) or null
   - "timelineShare": Float between 0.3 and 0.9 (fraction of project duration when this task is due; e.g. UI/UX 0.35, Backend 0.7, Frontend 0.85)
   - "areas": Array of 1-3 work areas, each with:
     - "title": Name of work area
     - "steps": Array of 3-5 clear, sequential implementation steps
     - "handIn": Array of concrete deliverables (e.g. PR link, unit tests, schema migrations)
     - "doneWhen": Array of measurable acceptance criteria

Respond with a JSON object:
{
  "tasks": [ ... ]
}`;
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
            response_format: { type: "json_object" },
            temperature: 0.2,
        });
        const rawContent = completion.choices[0]?.message?.content;
        if (!rawContent)
            return null;
        const parsed = JSON.parse(rawContent);
        const taskSpecs = parsed.tasks || parsed.items || [];
        if (!Array.isArray(taskSpecs) || taskSpecs.length === 0)
            return null;
        const created = [];
        const teamMap = new Map();
        for (const spec of taskSpecs) {
            const teamName = spec.team || (spec.role ? String(spec.role).toUpperCase() : "Engineering");
            const share = typeof spec.timelineShare === "number" ? spec.timelineShare : 0.8;
            const due = this.teamDeadline(info.deadline, share);
            let team = teamMap.get(teamName);
            if (!team) {
                let existingTeam = await teamRepo.findOne({ where: { orgId, projectId, name: teamName } });
                if (!existingTeam) {
                    existingTeam = await teamRepo.save(teamRepo.create({ orgId, projectId, name: teamName, deadline: due }));
                }
                team = existingTeam;
                teamMap.set(teamName, team);
            }
            // Map role to TaskRole enum
            let taskRole = Task_1.TaskRole.FRONTEND;
            const roleStr = String(spec.role || "").toLowerCase();
            if (roleStr.includes("back"))
                taskRole = Task_1.TaskRole.BACKEND;
            else if (roleStr.includes("ui") || roleStr.includes("ux") || roleStr.includes("design"))
                taskRole = Task_1.TaskRole.UI_UX;
            else if (roleStr.includes("ai") || roleStr.includes("ml"))
                taskRole = Task_1.TaskRole.AI;
            // Assignee resolution
            let assignedDev = null;
            if (spec.suggestedAssigneeId) {
                assignedDev = allDevs.find((d) => d.id === spec.suggestedAssigneeId) || null;
            }
            if (!assignedDev) {
                // Fallback to least busy dev of this specialty
                const matchingDevs = await this.developersFor(orgId, taskRole);
                assignedDev = matchingDevs[0] || null;
            }
            const task = new Task_1.Task();
            task.projectId = projectId;
            task.project = { id: projectId };
            task.teamId = team.id;
            task.team = team;
            task.title = spec.title || `${teamName} Task`;
            task.requiredRole = taskRole;
            task.assigneeId = assignedDev ? assignedDev.id : null;
            task.assignee = assignedDev ? assignedDev : null;
            task.deadline = due;
            task.status = assignedDev ? Task_1.TaskStatus.TODO : Task_1.TaskStatus.PENDING;
            await taskRepo.save(task);
            // Build structured brief
            const briefLines = [];
            briefLines.push("GOAL", spec.goal || "Complete technical requirements for this module.", "");
            if (assignedDev) {
                briefLines.push(`ASSIGNED DEVELOPER: ${assignedDev.name} (${assignedDev.email})`, `SPECIALTY: ${assignedDev.specialty || "Engineering"}`, "");
            }
            briefLines.push("FROM THE PM SPECIFICATION", `- ${description}`, "");
            if (info.requirements)
                briefLines.push(`Extra requirements: ${info.requirements}`, "");
            if (Array.isArray(spec.areas)) {
                briefLines.push("IMPLEMENTATION BREAKDOWN");
                spec.areas.forEach((area, ai) => {
                    briefLines.push(`Area ${ai + 1}: ${area.title || "Core Scope"}`);
                    if (Array.isArray(area.steps)) {
                        area.steps.forEach((s, si) => briefLines.push(`${si + 1}. ${s}`));
                    }
                    briefLines.push("");
                });
                const allHandIn = spec.areas.flatMap((a) => (Array.isArray(a.handIn) ? a.handIn : []));
                if (allHandIn.length > 0) {
                    briefLines.push("WHAT TO HAND IN", ...allHandIn.map((h) => `- ${h}`), "");
                }
                const allDoneWhen = spec.areas.flatMap((a) => (Array.isArray(a.doneWhen) ? a.doneWhen : []));
                if (allDoneWhen.length > 0) {
                    briefLines.push("ACCEPTANCE CRITERIA / DONE WHEN", ...allDoneWhen.map((d) => `- ${d}`), "");
                }
            }
            briefLines.push("DEADLINE", due
                ? `Your milestone deadline is ${day(due)}.${info.deadline ? ` Final project delivery is ${day(info.deadline)}.` : ""}`
                : "No strict milestone deadline set.", "");
            const branch = `${slug(teamName)}/task-${task.id}`;
            briefLines.push("ENTERPRISE GIT WORKFLOW", `1. Repository: ${info.repoUrl ?? "Pending repository link from PM"}`, `2. Working branch: git checkout -b ${branch}`, `3. Commit standard: Include "#${task.id}" in every commit message (e.g. "feat(core): implement endpoints #${task.id}")`, `4. Pull Request: Open PR to main branch titled "[TASK-${task.id}] ${task.title}"`, "5. Peer Review: Once tests pass and PR is opened, change task status to 'In Review' on your developer station.");
            const fullDescription = briefLines.join("\n");
            await taskRepo.update(task.id, { description: fullDescription });
            task.description = fullDescription;
            created.push(task);
            if (assignedDev) {
                const roleCfg = ROLES.find((r) => r.role === taskRole) || ROLES[0];
                await this.notifyAssignee(assignedDev, task, roleCfg, info, due);
            }
        }
        return created;
    }
    /**
     * Splits a project by team using heuristic role templates.
     */
    static async processWithHeuristics(projectId, description, orgId, info) {
        const taskRepo = data_source_1.AppDataSource.getRepository(Task_1.Task);
        const teamRepo = data_source_1.AppDataSource.getRepository(Team_1.Team);
        const created = [];
        for (const cfg of this.pickRoles(`${description}. ${info.requirements || ""}`)) {
            const developers = await this.developersFor(orgId, cfg.role);
            const parts = this.planParts(cfg, developers.length);
            const people = parts.map((_, i) => developers[i] ?? null);
            const due = this.teamDeadline(info.deadline, cfg.share);
            const team = await teamRepo.save(teamRepo.create({ orgId, projectId, name: cfg.team, deadline: due }));
            for (let i = 0; i < parts.length; i++) {
                const developer = people[i];
                const task = new Task_1.Task();
                task.projectId = projectId;
                task.project = { id: projectId };
                task.teamId = team.id;
                task.team = team;
                task.title = parts[i].title;
                task.description = "";
                task.requiredRole = cfg.role;
                task.assigneeId = developer ? developer.id : null;
                task.assignee = developer ? developer : null;
                task.deadline = due;
                task.status = developer ? Task_1.TaskStatus.TODO : Task_1.TaskStatus.PENDING;
                await taskRepo.save(task);
                const text = this.buildBrief({ cfg, part: parts[i], index: i, parts, people, taskId: task.id, info, description, due });
                await taskRepo.update(task.id, { description: text });
                task.description = text;
                created.push(task);
                if (developer)
                    await this.notifyAssignee(developer, task, cfg, info, due);
            }
        }
        return created;
    }
    // Teams named in the text. If none is recognised, give the project a frontend and a backend team.
    static pickRoles(text) {
        const lower = text.toLowerCase();
        const matched = ROLES.filter((r) => r.pattern.test(lower));
        return matched.length > 0 ? matched : ROLES.filter((r) => r.role === Task_1.TaskRole.FRONTEND || r.role === Task_1.TaskRole.BACKEND);
    }
    /**
     * One part per developer:
     * - 0 or 1 developer: one part with all the work areas.
     * - fewer developers than areas: areas are shared out so every area is covered.
     * - more developers than areas: each area gets an owner, the extra people review and support.
     */
    static planParts(cfg, people) {
        if (people <= 1)
            return [{ title: cfg.title, areas: cfg.areas }];
        const groups = [];
        if (people <= cfg.areas.length) {
            for (let i = 0; i < people; i++)
                groups.push([]);
            cfg.areas.forEach((a, i) => groups[i % people].push(a));
        }
        else {
            cfg.areas.forEach((a) => groups.push([a]));
            for (let i = cfg.areas.length; i < people; i++) {
                groups.push([reviewArea(cfg.areas[(i - cfg.areas.length) % cfg.areas.length].title)]);
            }
        }
        return groups.map((areas, i) => ({
            areas,
            title: areas.length === 1 ? `${cfg.team}: ${areas[0].title}` : `${cfg.team}: part ${i + 1} of ${people}`,
        }));
    }
    // Each team's deadline sits inside the time window, so the last days stay free for review.
    static teamDeadline(finalDeadline, share) {
        if (!finalDeadline)
            return null;
        const now = Date.now();
        const total = finalDeadline.getTime() - now;
        if (total <= 0)
            return null;
        return new Date(now + Math.floor(total * share));
    }
    // The PM's own sentences that mention this team
    static pmNotes(description, pattern) {
        const sentences = (description.match(/[^.!?]+[.!?]*/g) || [description]).map((s) => s.trim()).filter(Boolean);
        let picked = sentences.filter((s) => pattern.test(s.toLowerCase())).slice(0, 4);
        if (picked.length === 0)
            picked = [description.trim().slice(0, 300)];
        return picked.map((s) => `- ${s.slice(0, 300)}`);
    }
    static buildBrief(p) {
        const { cfg, part, index, parts, people, taskId, info, description, due } = p;
        const branch = `${slug(cfg.team)}/task-${taskId}`;
        const lines = [];
        lines.push("GOAL", cfg.goal, "");
        if (parts.length > 1) {
            lines.push(`WHO DOES WHAT IN THE ${cfg.team.toUpperCase()} TEAM`);
            parts.forEach((pt, i) => {
                const who = people[i] ? people[i].name : "Unassigned";
                lines.push(`- ${who}: ${pt.areas.map((a) => a.title).join(" + ")}${i === index ? " (you)" : ""}`);
            });
            lines.push("");
        }
        lines.push("FROM THE PM", ...this.pmNotes(description, cfg.pattern));
        if (info.requirements)
            lines.push(`Extra requirements: ${info.requirements}`);
        lines.push("");
        lines.push("YOUR PART");
        part.areas.forEach((a, ai) => {
            lines.push(`Area ${ai + 1}: ${a.title}`, ...a.steps.map((s, i) => `${i + 1}. ${s}`), "");
        });
        lines.push("WHAT TO HAND IN", ...flat(part.areas.map((a) => a.handIn)).map((s) => `- ${s}`), "");
        lines.push("DONE WHEN", ...flat(part.areas.map((a) => a.doneWhen)).map((s) => `- ${s}`), "");
        if (parts.length > 1) {
            lines.push("TEAMWORK", "- Your teammates work on this project at the same time. Agree names and formats with them before you build.", "- Keep pull requests small so they can be reviewed fast.", "- Post a short update on your dashboard every time you finish something, so everyone can see the progress.", "");
        }
        lines.push("DEADLINE", due
            ? `Your team's part is due ${day(due)}.${info.deadline ? ` The final project deadline is ${day(info.deadline)}. The last days are kept for review.` : ""}`
            : "No deadline was set for this project. Ask your PM.", "");
        lines.push("HOW TO WORK WITH GIT", `1. Repository: ${info.repoUrl ?? "not set yet, ask your PM for the link"}`, `2. Clone it and create your own branch: ${branch}`, `3. Put #${taskId} in every commit message, for example: "Add login form #${taskId}"`, `4. Push your branch and open a pull request into the main branch. Put #${taskId} in the pull request title.`, "5. Use the same GitHub username as on your account here, so your work shows under your name.", "6. When the pull request is open, set this task to In review on your dashboard.");
        return lines.join("\n");
    }
    // Every active developer of that specialty, least busy first.
    static async developersFor(orgId, role) {
        const userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
        const taskRepo = data_source_1.AppDataSource.getRepository(Task_1.Task);
        const all = await userRepo.find({
            where: { orgId, role: User_1.UserRole.DEVELOPER, status: User_1.UserStatus.ACTIVE },
        });
        const wanted = ROLE_TO_SPECIALTY[role];
        const members = all.filter((d) => (d.specialty || "").trim().toLowerCase() === wanted);
        const loads = new Map();
        for (const m of members) {
            loads.set(m.id, await taskRepo.count({ where: { assigneeId: m.id, status: (0, typeorm_1.Not)(Task_1.TaskStatus.DONE) } }));
        }
        return members.sort((a, b) => (loads.get(a.id) - loads.get(b.id)) || a.id - b.id);
    }
    static async notifyAssignee(dev, task, cfg, info, due) {
        try {
            const text = `New task for you: ${task.title} (TASK-${task.id})\n` +
                `Project: ${info.name}\n` +
                `Due: ${due ? day(due) : "no deadline set yet"}\n` +
                `Repository: ${info.repoUrl ?? "ask your PM"}\n` +
                `Your branch: ${slug(cfg.team)}/task-${task.id}\n\n` +
                `Open your dashboard for the full step-by-step plan. Put TASK-${task.id} in every commit message and pull request title.`;
            await NotificationService_1.NotificationService.notifyUser(dev, text, "TASK_ASSIGNED");
        }
        catch (err) {
            console.error("Could not notify assignee:", err?.message || err);
        }
    }
}
exports.AITaskService = AITaskService;
