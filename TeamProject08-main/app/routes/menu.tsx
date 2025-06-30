import type { LoaderFunctionArgs } from "@remix-run/node";
import type { MetaFunction } from "@remix-run/node";
import { Link, NavLink, Outlet, useLoaderData } from "@remix-run/react";
import { ShoppingBasket, Home } from "lucide-react";
import { useEventStream } from "~/hooks/use-event-stream";
import { custAuth } from "~/services/auth.server";
import { userBasket } from "~/services/cookies.server";

// Meta function to set the page title and description
export const meta: MetaFunction = () => {
  return [{ title: "Menu " }, { name: "Menu items served" }];
};

// Loader function to fetch user authentication and basket data
export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Authenticate the user and ensure they have the "customer" role
  const user = await custAuth.isAuthenticated(request, {
    failureRedirect: "/login",
    role: "customer",
  });

  // Parse the user's basket from cookies and calculate the total items
  let basket = (await userBasket.parse(request.headers.get("Cookie"))) || {};
  let total = Object.values(basket || {}).reduce((acc, val) => acc + val, 0);

  // Return the user and basket data to the component
  return {
    user,
    basket: total,
  };
};

const categories = [
  {
    name: "All",
    link: "/menu/all",
  },
  {
    name: "Starters",
    link: "/menu/starter",
  },
  {
    name: "Main",
    link: "/menu/main",
  },
  {
    name: "Drink",
    link: "/menu/drink",
  },
  {
    name: "Desserts",
    link: "/menu/dessert",
  },
];

export default function Menu() {
  const { user, basket } = useLoaderData<typeof loader>();

  const { data } = useEventStream(`/menu/notifications?user=${user.id}`);

  return (
    <div className="bg-gray-50">
      <div
        className="font-inter
     mx-auto min-h-screen max-w-7xl"
      >
        {/* Header with navigation and user info */}
        <div className="border-b bg-white px-6 py-4 shadow-sm">
          <div className="flex flex-row items-center justify-between">
            <div className="flex items-center space-x-2">
              <Link to="/" className="rounded-full p-2 hover:bg-gray-100">
                <Home className="h-5 w-5 text-gray-600" />
              </Link>
              <h1 className="text-xl font-bold text-gray-800">
                Restaurant Menu
              </h1>
            </div>
            <div className="flex flex-row items-center gap-4">
              <Link to="/menu/basket" className="relative cursor-pointer">
                <div className="rounded-full bg-gray-100 p-2 transition-colors hover:bg-blue-100">
                  <ShoppingBasket className="h-6 w-6 text-gray-700 hover:text-blue-600" />
                  {(basket ? basket > 0 : false) && (
                    <span className="absolute -bottom-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-center text-sm font-bold text-white">
                      {basket}
                    </span>
                  )}
                </div>
              </Link>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                  <span className="text-sm font-medium text-blue-700">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium">{user.name}</span>
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="mt-6 border-b">
            <div className="flex">
              {categories.map((category) => (
                <NavLink
                  key={category.name}
                  to={category.link}
                  className={({ isActive }) =>
                    `${
                      isActive
                        ? "border-b-2 border-blue-600 text-blue-600"
                        : "text-gray-600 hover:text-gray-900"
                    } px-4 py-2 text-center text-sm font-medium transition-colors`
                  }
                >
                  {category.name}
                </NavLink>
              ))}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
