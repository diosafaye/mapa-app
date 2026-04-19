import React from 'react';
import { useAuth } from '@/lib/AuthContext'; // Import your auth hook

const UserNotRegisteredError = () => {
  const { logout } = useAuth(); // Assuming your AuthContext provides a logout function

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg border border-slate-100">
        <div className="text-center">
          {/* ... existing icon ... */}
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Access Restricted</h1>
          <p className="text-slate-600 mb-8">
            You are not registered to use this application. Please contact the app administrator to request access.
          </p>

          {/* ADDED BUTTONS */}
          <div className="space-y-3">
            <button 
              onClick={() => window.location.href = '/'} // Or your home route
              className="w-full py-2 px-4 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
            >
              Return Home
            </button>
            <button 
              onClick={logout} 
              className="w-full py-2 px-4 bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200 transition-colors"
            >
              Log Out
            </button>
          </div>

          <div className="mt-8 p-4 bg-slate-50 rounded-md text-sm text-slate-600 text-left">
            <p className="font-bold text-slate-800 mb-2">Troubleshooting:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Verify your logged-in account</li>
              <li>Contact the administrator</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserNotRegisteredError;