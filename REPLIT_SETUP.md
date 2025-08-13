# Replit Setup Instructions

Your project is now configured for Replit! Follow these steps to get it running:

## 1. Add PostgreSQL to Your Repl

1. Click on "Tools" in the left sidebar
2. Search for "PostgreSQL" 
3. Click "Add to Repl"
4. Replit will automatically add the `DATABASE_URL` to your secrets

## 2. Add Required Secrets

Go to the Secrets tab (🔒 icon) and add:

- `OPENAI_API_KEY`: Your OpenAI API key (required for email generation)
- `GOOGLE_CLIENT_ID`: (Optional) For Google OAuth
- `GOOGLE_CLIENT_SECRET`: (Optional) For Google OAuth

## 3. Install Dependencies

Run in the Shell:
```bash
npm run install:all
```

## 4. Initialize Database

Run in the Shell:
```bash
npm run prisma:push
```

## 5. Start the Application

Run in the Shell:
```bash
npm run dev
```

## URLs

Once running, your app will be available at:
- Backend API: `https://[your-repl-name].repl.co`
- Frontend: `https://[your-repl-name].repl.co:3000`

## Project Structure

- **Frontend**: React + TypeScript + Vite (port 5173, mapped to 3000 on Replit)
- **Backend**: Node.js + Express + Prisma (port 3001, mapped to 80 on Replit)
- **Database**: PostgreSQL (managed by Replit)

## Scripts

- `npm run setup`: Run initial setup (creates .env files)
- `npm run dev`: Start both frontend and backend in development mode
- `npm run start`: Start in production mode (builds frontend first)
- `npm run prisma:push`: Sync database schema
- `npm run prisma:migrate`: Run database migrations

## Troubleshooting

### Database Connection Error
- Ensure PostgreSQL is added to your Repl (Tools → PostgreSQL)
- Check that `DATABASE_URL` exists in Secrets

### OpenAI API Error
- Add your `OPENAI_API_KEY` to Secrets
- Make sure the key is valid and has credits

### Build Errors
- Run `npm run install:all` to ensure all dependencies are installed
- Check the console for specific error messages

## Environment Variables

The setup script creates `.env` files with proper Replit URLs. These are gitignored and will be regenerated if deleted.