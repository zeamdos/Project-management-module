# Setup Instructions - Project Management Module

## Backend Setup

### What You Need to Do:

#### 1. Install Node.js Dependencies
```bash
cd backend
npm install
```

#### 2. Create MySQL Database
- Install MySQL if you don't have it
- Create a database named `project_management`
```sql
CREATE DATABASE project_management;
```

#### 3. Configure Environment Variables
- Copy `.env.example` to `.env`
```bash
cd backend
cp .env.example .env
```

- Edit `.env` and fill in these REQUIRED values:
  - `DB_PASSWORD` - Your MySQL password
  - `JWT_SECRET` - A random secret key for JWT tokens
  - `TELEGRAM_BOT_TOKEN` - Your Telegram bot token (see below)
  - `EMAIL_USER` and `EMAIL_PASSWORD` - Your email credentials (see below)

#### 4. Get Telegram Bot Token
1. Open Telegram and search for @BotFather
2. Send `/newbot` command
3. Follow instructions to create your bot
4. Copy the bot token and add it to `.env` as `TELEGRAM_BOT_TOKEN`

#### 5. Setup Email (Optional but Recommended)
For Gmail:
1. Enable 2FA on your Google account
2. Go to Google Account > Security > App Passwords
3. Generate a new app password
4. Add to `.env`:
   - `EMAIL_USER=your_email@gmail.com`
   - `EMAIL_PASSWORD=your_app_password`

#### 6. Get SMS API Key (Optional)
- Contact Ethiotelecom to get SMS API credentials
- Add to `.env`:
  - `SMS_API_KEY=your_api_key`
  - `SMS_API_URL=https://api.ethiotelecom.et/sms`

#### 7. Initialize Database
```bash
cd backend
# For development (auto-sync tables - NOT for production)
# Set synchronize: true in src/config/data-source.ts

# Or create tables manually (recommended)
# Run TypeORM migration after creating migration files
npm run migration:run
```

#### 8. Start the Backend Server
```bash
cd backend
npm run dev
```

The server will start on `http://localhost:3000`

## Testing the Backend

### Register a User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@example.com",
    "password": "password123",
    "role": "admin",
    "orgName": "My Company"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
```

### Create a Project (requires JWT token)
```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "My First Project",
    "description": "Project description",
    "goals": "Project goals",
    "deadline": "2024-12-31"
  }'
```

## Frontend Setup (Coming Next)

The frontend will be built with React and will include:
- Dark/Bright theme toggle
- Game-like aesthetic with bold fonts
- Responsive design
- Integration with this backend API

## What's Included in the Backend

✅ Complete database schema (19 tables)
✅ User authentication with JWT
✅ Project management (CRUD)
✅ Task management with assignments
✅ Role-based access control
✅ Telegram notification service
✅ Email notification service
✅ SMS notification service (Ethiotelecom)
✅ GitHub integration ready
✅ Audit logging
✅ Multi-language support (English, Amharic, etc.)
✅ Telegram ID indexing for fast lookups

## Next Steps

1. Complete backend setup following the instructions above
2. Test the API endpoints
3. Proceed with frontend development
4. Set up GitHub webhook integration (optional)
5. Configure notification preferences for users

## Troubleshooting

### "Database connection failed"
- Check if MySQL is running
- Verify DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD in .env
- Ensure database `project_management` exists

### "JWT token invalid"
- Check JWT_SECRET in .env
- Ensure token is not expired

### "Telegram bot not sending messages"
- Verify TELEGRAM_BOT_TOKEN is correct
- Users must start the bot on Telegram first
- Check bot has permission to send messages

### "Email not sending"
- Verify email credentials
- For Gmail, use App Password (not regular password)
- Check if email provider allows SMTP

## Support

If you encounter issues:
1. Check the error logs in the terminal
2. Verify all environment variables are set correctly
3. Ensure MySQL is running and accessible
4. Check that all dependencies are installed

## Notes

- The backend uses TypeORM for database operations
- All sensitive data (passwords, tokens) are hashed/encrypted
- The system supports multiple languages (default: English)
- Users can set their preferred language in their profile
- Telegram, Email, and SMS notifications are all supported
- Users can choose which notification channels they prefer
