# Project Management Module - Backend

## Overview
Backend API for the Project Management Module built with Express.js, TypeORM, and MySQL.

## Features
- User authentication (JWT-based)
- Project management (CRUD operations)
- Task management with assignments
- Multi-channel notifications (Telegram, Email, SMS)
- Role-based access control
- GitHub integration ready
- Audit logging

## Tech Stack
- **Framework**: Express.js
- **ORM**: TypeORM
- **Database**: MySQL
- **Authentication**: JWT
- **Notifications**: Telegram Bot API, Nodemailer, SMS (Ethiotelecom)

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

### Installation

1. **Install dependencies**
```bash
cd backend
npm install
```

2. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` and fill in your configuration:
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=project_management

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_email_password
EMAIL_FROM=Project Management <noreply@projectmanagement.com>

# GitHub Configuration
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_WEBHOOK_SECRET=your_webhook_secret

# SMS Configuration (Ethiotelecom)
SMS_API_KEY=your_sms_api_key
SMS_API_URL=https://api.ethiotelecom.et/sms

# Encryption Key
ENCRYPTION_KEY=your_32_byte_encryption_key_here

# Frontend URL
FRONTEND_URL=http://localhost:3001
```

3. **Create MySQL database**
```sql
CREATE DATABASE project_management;
```

4. **Run database migrations**
```bash
npm run migration:run
```

Or if you're in development, you can use synchronization (not recommended for production):
```typescript
// In src/config/data-source.ts, set synchronize: true
```

5. **Start the development server**
```bash
npm run dev
```

6. **Build for production**
```bash
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (authenticated)
- `PUT /api/auth/profile` - Update user profile (authenticated)

### Projects
- `POST /api/projects` - Create project (admin/manager)
- `GET /api/projects` - Get all projects (authenticated)
- `GET /api/projects/:id` - Get project by ID (authenticated)
- `PUT /api/projects/:id` - Update project (admin/manager)
- `DELETE /api/projects/:id` - Delete project (admin/manager)
- `GET /api/projects/:id/stats` - Get project statistics (authenticated)

### Tasks
- `POST /api/tasks` - Create task (admin/manager/team_lead)
- `GET /api/tasks` - Get all tasks (authenticated)
- `GET /api/tasks/my` - Get my assigned tasks (authenticated)
- `GET /api/tasks/:id` - Get task by ID (authenticated)
- `PUT /api/tasks/:id` - Update task (authenticated)
- `DELETE /api/tasks/:id` - Delete task (admin/manager/team_lead)
- `POST /api/tasks/:id/assign` - Assign task to user (admin/manager/team_lead)

## Telegram Bot Setup

1. **Create a Telegram Bot**
   - Message @BotFather on Telegram
   - Use `/newbot` command
   - Follow the instructions to get your bot token

2. **Add the bot token to your `.env` file**
```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
```

3. **Users need to start your bot**
   - Users should search for your bot on Telegram
   - Click "Start" to authorize the bot
   - Link their Telegram account in their profile

## Email Setup (Gmail Example)

1. **Enable 2FA on your Google account**
2. **Generate an App Password**
   - Go to Google Account settings
   - Security > 2-Step Verification > App passwords
   - Generate a new app password
3. **Use the app password in `.env`**
```env
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

## SMS Setup (Ethiotelecom)

Contact Ethiotelecom to get:
- API Key
- API URL

Add to `.env`:
```env
SMS_API_KEY=your_api_key
SMS_API_URL=https://api.ethiotelecom.et/sms
```

## GitHub Integration Setup

1. **Create a GitHub App**
   - Go to GitHub Settings > Developer Settings > GitHub Apps
   - Create a new GitHub App
   - Configure permissions (Read/Write code, Pull requests, etc.)
   - Set webhook URL to your server

2. **Add credentials to `.env`**
```env
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
GITHUB_WEBHOOK_SECRET=your_webhook_secret
```

## Database Schema

The database consists of 19 tables:
- Organization
- User
- Project
- Milestone
- Team
- TeamMember
- Skill
- UserSkill
- TaskRequiredSkill
- Task
- TaskDependency
- Repository
- GitActivity
- Review
- ProgressUpdate
- Notification
- EscalationRule
- Policy
- AuditLog

See `DATABASE_DESIGN.md` for detailed schema information.

## Roles

- **admin**: Full system access
- **manager**: Can create/modify projects and tasks
- **team_lead**: Can manage team tasks
- **reviewer**: Can review code
- **developer**: Can view and update assigned tasks
- **executive**: Read-only access to dashboards

## Security Features

- JWT-based authentication
- Role-based access control (RBAC)
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Helmet security headers
- SQL injection prevention (via TypeORM)

## Notification Channels

The system supports multiple notification channels:
- **Telegram**: Real-time chat notifications
- **Email**: Email notifications and digests
- **SMS**: SMS reminders (via Ethiotelecom)
- **In-App**: In-app notifications

Users can configure their preferred notification channels in their profile.

## Testing

```bash
# Run tests (when implemented)
npm test
```

## Development

```bash
# Run in development mode with hot reload
npm run dev

# Build TypeScript
npm run build

# Generate migration
npm run migration:generate

# Run migration
npm run migration:run

# Revert migration
npm run migration:revert
```

## Troubleshooting

### Database Connection Issues
- Ensure MySQL is running
- Check DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD in .env
- Verify database exists

### JWT Token Issues
- Ensure JWT_SECRET is set in .env
- Check token expiration time

### Telegram Bot Not Working
- Verify TELEGRAM_BOT_TOKEN is correct
- Ensure users have started the bot
- Check bot permissions

### Email Not Sending
- Verify email credentials
- Check if app password is correct (for Gmail)
- Ensure email provider allows SMTP

## Production Deployment

1. Set `NODE_ENV=production` in environment
2. Use environment-specific database
3. Set `synchronize: false` in data-source.ts
4. Use proper SSL/TLS
5. Set up proper logging
6. Configure proper backup strategy
7. Use process manager (PM2, systemd, etc.)

## License

ISC
