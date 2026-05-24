# 🐐 GoatCode

**GoatCode** is a local-first programming problems dashboard built to help you track your coding problems, capture insights, and build a review bank that survives forgetfulness. 

Whether you're practicing on LeetCode, Codeforces, CSES, or AtCoder, GoatCode provides a sleek, dark-themed glassmorphism interface to save your problem links, tag them by topic/difficulty, and attach your GitHub solution links directly.

## 🚀 Features

- **Centralized Problem Tracking**: Manage your competitive programming and interview prep problems in one place.
- **Platform Support**: Pre-configured with major platforms (LeetCode, Codeforces, CSES, AtCoder, CodeChef, USACO, SPOJ, UVa).
- **Drill System**: Track how many times you've reviewed a problem and surface "Great Picks" for your next study session.
- **Rich Tagging**: Organize problems with a flat tag system including topics, difficulties, and roles.
- **Local-First & Fast**: Built with an embedded SQLite database. Your data stays with you.
- **Automated SQLite Backups**: Rest easy with automatic timestamped database backups upon problem creation or deletion.

## 🛠 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Database**: [SQLite](https://sqlite.org/) + [Prisma ORM](https://www.prisma.io/)
- **API Layer**: [tRPC v11](https://trpc.io/) for end-to-end typesafe APIs
- **State Management**: [TanStack Query v5](https://tanstack.com/query) (React Query)
- **Styling**: Vanilla CSS with a custom Glassmorphism UI
- **Language**: TypeScript

## 📖 Example Workflow (The "Two Sum" Flow)

Imagine you've just submitted an accepted solution to "Two Sum" on LeetCode and you've saved your code to a repository on your GitHub. Here is exactly how you record it in GoatCode:

1. **Open the Entry Form:** Navigate to `http://localhost:3000/admin` and click **Add Problem**.
2. **Core Details:** Select `LeetCode` from the platform dropdown, type `Two Sum` for the title, and paste the LeetCode URL. Optionally add a normalized difficulty (e.g. `2`).
3. **The "Aha!" Moment:** Instead of writing out the code, type the exact insight you needed to solve it optimally. For example: *"Instead of a nested loop, use a Hash Map to store `target - current_number` so you only have to pass through the array once. O(n) time."*
4. **Tags:** Scroll down and check `Array` and `Hash Table`.
5. **Link to GitHub:** Under the Solution section, set the language to `Python` (or your preferred language) and paste the direct link to the specific file in your GitHub repo where you saved the Two Sum code.
6. **Save & Review Later:** Click **Save Problem**. Fast forward three months, when you filter by `Hash Table`, you'll instantly see your "Aha Moment", click straight through to your code on GitHub, and use the **Drill** button to record that you reviewed it!

## 📦 Getting Started

### Prerequisites

- Node.js (v18 or newer recommended)
- npm

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ctxnn/goatcode.git
   cd goatcode
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Initialize the Database:**
   Push the Prisma schema to create your local SQLite database and run the seed script to populate default platforms.
   ```bash
   npx prisma db push
   npm run prisma:seed
   ```

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000) to view the dashboard and `http://localhost:3000/admin` to manage your problems.

## 🗄️ Database Backups

GoatCode automatically backs up your SQLite database to the `backups/sqlite/` folder whenever you create or delete a problem. 

You can manually manage backups using the provided npm scripts:
- **`npm run db:backup`**: Create a manual backup.
- **`npm run db:backups:list`**: List all available backups.
- **`npm run db:restore`**: Restore the database from the most recent backup.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/ctxnn/goatcode/issues) if you want to contribute.

## 📝 License

This project is licensed under the MIT License.
