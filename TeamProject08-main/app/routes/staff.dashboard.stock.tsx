import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, Form } from "@remix-run/react";
import { prisma } from "~/services/database.server";
import { Clock, Minus, Plus, Search } from "lucide-react";
import { useState, useTransition } from "react";
import { Button, Group, Input, NumberField } from "react-aria-components";

// Action function to update the stock value for a menu item
export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const menuItemId = formData.get("id");
  const newStock = formData.get("new-stock");
  const action = formData.get("action");

  if (!menuItemId || !newStock) {
    return json({ error: "Missing required fields" }, { status: 400 });
  }

  if (action === "update-basket") {
    await prisma.menuItem.update({
      where: { id: Number(menuItemId) },
      data: { stock: Number(newStock) },
    });
  }

  return null;
};

// Loader function to get all menu items
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const items = await prisma.menuItem.findMany({
    orderBy: { name: "asc" },
  });
  return json({ items });
};

export default function StocksPage() {
  const { items } = useLoaderData<typeof loader>();
  const [searchTerm, setSearchTerm] = useState("");
  const transition = useTransition();

  // Filter menu items based on the search term.
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Stocks Dashboard</h2>

      {/* Search Input */}
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search menu items"
            className="w-64 rounded-md border border-gray-300 py-2 pl-10 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* No items found */}
      {filteredItems.length === 0 ? (
        <div className="flex h-64  flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="text-lg font-medium text-gray-500">No items found</p>
          <p className="mt-1 text-sm text-gray-400">
            Try adjusting your search criteria
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredItems.map((menuItem) => (
            <div
              key={menuItem.id}
              className="relative w-[298px] rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md"
            >
              <img
                className="max-h-36 w-full rounded-t-lg object-cover"
                src={`/images/${menuItem.image}`}
              />

              <div className="p-5">
                <div className="flex justify-between">
                  <h3 className="font-medium text-gray-800">{menuItem.name}</h3>
                </div>
                {menuItem.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                    {menuItem.description}
                  </p>
                )}
                <Form method="post" className="mt-4 flex items-center">
                  <input type="hidden" name="id" value={menuItem.id} />
                  <input type="hidden" name="action" value="update-basket" />
                  <NumberField
                    name="new-stock"
                    defaultValue={menuItem.stock}
                    aria-label="Stock"
                    minValue={0}
                  >
                    <Group className="relative inline-flex h-8 items-center overflow-hidden whitespace-nowrap rounded-md border border-gray-300 bg-white text-sm shadow-sm transition-colors focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                      <Button
                        slot="decrement"
                        type="submit"
                        className="flex aspect-square h-full items-center justify-center border-r border-gray-300 bg-gray-50 text-gray-600 hover:bg-gray-100"
                      >
                        <Minus size={14} strokeWidth={2} aria-hidden="true" />
                      </Button>
                      <Input className="w-12 bg-white px-2 py-1 text-center tabular-nums focus:outline-none" />
                      <Button
                        slot="increment"
                        type="submit"
                        className="flex aspect-square h-full items-center justify-center border-l border-gray-300 bg-gray-50 text-gray-600 hover:bg-gray-100"
                      >
                        <Plus size={14} strokeWidth={2} aria-hidden="true" />
                      </Button>
                    </Group>
                  </NumberField>
                </Form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
