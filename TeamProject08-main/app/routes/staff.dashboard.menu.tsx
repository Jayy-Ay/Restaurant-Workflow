import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { ArrowRight, Clock, Leaf, Milk, MilkOff, Search } from "lucide-react";
import { useState } from "react";
import { staffAuth } from "~/services/auth.server";
import { prisma } from "~/services/database.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  return null;
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await staffAuth.isAuthenticated(request, {
    failureRedirect: "/staff/login",
    notAllowedRole: "customer",
  });

  // Fetch menu items from the database
  let data = await prisma.menuItem.findMany();

  return {
    user,
    data,
  };
};

export default function Menu() {
  const { data } = useLoaderData<typeof loader>();

  const [searchTerm, setSearchTerm] = useState("");
  const [vegetarianFilter, setVegetarianFilter] = useState<boolean | null>(
    null
  );
  const [glutenFreeFilter, setGlutenFreeFilter] = useState<boolean | null>(
    null
  );

  // Filter menu items based on search, vegetarian, and gluten free filters
  const filteredItems = data.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesVegetarian =
      vegetarianFilter === null || item.isVegetarian === vegetarianFilter;
    const matchesGlutenFree =
      glutenFreeFilter === null || item.isGlutenFree === glutenFreeFilter;
    return matchesSearch && matchesVegetarian && matchesGlutenFree;
  });

  return (
    <div className="space-y-6">
      {/* Header and filters */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <h2 className="text-2xl font-bold capitalize text-gray-800">Menu</h2>
        <div className="flex flex-col space-y-2 md:flex-row md:space-x-4 md:space-y-0">
          <Link
            to="/staff/dashboard/menu/add"
            className="flex items-center rounded-md bg-blue-600 px-3 text-sm text-white transition-colors hover:bg-blue-700"
          >
            Add Menu Item
          </Link>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search menu items"
              className="w-full rounded-md border border-gray-300 py-2 pl-10 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 md:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Vegetarian filter */}
          <div className="relative">
            <Leaf className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <select
              className="w-full appearance-none rounded-md border border-gray-300 bg-white py-2 pl-10 pr-6 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={
                vegetarianFilter === null
                  ? "all"
                  : vegetarianFilter
                  ? "yes"
                  : "no"
              }
              onChange={(e) => {
                if (e.target.value === "all") setVegetarianFilter(null);
                else setVegetarianFilter(e.target.value === "yes");
              }}
            >
              <option value="all">All Items</option>
              <option value="yes">Vegetarian</option>
              <option value="no">Non-Vegetarian</option>
            </select>
          </div>

          <div className="relative w-fit">
            <Milk className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <select
              className="w-full appearance-none rounded-md border border-gray-300 bg-white py-2 pl-10 pr-6 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={
                glutenFreeFilter === null
                  ? "all"
                  : glutenFreeFilter
                  ? "yes"
                  : "no"
              }
              onChange={(e) => {
                if (e.target.value === "all") setGlutenFreeFilter(null);
                else setGlutenFreeFilter(e.target.value === "yes");
              }}
            >
              <option value="all">All Items</option>
              <option value="yes">Gluten-Free</option>
              <option value="no">Contains Gluten</option>
            </select>
          </div>
        </div>
      </div>

      {/* No items message */}
      {filteredItems.length === 0 && (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="text-lg font-medium text-gray-500">
            No menu items found
          </p>
          <p className="mt-1 text-sm text-gray-400">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}

      {/* Menu items grid */}
      {filteredItems.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((menuItem) => (
            <Link
              to={`/staff/dashboard/menu/${menuItem.id.toString()}`}
              key={menuItem.id}
              className="relative rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md"
            >
              <img
                className="max-h-36 w-full rounded-t-lg object-cover"
                src={`/images/${menuItem.image}`}
              />
              <div className="absolute right-4 top-0 mt-4">
                <div className="rounded-full bg-gray-100 p-2 transition-colors hover:bg-blue-100">
                  <ArrowRight className="h-4 w-4 text-gray-700 hover:text-blue-600" />
                </div>
              </div>
              <div className="p-5">
                <div className="flex justify-between">
                  <h3 className="font-medium text-gray-800">{menuItem.name}</h3>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${
                        menuItem.isVegetarian
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {menuItem.isVegetarian ? (
                        <Leaf className="h-3 w-3" />
                      ) : (
                        <span className="text-xs">N</span>
                      )}
                    </span>
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${
                        menuItem.isGlutenFree
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {menuItem.isGlutenFree ? (
                        <Milk className="h-3 w-3" />
                      ) : (
                        <MilkOff className="h-3 w-3" />
                      )}
                    </span>
                  </div>
                </div>

                {menuItem.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                    {menuItem.description}
                  </p>
                )}

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-xs text-gray-500">
                      {menuItem.preparationTime || "15-20"} mins
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-500">
                      {menuItem.calories || "N/A"} kcal
                    </span>
                    <span className="font-bold text-blue-600">
                      ${menuItem.price?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
