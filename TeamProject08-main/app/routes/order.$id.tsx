import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { useEffect, useState } from "react";
import { useLiveLoader } from "~/hooks/use-live-loader";
import { custAuth } from "~/services/auth.server";
import { prisma } from "~/services/database.server";
import { emitter } from "~/services/emitter.server";
import { Form, Link, redirect } from "@remix-run/react";
import { getCheckoutSession, startOrder } from "~/services/orders.server";
import { ArrowLeft, CheckCircle2, TimerIcon } from "lucide-react";
import OrderStatus from "~/components/ui/order-status";
// Action function to handle form submissions for payment or calling a waiter
export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const orderId = formData.get("orderId") as string;
  const action = formData.get("action") as string;

  if (action === "pay") {
    // Start the payment process for the order
    return await startOrder({ orderId });
  } else if (action === "call-waiter") {
    const name = formData.get("name") as string;
    const tableId = formData.get("tableId") as string;

    if (!orderId || !name) return null;

    // Emit a notification to the waiter for assistance
    emitter.emit(
      "notifications:waiter",
      JSON.stringify({
        type: "message",
        message: `Customer ${name} at table ${tableId} needs assistance with order ${orderId}`,
      })
    );
  }

  return null;
};

// Loader function to fetch order and user data
export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const user = await custAuth.isAuthenticated(request, {
    failureRedirect: "/login", // Redirect to login if user is not authenticated
  });

  if (!params.id) return redirect("/menu/basket"); // Redirect if no order ID is provided

  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session_id");

  // Fetch the order details from the database
  let order = await prisma.order.findUnique({
    where: { id: Number(params.id) },
    include: { orderItems: { include: { menuItem: true } } },
  });

  if (!order) return redirect("/menu/basket"); // Redirect if order is not found

  // Update order payment status if session ID is provided
  if (!order.paymentId && sessionId) {
    let paymentData = (await getCheckoutSession(sessionId))
      .payment_intent as string;

    order = await prisma.order.update({
      where: { id: order.id },
      data: { paymentId: paymentData, paid: true },
      include: { orderItems: { include: { menuItem: true } } },
    });

    // Notify the dashboard about the updated order
    emitter.emit("dashboard:orders");
  }

  return {
    user, // Authenticated user data
    order, // Order details
  };
};

export default function Index() {
  const { order, user } = useLiveLoader<typeof loader>();
  const [currentStatus, setCurrentStatus] = useState(order.status);

  useEffect(() => {
    setCurrentStatus(order.status);
  }, [order.status]);

  // Format date
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
  };

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-8">
      {/* Header with Back Button */}
      <div className="mb-6 flex items-center">
        <Link
          to="/menu"
          className="mr-4 flex items-center text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Order Confirmation</h1>
      </div>

      {/* Payment Status Banner */}
      {order.paid && (
        <div className="mb-6 rounded-lg border-green-200 bg-green-50 p-4 shadow-sm">
          <div className="flex items-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="font-bold text-green-800">Payment Successful!</p>
              <p className="text-sm text-green-700">
                Thank you for your order. Your payment has been processed
                successfully.
              </p>
            </div>
          </div>
        </div>
      )}
      {!order.paid && order.status === "COMPLETED" && (
        <div className="mb-6 flex flex-row items-center justify-between rounded-lg border-yellow-200 bg-yellow-50 p-4 shadow-sm">
          <div className="flex items-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
              <TimerIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="font-bold text-yellow-800">Awaiting Payment</p>
              <p className="text-sm text-yellow-700">
                Your order is completed and awaiting payment. Please proceed to
                pay.
              </p>
            </div>
          </div>
          <Form method="post">
            <input type="hidden" name="orderId" value={order.id} />
            <input type="hidden" name="action" value="pay" />
            <button
              type="submit"
              className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-center font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              Pay Now
            </button>
          </Form>
        </div>
      )}

      <OrderStatus
        status={currentStatus}
        order={{ id: order.id, name: user.name, tableId: order.tableId }}
      />
      {/* Order Details Card */}
      <div className="mb-6 overflow-hidden rounded-lg border bg-white shadow-md">
        <div className="bg-gray-50 p-4">
          <h2 className="font-bold text-gray-800">Order Details</h2>
        </div>

        <div className="p-6">
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm text-gray-500">Order #</p>
              <p className="font-medium text-gray-800">{order.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Order Date</p>
              <p className="font-medium text-gray-800">
                {formatDate(order.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="font-medium text-gray-800">
                £{order.totalPrice.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Payment Status</p>
              <p className="font-medium text-gray-800">
                {order.paid ? "Paid" : "Pending"}
              </p>
            </div>
            {order.tableId && (
              <div>
                <p className="text-sm text-gray-500">Table Number</p>
                <p className="font-medium text-gray-800">{order.tableId}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order Items Card */}
      <div className="mb-6 overflow-hidden rounded-lg border bg-white shadow-md">
        <div className="flex items-center justify-between bg-gray-50 p-4">
          <h2 className="font-bold text-gray-800">Order Items</h2>
          <span className="rounded-full bg-gray-200 px-2 py-1 text-xs font-medium text-gray-800">
            {order.orderItems ? order.orderItems.length : 0} items
          </span>
        </div>

        <div className="divide-y overflow-hidden">
          {order.orderItems && order.orderItems.length > 0 ? (
            order.orderItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4"
              >
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-800">
                      {item.quantity}
                    </span>
                    <div>
                      <h3 className="font-medium text-gray-800">
                        {item.menuItem.name}
                      </h3>
                      {item.menuItem.description && (
                        <p className="mt-1 text-sm text-gray-500">
                          {item.menuItem.description.substring(0, 40)}
                          {item.menuItem.description.length > 40 ? "..." : ""}
                        </p>
                      )}
                      {item.note && (
                        <p className="mt-1 text-xs italic text-gray-500">
                          Note: {item.note}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="ml-4 text-right">
                  <p className="font-medium text-gray-800">
                    £{(item.price * item.quantity).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">
                    £{item.price.toFixed(2)} each
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-gray-500">
              No items in this order
            </div>
          )}
        </div>

        <div className="border-t bg-gray-50 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span>£{order.totalPrice.toFixed(2)}</span>
          </div>
          {/* Add tax rows here if applicable */}
          <div className="mt-2 flex items-center justify-between font-bold">
            <span>Total</span>
            <span>£{order.totalPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          to="/menu"
          className="flex-1 rounded-lg bg-gray-100 px-6 py-3 text-center font-medium text-gray-800 shadow-sm transition-colors hover:bg-gray-200"
        >
          Return to Menu
        </Link>
      </div>
    </div>
  );
}
