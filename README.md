# Great Genesis Pro

A gaming algorithm platform with PIN-based authentication and Firebase integration.

## Features

- **PIN-based Authentication**: 6-digit access codes with role-based access control
- **Admin Panel**: Manage access codes, revoke/restore pins, user management
- **Algorithm Engine**: Betting prediction algorithm with win/lose/tie tracking
- **Firebase Integration**: Real-time database for PIN storage and validation

## Tech Stack

- **Backend**: Fastify (Node.js)
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Database**: Firebase Realtime Database
- **Deployment**: Vercel Serverless Functions

## Project Structure

```
├── api/
│   └── index.js          # Vercel serverless entry point
├── public/
│   ├── index.html        # Login page
│   ├── user_login.js     # Login logic
│   ├── assets/
│   │   └── style.css     # Global styles
│   ├── user/
│   │   ├── index.html    # User dashboard
│   │   ├── admin_login.js
│   │   └── algorithm.js  # Algorithm engine logic
│   └── admin/
│       ├── index.html    # Admin panel
│       └── admin.js      # Admin management logic
├── src/
│   ├── server.js         # Standalone server (local dev)
│   └── services/
│       ├── algorithm.service.js
│       └── authkey.service.js
├── vercel.json           # Vercel configuration
├── package.json
└── .env                  # Environment variables (not committed)
```

## Environment Variables

Create a `.env` file with:

```
FIREBASE_DB_URL=https://your-project-default-rtdb.region.firebasedatabase.app
```

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
# or
node src/server.js
```

The server will start on `http://localhost:3000`

## Vercel Deployment

### 1. Install Vercel CLI

```bash
npm i -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Set Environment Variables

```bash
vercel env add FIREBASE_DB_URL
```

Enter your Firebase database URL when prompted.

### 4. Deploy

```bash
vercel
```

For production deployment:

```bash
vercel --prod
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with 6-digit PIN
- `POST /api/auth/validate` - Validate session
- `POST /api/auth/logout` - Logout
- `POST /api/auth/check-admin` - Check admin access
- `POST /api/auth/validate-admin` - Validate admin session
- `POST /api/auth/user-info` - Get user info

### Engine
- `POST /api/engine/start` - Start algorithm engine
- `POST /api/engine/stop` - Stop engine
- `POST /api/engine/win` - Mark win
- `POST /api/engine/lose` - Mark lose
- `POST /api/engine/tie` - Mark tie

### Admin
- `GET /api/admin/pins` - Get all PINs
- `POST /api/admin/pins/create` - Create new PIN
- `POST /api/admin/pins/update` - Update PIN
- `POST /api/admin/pins/revoke` - Revoke PIN
- `POST /api/admin/pins/unrevoke` - Restore PIN
- `DELETE /api/admin/pins/:pin` - Delete PIN

## Routes

- `/` - Login page
- `/user/index.html` - User dashboard
- `/admin/index.html` - Admin panel

## PIN Format

All PINs must be exactly 6 digits (e.g., `123456`).

## Default Roles

- `admin` - Full access to admin panel
- `user` - Standard user access
- `vip` - VIP user
- `staff` - Staff member
- `manager` - Manager access

## License

Private - Genesis 777 Corporation
