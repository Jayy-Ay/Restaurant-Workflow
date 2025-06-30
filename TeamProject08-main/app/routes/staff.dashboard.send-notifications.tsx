import { ActionFunctionArgs, json, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { useState } from "react";
import { emitter } from "~/services/emitter.server";
import { staffAuth } from "~/services/auth.server";
import { prisma } from "~/services/database.server";
import { Button } from "~/components/ui/button";
import { Role } from "@prisma/client";
import { Filter } from "lucide-react";

// List of roles. Used for dropdown menu
const availableRoles = Object.keys(Role).map((role) => ({
  value: role.toLowerCase(),
  label:
    role.charAt(0).toUpperCase() +
    role.slice(1).toLowerCase().replace(/_/g, " "),
}));

export async function action({ request }: ActionFunctionArgs) {
  // Using the Staff Login Authentication
  await staffAuth.isAuthenticated(request, {
    failureRedirect: "/staff/login",
    notAllowedRole: "customer",
  });

  // GET data from the form below
  const formData = await request.formData();
  const role = formData.get("role") as string; // GET from name="role"
  const message = formData.get("message") as string; // GET from name="message"
  const senderName = formData.get("senderName") as string; // GET from name="sender"
  const recieverNames = formData.getAll("recieverName") as string[]; // GET all selected checkboxes

  if (!role || !message) {
    return json({ success: false, error: "Role and message are required" });
  } else {
    // Send notification to specific role or selected individuals
    const target = recieverNames.length > 0 ? recieverNames.join(", ") : role;
    emitter.emit(
      `notifications:${role}`,
      JSON.stringify({
        type: "warning",
        message: `${senderName} to ${target} | ${message}`,
      })
    );
  }

  return json({ success: true, message: `Notification sent to ${role}` });
}

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await staffAuth.isAuthenticated(request, {
    failureRedirect: "/staff/login",
    notAllowedRole: "customer",
  });

  const staff = await prisma.staff.findMany();

  return json({ user, staff });
}

export default function SendNotifications() {
  const { user, staff } = useLoaderData<typeof loader>(); // GET current user and staff data from loader()
  const [selectedRole, setSelectedRole] = useState("waiter"); // Selected role in the dropdown menu

  const filteredStaff = staff.filter(
    (staff) => staff.role.toLowerCase() === selectedRole
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between">
        <h2 className="text-2xl font-bold">Send Notifications</h2>
        <p className="text-gray-500">
          Use this form to send important notifications to your co-workers.
          Your message will be delivered instantly.
        </p>
      </header>

      <section className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="p-6">
          <Form method="post" className="space-y-4">
            <input type="hidden" name="senderName" value={user.name} />

            <div className="space-y-2">
              <label className="p-2 block text-sm font-medium mb-1">
                Send To:
              </label>

              <div className="border border-gray-300 rounded-md py-2">
                <div className="flex gap-2 p-2 m-2">
                  <Filter className="text-gray-500" />
                  <select
                    id="role"
                    name="role"
                    className="w-full border-gray-300 bg-gray-50"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                  >
                    {availableRoles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                    ))}
                  </select>
                </div>
                
                {/* Show each employee for the particular role based on the selection*/}
                {filteredStaff.length > 0 && (
                  <div className="w-full">
                    {filteredStaff.map((staff) => (
                      <p
                        className="p-1 block text-sm font-medium"
                        key={staff.name}
                      >
                        <input
                          className="mx-4 mr-3"
                          type="checkbox"
                          name="recieverName"
                          value={staff.name}
                        />
                        <label>{staff.name}</label>
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>


            <div className="space-y-2">
              <label className="block text-sm font-medium" htmlFor="message">
                Message:
              </label>
              <textarea
                id="message"
                name="message"
                rows={3}
                required
                placeholder="Enter your notification message here..."
                className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md transition-colors"
            >
              Send Notification
            </Button>
          </Form>
        </div>
      </section>
    </div>
  );
}