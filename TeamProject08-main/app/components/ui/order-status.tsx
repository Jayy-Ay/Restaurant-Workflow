import { useEffect, useState } from "react";
import { StatusProps } from "~/types/order";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  TimerIcon,
  ShoppingBag,
  ChefHat,
  Package,
} from "lucide-react";
import { Form, useSubmit } from "@remix-run/react";

const STATUS_MAP = {
  PENDING: {
    label: "Order Received",
    description: "Your order has been received and is being processed.",
    icon: <Clock className="h-6 w-6 text-blue-500" />,
  },
  READY_TO_COOK: {
    label: "Order Confirmed",
    description: "We're getting ready to prepare your meal.",
    icon: <ShoppingBag className="h-6 w-6 text-orange-500" />,
  },
  COOKING: {
    label: "Preparing Your Order",
    description: "Our chefs are preparing your delicious meal.",
    icon: <ChefHat className="h-6 w-6 text-pink-500" />,
  },
  READY_TO_DELIVER: {
    label: "Ready for Pickup",
    description: "Your food is ready for pickup/delivery.",
    icon: <Package className="h-6 w-6 text-yellow-500" />,
  },
  COMPLETED: {
    label: "Order Completed",
    description: "Your order has been completed. Enjoy your meal!",
    icon: <CheckCircle2 className="h-6 w-6 text-green-500" />,
  },
  CANCELLED: {
    label: "Order Cancelled",
    description: "Your order has been cancelled.",
    icon: <ArrowLeft className="h-6 w-6 text-red-500" />,
  },
};

export default function OrderStatus({ status, order }: any) {
  const [notified, setNotified] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState(15);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const submit = useSubmit();

  // Calculate remaining time based on status
  const calculateRemainingTime = () => {
    const remainingMinutes = estimatedTime - timeElapsed;
    if (remainingMinutes <= 0) return "< 1 minute";
    if (remainingMinutes === 1) return "1 minute";
    return `${remainingMinutes} minutes`;
  };

  // Update order status in real-time
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [timeElapsed, status]);

  const { label, description, icon } = STATUS_MAP[status];

  return (
    <div className="mb-6 overflow-hidden rounded-lg border bg-white shadow-md">
      <div className="flex flex-row items-center justify-between bg-gray-50 p-4">
        <h2 className="font-bold text-gray-800">Order Status</h2>
        <Form method="post" onSubmit={() => setNotified(true)}>
          <input type="hidden" name="action" value="call-waiter" />
          <input type="hidden" name="orderId" value={order.id} />
          <input type="hidden" name="name" value={order.name} />
          <input type="hidden" name="tableId" value={order.tableId} />
          <button
            disabled={notified}
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {notified ? "You have notified the waiter" : "Call Waiter"}
          </button>
        </Form>
      </div>

      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            {icon}
            <div className="ml-3">
              <p className="font-medium text-gray-800">{label}</p>
              <p className="text-sm text-gray-500">{description}</p>
            </div>
          </div>

          {status !== "COMPLETED" && (
            <div className="flex items-center rounded-full bg-blue-50 px-4 py-2">
              <TimerIcon className="mr-2 h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-blue-700">
                {calculateRemainingTime()}
              </span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-2 h-2 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full bg-blue-500 transition-all duration-500"
            style={{
              width:
                status === "PENDING" || status === "READY_TO_COOK"
                  ? "25%"
                  : status === "COOKING"
                  ? "50%"
                  : status === "READY_TO_DELIVER"
                  ? "75%"
                  : status === "COMPLETED"
                  ? "100%"
                  : "0%",
            }}
          ></div>
        </div>

        {/* Status Steps */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div
            className={`${
              status === "PENDING" ||
              status === "READY_TO_COOK" ||
              status === "COOKING" ||
              status === "READY_TO_DELIVER" ||
              status === "COMPLETED"
                ? "text-blue-600"
                : "text-gray-400"
            }`}
          >
            <div
              className={`mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full ${
                status === "PENDING" ||
                status === "READY_TO_COOK" ||
                status === "COOKING" ||
                status === "READY_TO_DELIVER" ||
                status === "COMPLETED"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200"
              }`}
            >
              1
            </div>
            <p className="text-xs font-medium">Confirmed</p>
          </div>

          <div
            className={`${
              status === "COOKING" ||
              status === "READY_TO_DELIVER" ||
              status === "COMPLETED"
                ? "text-blue-600"
                : "text-gray-400"
            }`}
          >
            <div
              className={`mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full ${
                status === "COOKING" ||
                status === "READY_TO_DELIVER" ||
                status === "COMPLETED"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200"
              }`}
            >
              2
            </div>
            <p className="text-xs font-medium">Preparing</p>
          </div>

          <div
            className={`${
              status === "READY_TO_DELIVER" || status === "COMPLETED"
                ? "text-blue-600"
                : "text-gray-400"
            }`}
          >
            <div
              className={`mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full ${
                status === "READY_TO_DELIVER" || status === "COMPLETED"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200"
              }`}
            >
              3
            </div>
            <p className="text-xs font-medium">Ready</p>
          </div>

          <div
            className={`${
              status === "COMPLETED" ? "text-blue-600" : "text-gray-400"
            }`}
          >
            <div
              className={`mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full ${
                status === "COMPLETED"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200"
              }`}
            >
              4
            </div>
            <p className="text-xs font-medium">Completed</p>
          </div>
        </div>
      </div>
    </div>
  );
}
