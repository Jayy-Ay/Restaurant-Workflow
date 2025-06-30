import type { ActionFunctionArgs } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form } from "@remix-run/react";
import { Clock, Minus, Plus, Users } from "lucide-react";
import { Button, Group, Input, NumberField } from "react-aria-components";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import { useLiveLoader } from "~/hooks/use-live-loader";
import { staffAuth } from "~/services/auth.server";
import { prisma } from "~/services/database.server";
import { emitter } from "~/services/emitter.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const action = formData.get("action");
  const customerId = formData.get("customerId");

  if (action === "update-basket") {
    const basketUpdates = Array.from(formData.entries())
      .filter(([key]) => !isNaN(Number(key)))
      .map(([key, value]) => ({
        menuItemId: Number(key),
        quantity: Number(value),
      }))
      .filter((item) => item.quantity > 0);

    emitter.emit(
      "menu:notifications:" + customerId,
      JSON.stringify({
        type: action,
        basketUpdates: JSON.stringify(basketUpdates),
      })
    );
  }
  if (action === "update-order") {
    const orderId = formData.get("orderId");
    const menuItems = await prisma.menuItem.findMany();

    // Convert basket array to a key-value object for easier lookup
    const basketObject = Object.fromEntries(
      Array.from(formData.entries()).filter(([key]) => !isNaN(Number(key)))
    );

    const orderUpdates = menuItems
      .filter((menuItem) => {
        // Check if the menu item exists in the basket and has a quantity > 0
        return (
          basketObject[menuItem.id] && Number(basketObject[menuItem.id]) > 0
        );
      })
      .map((menuItem) => {
        const quantity = Number(basketObject[menuItem.id]);
        return {
          price: parseFloat((menuItem.price * quantity).toFixed(2)),
          quantity: quantity,
          note: "",
          reason: "",
          menuItem: { connect: { id: menuItem.id } },
        };
      });

    await prisma.order.update({
      where: {
        id: Number(orderId),
      },
      data: {
        orderItems: {
          deleteMany: {}, // Remove all existing order items
          create: orderUpdates, // Add the new order items
        },
      },
    });

    emitter.emit(
      "menu:notifications:" + customerId,
      JSON.stringify({
        type: action,
      })
    );
  }

  return null;
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await staffAuth.isAuthenticated(request, {
    failureRedirect: "/staff/login",
    notAllowedRole: "customer",
  });

  const tables = await prisma.table.findMany({
    include: {
      orders: {
        include: {
          customer: true,
          waiter: true,
          orderItems: true,
        },
        orderBy: { createdAt: "desc" },
      },
      Customer: {
        include: {
          orders: true,
        },
      },
    },
    orderBy: { id: "asc" },
  });

  const items = await prisma.menuItem.findMany({});

  return json({ user, tables, items });
};

