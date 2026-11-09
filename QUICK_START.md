# Quick Start Guide - Project Management Module

## Prerequisites
- Node.js (v18 or higher)
- MySQL (v8.0 or higher)
- Telegram account (for bot token)

## Step 1: Setup Backend

### 1.1 Install Backend Dependencies
```bash
cd backend
npm install
```

### 1.2 Configure Environment
```bash
# Copy the example file
copy .env.example .env

# Edit .env and set these REQUIRED values:
# - DB_PASSWORD=your_mysql_password
# - JWT_SECRET=any_random_string
# - TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
```

### 1.3 Get Telegram Bot Token
1. Open Telegram and search for @BotFather
2. Send: `/newbot`
3. Follow instructions to create your bot
4. Copy the token
5. Paste it in your `.env` file

### 1.4 Start Backend Server
```bash
npm run dev
```

You should see:
```
Database connected successfully
Server running on port 3000
Environment: development
```

**Keep this terminal open!**

## Step 2: Setup Frontend

### 2.1 Open New Terminal
Open a NEW terminal window (keep backend running in the first one)

### 2.2 Install Frontend Dependencies
```bash
cd frontend
npm install
```

### 2.3 Start Frontend Server
```bash
npm run dev
```

You should see:
```
VITE v5.x.x ready in xxx ms

➜  Local:   http://localhost:5173/
```

## Step 3: Test the Application

### 3.1 Open Browser
Go to: http://localhost:5173

### 3.2 Register an Account
1. Click "REGISTER HERE"
2. Fill in:
   - Name: Your name
   - Email: Your email
   - Password: Your password
   - Organization Name: Any name (e.g., "My Company")
3. Click "CREATE ACCOUNT"

### 3.3 Explore the Dashboard
You should see:
- Welcome message with your name
- Statistics cards (0 projects, 0 tasks, etc.)
- Game tips section

### 3.4 Create a Project
1. Click "PROJECTS" in the navbar
2. Click "NEW PROJECT"
3. Fill in:
   - Title: "My First Project"
   - Description: "Test project"
   - Goals: "Complete tasks"
   - Deadline: Pick a date
4. Click "CREATE PROJECT"

### 3.5 Create a Task
1. Click "TASKS" in the navbar
2. Click "NEW TASK"
3. Fill in:
   - Project: Select your project
   - Title: "My First Task"
   - Description: "Test task"
   - Priority: Medium
   - Deadline: Pick a date
4. Click "CREATE TASK"

### 3.6 Test Theme Toggle
1. Click the "🌙 DARK" / "☀️ BRIGHT" button in the navbar
2. Watch the theme change between dark and bright
3. Notice the text colors change (white on dark, black on bright)

## Step 4: Test Telegram Notifications (Optional)

### 4.1 Link Your Telegram Account
1. In your profile (add profile page later), set your Telegram ID
2. Start your bot on Telegram (search for your bot and click "Start")

### 4.2 Send a Test Notification
The notification system is implemented and ready. When you have notifications configured, they will be sent via Telegram.

## What's Working Now

✅ **Backend**
- User authentication (JWT)
- Project CRUD operations
- Task CRUD operations
- Telegram notification service
- Email notification service (ready, needs credentials)
- SMS notification service (ready, needs credentials)
- Database auto-sync (development mode)

✅ **Frontend**
- Game-like aesthetic with pixelated fonts
- Dark/Bright theme toggle
- User registration and login
- Dashboard with statistics
- Project management
- Task management with filters
- Responsive design

## Next Steps

### Add Email Notifications
1. Get email credentials (Gmail App Password recommended)
2. Add to backend `.env`:
   - EMAIL_USER=your_email@gmail.com
   - EMAIL_PASSWORD=your_app_password
3. Restart backend

### Add SMS Notifications
1. Contact Ethiotelecom for API credentials
2. Add to backend `.env`:
   - SMS_API_KEY=your_api_key
   - SMS_API_URL=https://api.ethiotelecom.et/sms
3. Restart backend

### Add GitHub Integration
1. Create a GitHub App
2. Add credentials to backend `.env`
3. Implement webhook handlers

## Troubleshooting

### Backend won't start
- Check if MySQL is running
- Verify DB_PASSWORD in `.env`
- Ensure database `project_management` exists

### Frontend won't connect to backend
- Ensure backend is running on port 3000
- Check browser console for CORS errors
- Verify API_URL in frontend `.env`

### Database connection error
- Restart MySQL service
- Check database credentials
- Try creating the database manually:
  ```sql
  CREATE DATABASE project_management;
  ```

### Theme not working
- Clear browser cache
- Check localStorage for 'theme' key
- Ensure ThemeProvider is wrapping the app

## Development Tips

- Keep both terminals open (backend and frontend)
- Backend runs on port 3000
- Frontend runs on port 5173
- Changes to backend require restart
- Frontend has hot reload (auto-refreshes)

## Production Deployment

When deploying to production:
1. Set `synchronize: false` in backend data-source.ts
2. Use environment variables for all secrets
3. Enable HTTPS
4. Use a process manager (PM2)
5. Set up proper logging
6. Configure backup strategy

## Support

If you encounter issues:
1. Check the terminal logs
2. Verify all environment variables
3. Ensure MySQL is running
4. Check browser console for errors
5. Review the README files in backend/ and frontend/ folders

Enjoy your Project Management Module! 🎮
