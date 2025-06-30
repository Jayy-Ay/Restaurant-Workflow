import { Category } from "@prisma/client";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import {
  Form,
  Link,
  redirect,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import { ArrowLeftCircleIcon, Info } from "lucide-react";
import { useState } from "react";
import { staffAuth } from "~/services/auth.server";
import { prisma } from "~/services/database.server";

// Action function to handle form submissions
export const action = async ({ request, params }: ActionFunctionArgs) => {
  // Authenticate the user and ensure they are not a customer
  const user = await staffAuth.isAuthenticated(request, {
    failureRedirect: "/staff/login",
    notAllowedRole: "customer",
  });

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "edit") {
    // Extract and parse form data
    const id = Number(params.item);
    const name = formData.get("name")?.toString() || "";
    const description = formData.get("description")?.toString() || "";
    const category = formData.get("category") as Category;
    const price = Number(formData.get("price"));
    const cost = Number(formData.get("cost"));
    const calories = Number(formData.get("calories"));
    const image = formData.get("image")?.toString() || "";
    const isVegetarian = formData.get("isVegetarian") === "on";
    const isGlutenFree = formData.get("isGlutenFree") === "on";
    const allergies =
      formData
        .get("allergies")
        ?.toString()
        .split(",")
        .map((a) => a.trim())
        .filter((a) => a) || [];

    // Validate profit margin
    const profitMargin = calculateProfitMargin(price, cost);
    if (profitMargin < 60) {
      throw new Error("Price must result in at least a 60% profit margin");
    }

    // Update the menu item in the database
    await prisma.menuItem.update({
      where: { id },
      data: {
        name,
        description,
        category,
        price,
        cost,
        calories,
        image,
        isVegetarian,
        isGlutenFree,
        allergies,
      },
    });

    // Redirect back to the menu page
    return redirect("/staff/dashboard/menu");
  }

  return null;
};

// Loader function to fetch data for the page
export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  // Authenticate the user and ensure they are not a customer
  const user = await staffAuth.isAuthenticated(request, {
    failureRedirect: "/staff/login",
    notAllowedRole: "customer",
  });

  // Redirect if no item parameter is provided
  if (!params.item) return redirect("/staff/dashboard/menu");

  // Fetch the menu item data from the database
  let data = await prisma.menuItem.findUnique({
    where: { id: Number(params.item) },
  });

  // Redirect if the menu item does not exist
  if (!data) return redirect("/staff/dashboard/menu");

  return {
    user,
    data,
  };
};

// Helper function to calculate profit margin
const calculateProfitMargin = (price: number, costPrice: number): number => {
  if (costPrice <= 0) return 0;
  return ((price - costPrice) / price) * 100;
};

export default function EditMenuItem() {
  const { data } = useLoaderData<typeof loader>();
  const navigation = useNavigation();

  const [price, setPrice] = useState(data.price || 0);
  const [costPrice, setCostPrice] = useState(data.cost || 0);
  const [profitMargin, setProfitMargin] = useState(
    calculateProfitMargin(data.price || 0, data.cost || 0)
  );

  const handlePriceChange = (newPrice: number) => {
    setPrice(newPrice);
    const margin = calculateProfitMargin(newPrice, costPrice);
    setProfitMargin(margin);
  };

  const handleCostPriceChange = (newCostPrice: number) => {
    setCostPrice(newCostPrice);
    const margin = calculateProfitMargin(price, newCostPrice);
    setProfitMargin(margin);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/staff/dashboard/menu"
            className="flex items-center text-gray-600 hover:text-blue-600"
          >
            <ArrowLeftCircleIcon className="mr-2 h-5 w-5" />
            Back to Menu
          </Link>
          <h2 className="text-2xl font-bold text-gray-800">Edit Menu Item</h2>
        </div>
      </div>

      <Form method="post" className="space-y-6">
        <input type="hidden" name="intent" value="edit" />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Basic Details */}
          <div className="space-y-4">
            <h3 className="mb-4 text-lg font-semibold text-gray-800">
              Basic Details
            </h3>
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Item Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                defaultValue={data.name}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                defaultValue={data.description}
                rows={4}
                className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="category"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Category
              </label>
              <input
                type="text"
                id="category"
                name="category"
                defaultValue={data.category}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Pricing & Nutritional Details */}
          <div className="space-y-4">
            <div>
              <h3 className="mb-4 text-lg font-semibold text-gray-800">
                Pricing Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="cost"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Cost Price (£)
                  </label>
                  <input
                    type="number"
                    id="cost"
                    name="cost"
                    step="0.01"
                    defaultValue={data.cost || 0}
                    required
                    onChange={(e) =>
                      handleCostPriceChange(Number(e.target.value))
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="price"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Price (£)
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    step="0.01"
                    defaultValue={data.price}
                    required
                    onChange={(e) => handlePriceChange(Number(e.target.value))}
                    className={`w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 
                          ${
                            profitMargin < 60
                              ? "border-red-300 text-red-900 focus:ring-red-500"
                              : "border-gray-300 focus:ring-blue-500"
                          }`}
                  />
                </div>
              </div>

              {/* Profit Margin Indicator */}
              <div className="mt-4 flex items-center rounded-md bg-gray-50 p-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">
                    Profit Margin
                  </p>
                  <p
                    className={`text-lg font-bold 
                          ${
                            profitMargin < 60
                              ? "text-red-600"
                              : "text-green-600"
                          }
                        `}
                  >
                    {profitMargin.toFixed(2)}%
                  </p>
                </div>
                {profitMargin < 60 && (
                  <div className="flex items-center text-red-600">
                    <Info className="mr-2 h-5 w-5" />
                    <span className="text-sm">
                      Increase price to meet 60% margin
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-lg font-semibold text-gray-800">
                Additional Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="calories"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Calories (kcal)
                  </label>
                  <input
                    type="number"
                    id="calories"
                    name="calories"
                    defaultValue={data.calories}
                    required
                    className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="image"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Image Filename
                  </label>
                  <input
                    type="text"
                    id="image"
                    name="image"
                    defaultValue={data.image}
                    required
                    className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isVegetarian"
                    name="isVegetarian"
                    defaultChecked={data.isVegetarian}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="isVegetarian"
                    className="ml-2 block text-sm text-gray-900"
                  >
                    Vegetarian
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isGlutenFree"
                    name="isGlutenFree"
                    defaultChecked={data.isGlutenFree}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="isGlutenFree"
                    className="ml-2 block text-sm text-gray-900"
                  >
                    Gluten Free
                  </label>
                </div>
              </div>

              <div className="mt-4">
                <label
                  htmlFor="allergies"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Allergies (comma-separated)
                </label>

                <input
                  type="text"
                  id="allergies"
                  name="allergies"
                  defaultValue={data.allergies.join(", ")}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Link
            to="/staff/dashboard/menu"
            className="rounded-md px-6 py-2 text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={profitMargin < 60 || navigation.state === "submitting"}
            className={`rounded-md px-6 py-2 text-white transition-colors 
                  ${
                    profitMargin < 60
                      ? "cursor-not-allowed bg-gray-400"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
          >
            {navigation.state === "submitting" ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </Form>
    </div>
  );
}
