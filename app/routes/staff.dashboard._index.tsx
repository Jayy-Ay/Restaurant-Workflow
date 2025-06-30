import {
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "@remix-run/node";

export const action = async ({ request }: ActionFunctionArgs) => {
  return null;
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return redirect("/staff/dashboard/orders");
};
