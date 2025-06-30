import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData, Link } from "@remix-run/react";
import { AuthStrategies } from "~/services/auth-strategies";
import { sessionStorage } from "~/services/session.server";
import { staffAuth } from "~/services/auth.server";
import { data } from "@remix-run/node";

import { Input } from "~/components/ui/input";
import { Home, LogIn } from "lucide-react";

// Action function to handle staff login authentication
export const action = async ({ request }: ActionFunctionArgs) => {
  return await staffAuth.authenticate(AuthStrategies.STAFF, request, {
    successRedirect: "/staff/dashboard", // Redirect on successful login
    failureRedirect: "/staff/login", // Redirect on failed login
  });
};

// Loader function to retrieve session data and handle errors
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const cookie = request.headers.get("Cookie"); // Retrieve cookies from the request
  const session = await sessionStorage.getSession(cookie); // Get session from session storage

  return data(
    {
      error: session.get("auth:error")?.message, // Pass error message to the loader data
    },
    {
      headers: {
        "Set-Cookie": await sessionStorage.commitSession(session), // Commit session changes
      },
    }
  );
};

export default function StaffLogin() {
  const { error } = useLoaderData<typeof loader>();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-md">
        {/* Header */}
        <div className="flex items-center justify-between border-b bg-white px-6 py-4">
          <Link to="/" className="rounded-full p-2 hover:bg-gray-100">
            <Home className="h-5 w-5 text-gray-600" />
          </Link>
          <h1 className="text-xl font-bold text-gray-800">Staff Login</h1>
          <div className="w-8"></div> {/* Spacer for alignment */}
        </div>

        {/* Login Form */}
        <Form method="post" className="space-y-6 p-6">
          <div className="space-y-4">
            {/* Username Input */}
            <div>
              <label
                htmlFor="username"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Username
              </label>
              <Input
                id="username"
                name="username"
                placeholder="Enter your username"
                className="w-full border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                className="w-full border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="flex w-full items-center justify-center space-x-2 rounded-md 
            bg-blue-600 py-2 font-medium text-white 
            transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <LogIn className="h-4 w-4" />
            <span>Login</span>
          </button>
        </Form>
      </div>
    </div>
  );
}
