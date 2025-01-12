# Linkup

A modern social media platform designed to foster meaningful connections and seamless interactions.

## Features

**Tech Stack**: Built with Next.js (App Router), neon Postgres, Prisma, Clerk, and TypeScript.

**Styling**: Tailwind CSS and Shadcn for modern, responsive design.

**Authentication**: Secure user authentication and authorization with Clerk.

**File Uploads**: Simplified file uploads using UploadThing.

**Database Integration**: Robust database management with Prisma and neon Postgres.

## Getting Started

1. Clone the Repository
```
git clone https://github.com/MuxN4/linkup.git
cd linkup
```

2. Install Dependencies
```
npm install
```

3. Set Environment Variables
Create a .env file in the root directory and configure the following variables:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
DATABASE_URL=your_database_url
UPLOADTHING_TOKEN=your_uploadthing_token
```

4. Run Database Migrations
```
npx prisma migrate dev
```

5. Start the Development Server
```
npm run dev
```

Connect Meaningfully with Linkup!
