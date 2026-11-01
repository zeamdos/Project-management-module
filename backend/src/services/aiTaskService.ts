import { Not } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { Project } from "../entities/Project";
import { Team } from "../entities/Team";
import { Task, TaskRole, TaskStatus } from "../entities/Task";
import { User, UserRole, UserStatus } from "../entities/User";
import { NotificationChannel } from "../entities/Notification";
import { NotificationService } from "./NotificationService";

export type ProjectBrief = {
  name: string;
  deadline: Date | null;
  requirements: string | null;
  repoUrl: string | null;
};

// Task.requiredRole -> User.specialty (compared in lower case)
const ROLE_TO_SPECIALTY: Record<TaskRole, string> = {
  [TaskRole.FRONTEND]: "frontend",
  [TaskRole.BACKEND]: "backend",
  [TaskRole.UI_UX]: "ui/ux",
  [TaskRole.AI]: "ai",
};

// One piece of a team's work. Every developer in the team gets one or more of these.
type Area = {
  title: string;
  steps: string[];
  handIn: string[];
  doneWhen: string[];
};

type RoleConfig = {
  role: TaskRole;
  team: string;
  pattern: RegExp; // whole words that mean "this sentence is about this team"
  title: string; // task title when one person does the whole team's work
  goal: string;
  share: number; // how far into the time window this team's part is due (0 to 1)
  areas: Area[];
};

type Part = { title: string; areas: Area[] };