export default function TablesDashboard() {
  const { tables, items } = useLiveLoader<typeof loader>();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold capitalize text-gray-800">Tables</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tables.map((table) => {
          // Filter customers at this table who haven't placed orders yet
          const customersWithoutOrders = table.Customer.filter(
            (customer) => customer.orders.length === 0
          );

          return (
            <div
              key={table.id}
              className="relative w-[298px] rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md"
            >
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-800">
                    Table #{table.id}
                  </h3>
                  <span
                    className={`rounded px-2 py-1 text-xs font-semibold ${
                      table.status === "OCCUPIED"
                        ? "bg-blue-100 text-blue-800"
                        : table.status === "AVAILABLE"
                        ? "bg-green-100 text-green-800"
                        : table.status === "RESERVED"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {table.status}
                  </span>
                </div>

                <div className="mt-2 flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-xs text-gray-500">
                    Capacity: {table.capacity} persons
                  </span>
                </div>

                {/* Customers without orders section */}
                {customersWithoutOrders.length > 0 && (
                  <div className="mt-4">
                    <h4 className="mb-2 text-sm font-semibold text-gray-700">
                      Customers Without Orders
                    </h4>
                    <div className="space-y-2">
                      {customersWithoutOrders.map((customer) => (
                        <div
                          key={customer.id}
                          className="rounded-md bg-gray-50 p-2"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-xs font-medium">
                                {customer.name}
                              </span>
                              {customer.allergies.length > 0 && (
                                <div className="mt-1 text-xs text-red-500">
                                  Allergies: {customer.allergies.join(", ")}
                                </div>
                              )}
                              {customer.dietary.length > 0 && (
                                <div className="mt-1 text-xs text-gray-500">
                                  Dietary: {customer.dietary.join(", ")}
                                </div>
                              )}
                            </div>
                            <Sheet>
                              <SheetTrigger asChild>
                                <button className="flex items-center justify-center space-x-2 rounded-md bg-blue-600 px-2 py-1 text-sm text-white transition-colors hover:bg-blue-700">
                                  Suggest
                                </button>
                              </SheetTrigger>
                              <SheetContent>
                                <SheetHeader>
                                  <SheetTitle>Suggest items</SheetTitle>
                                  <SheetDescription>
                                    This will add these items to the customer's
                                    basket.
                                  </SheetDescription>
                                </SheetHeader>
                                <Form
                                  method="post"
                                  className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2"
                                >
                                  <input
                                    type="hidden"
                                    name="action"
                                    value="update-basket"
                                  />
                                  <input
                                    type="hidden"
                                    name="customerId"
                                    value={customer.id}
                                  />
                                  {items.map((menuItem) => (
                                    <div
                                      key={menuItem.id}
                                      className="relative rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md"
                                    >
                                      <div className="p-5">
                                        <div className="flex justify-between">
                                          <h3 className="font-medium text-gray-800">
                                            {menuItem.name}
                                          </h3>
                                        </div>
                                        <div className="mt-4 flex items-center">
                                          <NumberField
                                            name={String(menuItem.id)}
                                            defaultValue={0}
                                            aria-label="Quantity"
                                            minValue={0}
                                          >
                                            <Group className="relative inline-flex h-8 items-center overflow-hidden whitespace-nowrap rounded-md border border-gray-300 bg-white text-sm shadow-sm transition-colors focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                                              <Button
                                                slot="decrement"
                                                className="flex aspect-square h-full items-center justify-center border-r border-gray-300 bg-gray-50 text-gray-600 hover:bg-gray-100"
                                              >
                                                <Minus
                                                  size={14}
                                                  strokeWidth={2}
                                                  aria-hidden="true"
                                                />
                                              </Button>
                                              <Input className="w-12 bg-white px-2 py-1 text-center tabular-nums focus:outline-none" />
                                              <Button
                                                slot="increment"
                                                className="flex aspect-square h-full items-center justify-center border-l border-gray-300 bg-gray-50 text-gray-600 hover:bg-gray-100"
                                              >
                                                <Plus
                                                  size={14}
                                                  strokeWidth={2}
                                                  aria-hidden="true"
                                                />
                                              </Button>
                                            </Group>
                                          </NumberField>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                  <button
                                    type="submit"
                                    className="col-span-2 flex h-9 w-full items-center justify-center space-x-2 rounded-md bg-blue-600 px-2 py-1 text-sm text-white transition-colors hover:bg-blue-700"
                                  >
                                    Add to basket
                                  </button>
                                </Form>
                              </SheetContent>
                            </Sheet>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Orders section */}
                <div className="mt-4">
                  <h4 className="mb-2 text-sm font-semibold text-gray-700">
                    Current Orders
                  </h4>
                  {table.orders.length === 0 ? (
                    <p className="text-sm text-gray-500">No active orders</p>
                  ) : (
                    <div className="space-y-2">
                      {table.orders.slice(0, 2).map((order) => (
                        <div
                          key={order.id}
                          className="rounded-md bg-gray-50 p-2"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-xs font-medium">
                                Order #{order.id}
                              </span>
                              <div className="mt-1 flex items-center text-xs text-gray-500">
                                <Clock className="mr-1 h-3 w-3" />
                                {new Date(order.createdAt).toLocaleTimeString()}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <div className="flex space-x-1">
                                <span
                                  className={`rounded px-2 py-1 text-xs ${
                                    order.status === "COMPLETED"
                                      ? "bg-green-100 text-green-800"
                                      : order.status === "PENDING"
                                      ? "bg-blue-100 text-blue-800"
                                      : order.status === "COOKING"
                                      ? "bg-orange-100 text-orange-800"
                                      : order.status === "CANCELLED"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {order.status}
                                </span>
                                <span
                                  className={`rounded px-2 py-1 text-xs ${
                                    order.paid
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {order.paid ? "PAID" : "UNPAID"}
                                </span>
                              </div>
                              {order.status === "CANCELLED" && (
                                <Sheet>
                                  <SheetTrigger asChild>
                                    <button className="flex w-full items-center justify-center space-x-2 rounded-md bg-blue-600 px-2 py-1 text-sm text-white transition-colors hover:bg-blue-700">
                                      Change order
                                    </button>
                                  </SheetTrigger>
                                  <SheetContent>
                                    <SheetHeader>
                                      <SheetTitle>Add to basket</SheetTitle>
                                      <SheetDescription>
                                        This will add these items to the
                                        customers basket.
                                      </SheetDescription>
                                    </SheetHeader>
                                    <Form
                                      method="post"
                                      className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2"
                                    >
                                      <input
                                        type="hidden"
                                        name="action"
                                        value="update-order"
                                      />
                                      <input
                                        type="hidden"
                                        name="orderId"
                                        value={order.id}
                                      />
                                      <input
                                        type="hidden"
                                        name="customerId"
                                        value={order.customerId}
                                      />
                                      {items.map((menuItem) => {
                                        const itemQuantity =
                                          order.orderItems.find(
                                            (item) =>
                                              item.menuItemId === menuItem.id
                                          )?.quantity || 0;

                                        return (
                                          <div
                                            key={menuItem.id}
                                            className="relative rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md"
                                          >
                                            <div className="p-5">
                                              <div className="flex justify-between">
                                                <h3 className="font-medium text-gray-800">
                                                  {menuItem.name}
                                                </h3>
                                              </div>
                                              <div className="mt-4 flex items-center">
                                                <NumberField
                                                  name={String(menuItem.id)}
                                                  aria-label="Quantity"
                                                  defaultValue={itemQuantity}
                                                  minValue={0}
                                                >
                                                  <Group className="relative inline-flex h-8 items-center overflow-hidden whitespace-nowrap rounded-md border border-gray-300 bg-white text-sm shadow-sm transition-colors focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                                                    <Button
                                                      slot="decrement"
                                                      className="flex aspect-square h-full items-center justify-center border-r border-gray-300 bg-gray-50 text-gray-600 hover:bg-gray-100"
                                                    >
                                                      <Minus
                                                        size={14}
                                                        strokeWidth={2}
                                                        aria-hidden="true"
                                                      />
                                                    </Button>
                                                    <Input className="w-12 bg-white px-2 py-1 text-center tabular-nums focus:outline-none" />
                                                    <Button
                                                      slot="increment"
                                                      className="flex aspect-square h-full items-center justify-center border-l border-gray-300 bg-gray-50 text-gray-600 hover:bg-gray-100"
                                                    >
                                                      <Plus
                                                        size={14}
                                                        strokeWidth={2}
                                                        aria-hidden="true"
                                                      />
                                                    </Button>
                                                  </Group>
                                                </NumberField>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                      <button
                                        type="submit"
                                        className="col-span-2 flex h-9 w-full items-center justify-center space-x-2 rounded-md bg-blue-600 px-2 py-1 text-sm text-white transition-colors hover:bg-blue-700"
                                      >
                                        Add to order
                                      </button>
                                    </Form>
                                  </SheetContent>
                                </Sheet>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {table.orders.length > 2 && (
                        <p className="mt-2 text-center text-xs text-gray-500">
                          +{table.orders.length - 2} more orders
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
