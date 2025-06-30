import {
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
  redirect,
  data,
} from "@remix-run/node";
import { Form, useLoaderData, Link } from "@remix-run/react";
import { custAuth } from "~/services/auth.server";
import { prisma } from "~/services/database.server";
import { Minus, Plus } from "lucide-react";
import { Button, Group, Input, NumberField } from "react-aria-components";
import { userBasket } from "~/services/cookies.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  // Parse form data from the request
  const formData = await request.formData();
  const id = formData.get("id") as string;
  const quantity = parseInt(formData.get("quantity") as string);
  const action = formData.get("action") as string;

  // Parse the existing basket cookie or initialize an empty object
  let cookie = (await userBasket.parse(request.headers.get("Cookie"))) || {};

  if (action === "bulk") {
    // Handle bulk addition of items to the basket
    const bulkItems = JSON.parse((formData.get("bulkItems") as string) || "[]");
    bulkItems.forEach((item: { id: string; quantity: number }) => {
      if (cookie[item.id]) {
        cookie[item.id] += item.quantity;
      } else {
        cookie[item.id] = item.quantity;
      }
    });
  } else {
    // Handle single item addition to the basket
    if (cookie[id]) {
      cookie[id] += quantity;
    } else {
      cookie[id] = quantity;
    }
  }

  // Return the updated basket as a cookie
  return data(
    { basket: cookie },
    {
      headers: { "Set-Cookie": await userBasket.serialize(cookie) },
    }
  );
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  // Redirect to the starter menu if no item parameter is provided
  if (!params.item) return redirect("/menu/starter");

  // Authenticate the user, redirect to login if not authenticated
  const user = await custAuth.isAuthenticated(request, {
    failureRedirect: "/login",
  });

  // Fetch the menu item data from the database
  let data = await prisma.menuItem.findUnique({
    where: { id: parseInt(params.item) },
  });

  // Redirect to the starter menu if the item is not found
  if (!data) return redirect("/menu/starter");

  // Check for user allergies against the item's allergens
  let allergies: string[] = [];
  user.allergies.forEach((allergy: string) => {
    if (data.allergies.includes(allergy)) {
      allergies.push(allergy);
    }
  });

  // Parse the existing basket cookie or initialize an empty object
  let cookie = (await userBasket.parse(request.headers.get("Cookie"))) || {};

  // Count total items in the basket
  const basketCount = Object.values(cookie).reduce(
    (sum, count) => (sum as number) + (count as number),
    0
  );

  // Define all categories for the navigation bar
  const categories = [
    { name: "Starters", link: "/menu/starter" },
    { name: "Mains", link: "/menu/main" },
    { name: "Desserts", link: "/menu/dessert" },
    { name: "Drinks", link: "/menu/drink" },
  ];

  // Return the loader data
  return {
    data,
    allergies,
    basket: cookie[data.id],
    basketCount,
    user,
    categories,
  };
};

export default function Index() {
  const { data, allergies, basket } = useLoaderData<typeof loader>();

  return (
    <div>
      <Link to={`/menu/${data.category}`} className="hover:underline">
        <h2 className="mb-4 text-xl font-semibold text-gray-800">
          {data?.category} / {data.name}
        </h2>
      </Link>

      {allergies.length > 0 && (
        <div className="mb-4 rounded-md bg-red-100 px-4 py-3 text-red-800">
          <p className="font-medium">Allergy Warning</p>
          <p>
            You are allergic to this item. It contains: {allergies.join(", ")}
          </p>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
          <div className="flex h-full max-h-80 w-full items-center justify-center overflow-hidden rounded-md bg-gray-100">
            <img
              className="h-full w-full object-cover"
              src={`/images/${data.image}`}
              alt={data.name}
            />
          </div>

          <div className="flex h-full flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {data.name}
                </h3>
                <p className="mt-2 text-gray-600">{data.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 rounded-md bg-gray-50 p-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Calories</p>
                  <p className="text-gray-900">{data.calories} kcal</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Price</p>
                  <p className="text-gray-900">£{data.price?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Vegetarian
                  </p>
                  <p className="text-gray-900">
                    {data.isVegetarian ? "Yes" : "No"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Gluten Free
                  </p>
                  <p className="text-gray-900">
                    {data.isGlutenFree ? "Yes" : "No"}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-500">Allergies</p>
                  <p className="capitalize text-gray-900">
                    {data.allergies.length > 0
                      ? data.allergies.join(", ")
                      : "None"}
                  </p>
                </div>
              </div>
            </div>

            <Form method="post" className="mt-6 flex w-full items-center gap-3">
              {basket && basket > 0 && (
                <span className="text-sm font-medium text-gray-600">
                  {basket} in basket
                </span>
              )}
              <input type="hidden" name="id" value={data.id} />
              <div className="flex-1"></div>
              <NumberField
                name="quantity"
                defaultValue={1}
                minValue={1}
                aria-label="Quantity"
                className="w-32"
              >
                <Group className="relative inline-flex h-10 items-center overflow-hidden whitespace-nowrap rounded-md border border-gray-300 bg-white text-sm shadow-sm transition-colors focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                  <Button
                    slot="decrement"
                    className="flex aspect-square h-full items-center justify-center border-r border-gray-300 bg-gray-50 text-gray-600 hover:bg-gray-100"
                  >
                    <Minus size={16} strokeWidth={2} aria-hidden="true" />
                  </Button>
                  <Input className="w-full bg-white px-3 py-2 text-center tabular-nums focus:outline-none" />
                  <Button
                    slot="increment"
                    className="flex aspect-square h-full items-center justify-center border-l border-gray-300 bg-gray-50 text-gray-600 hover:bg-gray-100"
                  >
                    <Plus size={16} strokeWidth={2} aria-hidden="true" />
                  </Button>
                </Group>
              </NumberField>
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700"
              >
                Add to basket
              </button>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
