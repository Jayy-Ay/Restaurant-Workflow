import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import {
  data,
  Form,
  useLoaderData,
  Link,
  NavLink,
  redirect,
} from "@remix-run/react";
import { Minus, Plus, ShoppingBasket, Trash2 } from "lucide-react";
import { Button, Group, Input, NumberField } from "react-aria-components";
import { custAuth, staffAuth } from "~/services/auth.server";
import { userBasket } from "~/services/cookies.server";
import { prisma } from "~/services/database.server";
import { createOrder } from "~/services/orders.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await staffAuth.isAuthenticated(request, {
    failureRedirect: "/login",
  });

  const formData = await request.formData();
  const action = formData.get("action") as string;

  let cookie = (await userBasket.parse(request.headers.get("Cookie"))) || {};

  if (action === "update-basket") {
    const id = formData.get("id") as string;
    const quantity = parseInt(formData.get("quantity") as string);

    if (quantity <= 0) {
      // Remove item from basket if quantity is 0 or negative
      delete cookie[id];
    } else {
      cookie[id] = quantity;
    }
  } else if (action === "order") {
    // return await startOrder({ request });

    let orderDetails = await createOrder({
      user,
      basket: cookie,
    });

    return redirect(`/order/${orderDetails.id}`, {
      headers: {
        "Set-Cookie": await userBasket.serialize({}),
      },
    });
  } else if (action === "clear") {
    // Clear the entire basket
    cookie = {};
  }

  return data(
    { basket: cookie },
    {
      headers: { "Set-Cookie": await userBasket.serialize(cookie) },
    }
  );
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await custAuth.isAuthenticated(request, {
    failureRedirect: "/login",
  });

  const basket = (await userBasket.parse(request.headers.get("Cookie"))) || {};

  // Count total items in basket
  const basketCount = Object.values(basket).reduce(
    (sum, count) => (sum as number) + (count as number),
    0
  );

  const menuItems = await prisma.menuItem.findMany();
  const detailedBasket = menuItems
    .filter((menuItem) => basket[menuItem.id])
    .map((menuItem) => {
      const quantity = basket[menuItem.id];
      return {
        id: menuItem.id,
        name: menuItem.name,
        image: menuItem.image,
        price: menuItem.price,
        totalPrice: (menuItem.price * quantity).toFixed(2),
        quantity: quantity,
        stock: menuItem.stock,
        notEnoughStock: menuItem.stock < quantity,
      };
    });

  const totalPrice = detailedBasket
    .reduce((total, item) => total + parseFloat(item.totalPrice), 0)
    .toFixed(2);

  return {
    user,
    basket: detailedBasket,
    basketCount,
    totalPrice,
  };
};

export default function Index() {
  const { user, basket, basketCount, totalPrice } =
    useLoaderData<typeof loader>();

  return (
    <div>
      <h2 className="mb-6 text-2xl font-semibold text-gray-800">Your Basket</h2>

      {basket.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
          <ShoppingBasket className="mb-4 h-12 w-12 text-gray-400" />
          <p className="text-lg font-medium text-gray-500">
            Your basket is empty
          </p>
          <p className="mt-1 text-sm text-gray-400">
            Start adding items from our menu
          </p>
          <Link
            to="/menu/all"
            className="mt-6 rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
          >
            Browse Menu
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    Items ({basketCount})
                  </h3>
                  <Form method="post">
                    <input type="hidden" name="action" value="clear" />
                    <button
                      type="submit"
                      className="flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={16} />
                      Clear All
                    </button>
                  </Form>
                </div>

                <div className="divide-y divide-gray-200">
                  {basket.map((item) => (
                    <div key={item.id} className="py-4">
                      <div className="flex gap-4">
                        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                          <img
                            src={`/images/${item.image}`}
                            alt={item.name}
                            className="h-full w-full object-cover object-center"
                          />
                        </div>

                        <div className="flex flex-1 flex-col">
                          <div className="flex justify-between text-base font-medium text-gray-900">
                            <h3>{item.name}</h3>
                            <p className="ml-4">£{item.totalPrice}</p>
                          </div>
                          <p className="mt-1 text-sm text-gray-500">
                            £{item.price.toFixed(2)} each
                          </p>

                          {item.notEnoughStock && (
                            <p className="mt-1 text-sm font-medium text-red-600">
                              Not enough stock available (short by{" "}
                              {Math.abs(item.stock - item.quantity)})
                            </p>
                          )}

                          <div className="mt-2 flex items-center gap-4">
                            <Form method="post" className="flex items-center">
                              <input type="hidden" name="id" value={item.id} />
                              <input
                                type="hidden"
                                name="action"
                                value="update-basket"
                              />
                              <NumberField
                                name="quantity"
                                defaultValue={item.quantity}
                                aria-label="Quantity"
                                minValue={0}
                              >
                                <Group className="relative inline-flex h-8 items-center overflow-hidden whitespace-nowrap rounded-md border border-gray-300 bg-white text-sm shadow-sm transition-colors focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                                  <Button
                                    slot="decrement"
                                    type="submit"
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
                                    type="submit"
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
                            </Form>

                            <Form method="post">
                              <input type="hidden" name="id" value={item.id} />
                              <input type="hidden" name="quantity" value="0" />
                              <input
                                type="hidden"
                                name="action"
                                value="update-basket"
                              />
                              <button
                                type="submit"
                                className="text-sm font-medium text-gray-500 hover:text-red-600"
                              >
                                Remove
                              </button>
                            </Form>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="p-6">
                <h3 className="mb-4 text-lg font-medium text-gray-900">
                  Order Summary
                </h3>

                <div className="space-y-4">
                  <div className="flex justify-between border-b border-gray-200 pb-4">
                    <p className="text-gray-600">Subtotal</p>
                    <p className="font-medium text-gray-900">£{totalPrice}</p>
                  </div>

                  <div className="flex justify-between border-b border-gray-200 pb-4">
                    <p className="text-gray-600">Delivery Fee</p>
                    <p className="font-medium text-gray-900">£0.00</p>
                  </div>

                  <div className="flex justify-between">
                    <p className="text-lg font-medium text-gray-900">Total</p>
                    <p className="text-lg font-bold text-gray-900">
                      £{totalPrice}
                    </p>
                  </div>

                  <Form method="post" className="mt-6">
                    <input type="hidden" name="action" value="order" />
                    <button
                      type="submit"
                      className="w-full rounded-md bg-blue-600 py-3 font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Place Order
                    </button>
                  </Form>

                  <div className="mt-4 text-center">
                    <Link
                      to="/menu/all"
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      Continue Shopping
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
