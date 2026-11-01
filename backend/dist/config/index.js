"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.config = {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },
    telegram: {
        botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    },
    email: {
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        user: process.env.EMAIL_USER || '',
        password: process.env.EMAIL_PASSWORD || '',
        from: process.env.EMAIL_FROM || '',
    },
    github: {
        clientId: process.env.GITHUB_CLIENT_ID || '',
        clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
        webhookSecret: process.env.GITHUB_WEBHOOK_SECRET || '',
    },
    sms: {
        apiKey: process.env.SMS_API_KEY || '',
        apiUrl: process.env.SMS_API_URL || '',
    },
    encryption: {
        key: process.env.ENCRYPTION_KEY || '',
    },
    frontend: {
        url: process.env.FRONTEND_URL || 'http://localhost:5173',
    },
};
