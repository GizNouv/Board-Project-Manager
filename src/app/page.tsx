import { requireAuth } from '@/lib/auth-guard';

export default async function HomePage() {
  const session = await requireAuth();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="text-4xl font-bold mb-4">Welcome to Trello Clone</h1>
      <p className="text-lg text-gray-600 mb-8">
        Hello, {session.user?.name || 'User'}!
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Your Boards</h2>
          <p className="text-gray-600">View and manage your boards</p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Recent Tasks</h2>
          <p className="text-gray-600">Track your recent activity</p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Team Updates</h2>
          <p className="text-gray-600">See what your team is working on</p>
        </div>
      </div>
    </div>
  );
}