import type { ActionFunctionArgs } from "@remix-run/node";
import { Form } from "@remix-run/react";
import { Input } from "~/components/ui/input";
import { MultiInput } from "~/components/ui/multi-input";
import { AuthStrategies } from "~/services/auth-strategies";
import { custAuth } from "~/services/auth.server";
import { Home } from "lucide-react";
import { Link } from "@remix-run/react";

export const action = async ({ request }: ActionFunctionArgs) => {
  return await custAuth.authenticate(AuthStrategies.CUSTOMER, request, {
    successRedirect: "/menu",
    failureRedirect: "/login",
  });
};

export default function Login() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md rounded-xl bg-white shadow-md">
        {/* Header */}
        <div className="flex items-center justify-between border-b bg-white px-6 py-4">
          <Link to="/" className="rounded-full p-2 hover:bg-gray-100">
            <Home className="h-5 w-5 text-gray-600" />
          </Link>
          <h1 className="text-xl font-bold text-gray-800">Customer Login</h1>
          <div className="w-8"></div> {/* Spacer for alignment */}
        </div>

        {/* Login Form */}
        <Form method="post" className="space-y-6 p-6">
          <div className="space-y-4">
            {/* Name Input */}
            <div>
              <label
                htmlFor="name"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Name
              </label>
              <Input
                id="name"
                name="name"
                placeholder="Enter your name"
                className="w-full border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Allergies Input */}
            <div>
              <label
                htmlFor="allergies"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Allergies
              </label>
              <MultiInput
                name="allergies"
                options={[
                  { value: "peanuts", label: "Peanuts" },
                  { value: "gluten", label: "Gluten" },
                  { value: "dairy", label: "Dairy" },
                  { value: "soy", label: "Soy" },
                  { value: "shellfish", label: "Shellfish" },
                ]}
                className="w-full"
              />
            </div>

            {/* Table number */}
            <div>
              <label
                htmlFor="table"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Table
              </label>
              <span className="block h-full w-full rounded-lg border border-gray-300 bg-transparent px-3 py-1 outline-none placeholder:text-black/40 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:cursor-auto disabled:opacity-70">
                <select
                  name="table"
                  id="table"
                  className="w-full border-none outline-none"
                >
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full rounded-md bg-blue-600 py-2 font-medium text-white 
            transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 
            focus:ring-blue-500 focus:ring-offset-2"
          >
            Continue
          </button>
        </Form>
      </div>
    </div>
  );
}
