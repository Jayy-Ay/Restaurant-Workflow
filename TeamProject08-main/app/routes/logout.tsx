import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { custAuth, staffAuth } from "~/services/auth.server";
// Action function to handle logout for both customer and staff
export const action = async ({ request }: ActionFunctionArgs) => {
  await custAuth.logout(request, { redirectTo: "/" }); // Logout customer
  await staffAuth.logout(request, { redirectTo: "/" }); // Logout staff

  return null; // Return null to indicate no further action
};

// Loader function to handle logout for both customer and staff
export const loader = async ({ request }: LoaderFunctionArgs) => {
  await custAuth.logout(request, { redirectTo: "/" }); // Logout customer
  await staffAuth.logout(request, { redirectTo: "/" }); // Logout staff

  return null; // Return null to indicate no further action
};