// Extra people in a team (more people than work areas) support and review another area.
const reviewArea = (forTitle: string): Area => ({
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

const ROLES: RoleConfig[] = [
  {
    role: TaskRole.UI_UX,
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
    role: TaskRole.FRONTEND,
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
    role: TaskRole.BACKEND,
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
    role: TaskRole.AI,
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

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "team";

const day = (d: Date) => d.toISOString().slice(0, 10);

const flat = (lists: string[][]) => ([] as string[]).concat(...lists);

export class AITaskService {
  /**
   * Splits a project by team, then splits each team's work between ALL its developers.
   * Every developer in a team gets a part, and each part's brief lists who does what.
   */
  static async processAndAssignProject(
    projectId: number,
    description: string,
    orgId: number,
    brief?: Partial<ProjectBrief>
  ): Promise<Task[]> {
    const info: ProjectBrief = {
      name: brief?.name || "Project",
      deadline: brief?.deadline ?? null,
      requirements: brief?.requirements ?? null,
      repoUrl: brief?.repoUrl ?? null,
    };

    const taskRepo = AppDataSource.getRepository(Task);
    const teamRepo = AppDataSource.getRepository(Team);
    const created: Task[] = [];

    for (const cfg of this.pickRoles(`${description}. ${info.requirements || ""}`)) {
      const developers = await this.developersFor(orgId, cfg.role);
      const parts = this.planParts(cfg, developers.length);
      const people: (User | null)[] = parts.map((_, i) => developers[i] ?? null);
      const due = this.teamDeadline(info.deadline, cfg.share);

      const team = await teamRepo.save(teamRepo.create({ orgId, projectId, name: cfg.team, deadline: due }));

      for (let i = 0; i < parts.length; i++) {
        const developer = people[i];

        const task = new Task();
        task.projectId = projectId;
        task.project = { id: projectId } as Project; // fills project_id, so the project can see its tasks
        task.teamId = team.id;
        task.team = team;
        task.title = parts[i].title;
        task.description = "";
        task.requiredRole = cfg.role;
        task.assigneeId = developer ? developer.id : null;
        task.assignee = developer ? developer : null; // fills assignee_id
        task.deadline = due;
        // Assigned tasks start as TODO. No developer in that team yet = PENDING.
        task.status = developer ? TaskStatus.TODO : TaskStatus.PENDING;
        await taskRepo.save(task);

        // The brief needs the task number (for the branch name and commit messages)
        const text = this.buildBrief({ cfg, part: parts[i], index: i, parts, people, taskId: task.id, info, description, due });
        await taskRepo.update(task.id, { description: text });
        task.description = text;

        created.push(task);
        if (developer) await this.notifyAssignee(developer, task, cfg, info, due);
      }
    }

    return created;
  }

  // Teams named in the text. If none is recognised, give the project a frontend and a backend team.
  private static pickRoles(text: string): RoleConfig[] {
    const lower = text.toLowerCase();
    const matched = ROLES.filter((r) => r.pattern.test(lower));
    return matched.length > 0 ? matched : ROLES.filter((r) => r.role === TaskRole.FRONTEND || r.role === TaskRole.BACKEND);
  }

  /**
   * One part per developer:
   * - 0 or 1 developer: one part with all the work areas.
   * - fewer developers than areas: areas are shared out so every area is covered.
   * - more developers than areas: each area gets an owner, the extra people review and support.
   */
  private static planParts(cfg: RoleConfig, people: number): Part[] {
    if (people <= 1) return [{ title: cfg.title, areas: cfg.areas }];

    const groups: Area[][] = [];
    if (people <= cfg.areas.length) {
      for (let i = 0; i < people; i++) groups.push([]);
      cfg.areas.forEach((a, i) => groups[i % people].push(a));
    } else {
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
  private static teamDeadline(finalDeadline: Date | null, share: number): Date | null {
    if (!finalDeadline) return null;
    const now = Date.now();
    const total = finalDeadline.getTime() - now;
    if (total <= 0) return null;
    return new Date(now + Math.floor(total * share));
  }

  // The PM's own sentences that mention this team
  private static pmNotes(description: string, pattern: RegExp): string[] {
    const sentences = (description.match(/[^.!?]+[.!?]*/g) || [description]).map((s) => s.trim()).filter(Boolean);
    let picked = sentences.filter((s) => pattern.test(s.toLowerCase())).slice(0, 4);
    if (picked.length === 0) picked = [description.trim().slice(0, 300)];
    return picked.map((s) => `- ${s.slice(0, 300)}`);
  }

  private static buildBrief(p: {
    cfg: RoleConfig;
    part: Part;
    index: number;
    parts: Part[];
    people: (User | null)[];
    taskId: number;
    info: ProjectBrief;
    description: string;
    due: Date | null;
  }): string {
    const { cfg, part, index, parts, people, taskId, info, description, due } = p;
    const branch = `${slug(cfg.team)}/task-${taskId}`;
    const lines: string[] = [];

    lines.push("GOAL", cfg.goal, "");

    if (parts.length > 1) {
      lines.push(`WHO DOES WHAT IN THE ${cfg.team.toUpperCase()} TEAM`);
      parts.forEach((pt, i) => {
        const who = people[i] ? people[i]!.name : "Unassigned";
        lines.push(`- ${who}: ${pt.areas.map((a) => a.title).join(" + ")}${i === index ? " (you)" : ""}`);
      });
      lines.push("");
    }

    lines.push("FROM THE PM", ...this.pmNotes(description, cfg.pattern));
    if (info.requirements) lines.push(`Extra requirements: ${info.requirements}`);
    lines.push("");

    lines.push("YOUR PART");
    part.areas.forEach((a, ai) => {
      lines.push(`Area ${ai + 1}: ${a.title}`, ...a.steps.map((s, i) => `${i + 1}. ${s}`), "");
    });

    lines.push("WHAT TO HAND IN", ...flat(part.areas.map((a) => a.handIn)).map((s) => `- ${s}`), "");
    lines.push("DONE WHEN", ...flat(part.areas.map((a) => a.doneWhen)).map((s) => `- ${s}`), "");

    if (parts.length > 1) {
      lines.push(
        "TEAMWORK",
        "- Your teammates work on this project at the same time. Agree names and formats with them before you build.",
        "- Keep pull requests small so they can be reviewed fast.",
        "- Post a short update on your dashboard every time you finish something, so everyone can see the progress.",
        ""
      );
    }

    lines.push(
      "DEADLINE",
      due
        ? `Your team's part is due ${day(due)}.${info.deadline ? ` The final project deadline is ${day(info.deadline)}. The last days are kept for review.` : ""}`
        : "No deadline was set for this project. Ask your PM.",
      ""
    );

    lines.push(
      "HOW TO WORK WITH GIT",
      `1. Repository: ${info.repoUrl ?? "not set yet, ask your PM for the link"}`,
      `2. Clone it and create your own branch: ${branch}`,
      `3. Put #${taskId} in every commit message, for example: "Add login form #${taskId}"`,
      `4. Push your branch and open a pull request into the main branch. Put #${taskId} in the pull request title.`,
      "5. Use the same GitHub username as on your account here, so your work shows under your name.",
      "6. When the pull request is open, set this task to In review on your dashboard."
    );

    return lines.join("\n");
  }

  // Every active developer of that specialty, least busy first.
  private static async developersFor(orgId: number, role: TaskRole): Promise<User[]> {
    const userRepo = AppDataSource.getRepository(User);
    const taskRepo = AppDataSource.getRepository(Task);

    const all = await userRepo.find({
      where: { orgId, role: UserRole.DEVELOPER, status: UserStatus.ACTIVE },
    });

    const wanted = ROLE_TO_SPECIALTY[role];
    const members = all.filter((d) => (d.specialty || "").trim().toLowerCase() === wanted);

    const loads = new Map<number, number>();
    for (const m of members) {
      loads.set(m.id, await taskRepo.count({ where: { assigneeId: m.id, status: Not(TaskStatus.DONE) } }));
    }

    return members.sort((a, b) => (loads.get(a.id)! - loads.get(b.id)!) || a.id - b.id);
  }

  private static async notifyAssignee(dev: User, task: Task, cfg: RoleConfig, info: ProjectBrief, due: Date | null): Promise<void> {
    if (!dev.telegramChatId) return; // not linked yet
    try {
      const text =
        `New task for you: ${task.title} (task #${task.id})\n` +
        `Project: ${info.name}\n` +
        `Due: ${due ? day(due) : "no deadline set yet"}\n` +
        `Repository: ${info.repoUrl ?? "ask your PM"}\n` +
        `Your branch: ${slug(cfg.team)}/task-${task.id}\n\n` +
        `Open your dashboard for the full step-by-step plan and to see who does what. Put #${task.id} in every commit message and pull request title.`;
      await NotificationService.send(dev.id, NotificationChannel.TELEGRAM, dev.telegramChatId, text);
    } catch (err: any) {
      console.error("Could not notify assignee:", err?.message || err);
    }
  }
}