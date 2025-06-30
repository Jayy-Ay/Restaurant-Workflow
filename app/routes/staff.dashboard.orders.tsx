import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { Link, useSubmit } from "@remix-run/react";
import {
  ArrowRight,
  Filter,
  Search,
  Clock,
  CheckCircle,
  ChefHat,
  Coffee,
  Bell,
} from "lucide-react";
import { formatTime } from "~/lib/utils";
import { staffAuth } from "~/services/auth.server";
import { prisma } from "~/services/database.server";
import { useState, useEffect } from "react";
import { json } from "@remix-run/node";
import { useLiveLoader } from "~/hooks/use-live-loader";
import { emitter } from "~/services/emitter.server";
import { StatusSelectPill } from "~/components/ui/status-dropdown";
import type { OrderStatus as PrismaOrderStatus } from "@prisma/client";
// Handles actions such as updating order status
export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await staffAuth.isAuthenticated(request, {
    failureRedirect: "/staff/login",
    notAllowedRole: "customer",
  });

  const formData = await request.formData();
  const orderId = formData.get("orderId") as string;
  const action = formData.get("action") as string;
  const customerId = formData.get("customerId") as string;

  // Validate required fields
  if (!orderId || !action) {
    return json({ error: "Missing required fields" }, { status: 400 });
  }

  // Prepare data for updating the order
  let updateData: any = { status: action, updatedAt: new Date() };
  if (action === "COMPLETED") updateData.completedAt = new Date();

  // Update the order in the database
  await prisma.order.update({
    where: { id: parseInt(orderId) },
    data: updateData,
  });

  // Emit events for real-time updates
  emitter.emit("dashboard:orders");
  emitter.emit(`orders:customer:${orderId}`);

  // Notify waiter if the order is ready to deliver
  if (action === "READY_TO_DELIVER") {
    emitter.emit(
      "notifications:waiter",
      JSON.stringify({
        type: "success",
        message: `Order #${orderId} is ready to serve`,
      })
    );
  }

  return json({ success: true });
};

// Loads the orders and user data for the dashboard
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await staffAuth.isAuthenticated(request, {
    failureRedirect: "/staff/login",
    notAllowedRole: "customer",
  });

  // Fetch orders with related data
  const orders = await prisma.order.findMany({
    include: {
      orderItems: {
        include: {
          menuItem: true,
        },
      },
      customer: true,
      waiter: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return {
    user,
    orders,
  };
};

type OrderStatus = PrismaOrderStatus;

type UserRole =
  | "WAITER"
  | "HEAD_CHEF"
  | "SOUS_CHEF"
  | "DISH_WASHER"
  | "PORTER"
  | "GRILL_CHEF"
  | "ADMIN"
  | "CUSTOMER";

const statusColors: Record<OrderStatus, string> = {
  PENDING: "bg-blue-100 text-blue-800",
  READY_TO_COOK: "bg-orange-100 text-orange-800",
  COOKING: "bg-pink-100 text-pink-800",
  READY_TO_DELIVER: "bg-yellow-100 text-yellow-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  UNAVAILABLE: "bg-gray-100 text-gray-800",
};

const statusNames: Record<OrderStatus, string> = {
  PENDING: "Pending",
  READY_TO_COOK: "Ready to cook",
  COOKING: "Cooking",
  READY_TO_DELIVER: "Ready to deliver",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  UNAVAILABLE: "Unavailable",
};

// Check if user is kitchen staff
const isKitchenStaff = (role: UserRole): boolean => {
  const kitchenRoles = ["HEAD_CHEF", "SOUS_CHEF", "PORTER", "GRILL_CHEF"];
  return kitchenRoles.includes(role);
};

// Calculate time elapsed since order was created for active orders
const getTimeElapsed = (createdAt: string) => {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();

  return formatTimeDifference(diffMs);
};

// Calculate total time taken for completed orders
const getTotalOrderTime = (createdAt: string, completedAt: string | null) => {
  if (!completedAt) return "N/A";

  const created = new Date(createdAt);
  const completed = new Date(completedAt);
  const diffMs = completed.getTime() - created.getTime();

  return formatTimeDifference(diffMs);
};

// Format time difference in ms to a readable format
const formatTimeDifference = (diffMs: number) => {
  // Convert to minutes and hours
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;

  if (hours > 0) {
    return `${hours}h ${mins}m`;
  } else {
    return `${mins}m`;
  }
};

// Determine color based on elapsed time
const getElapsedTimeColor = (createdAt: string, status: OrderStatus) => {
  if (status === "COMPLETED" || status === "CANCELLED") {
    return "text-gray-500";
  }

  const diffMins = Math.floor(
    (new Date().getTime() - new Date(createdAt).getTime()) / (1000 * 60)
  );

  if (diffMins < 15) {
    return "text-green-600";
  } else if (diffMins < 30) {
    return "text-yellow-600";
  } else {
    return "text-red-600 font-bold";
  }
};

export default function Index() {
  const { user, orders } = useLiveLoader<typeof loader>();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "ALL">("ALL");
  const [currentTime, setCurrentTime] = useState(new Date());
  const submit = useSubmit();

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toString().includes(searchTerm);
    const matchesStatus =
      statusFilter === "ALL" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Handle state change for an order
  const handleStatusChange = (
    orderId: number,
    action: string,
    customerId: number
  ) => {
    const formData = new FormData();
    formData.append("orderId", orderId.toString());
    formData.append("action", action);
    formData.append("customerId", customerId.toString());
    submit(formData, { method: "post" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Orders</h2>
        <div className="flex space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search by customer or ID"
              className="w-64 rounded-md border border-gray-300 py-2 pl-10 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <select
              className="w-40 appearance-none rounded-md border border-gray-300 bg-white py-2 pl-10 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as OrderStatus | "ALL")
              }
            >
              <option value="ALL">All Statuses</option>
              {Object.keys(statusNames).map((status) => (
                <option key={status} value={status}>
                  {statusNames[status as OrderStatus]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
          <p className="text-lg font-medium text-gray-500">No orders found</p>
          <p className="mt-1 text-sm text-gray-400">
            Try adjusting your search or filter criteria
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-8">
                <div className="flex items-center space-x-2">
                  <span className="font-bold">Order #{order.id}</span>
                  <span className="text-sm text-gray-500">
                    • {formatTime(order.createdAt)}
                  </span>
                </div>
                <StatusSelectPill
                  currentStatus={order.status}
                  orderId={order.id}
                  customerId={order.customerId}
                  userRole={user.role as UserRole}
                  statusColors={statusColors}
                  statusNames={statusNames}
                />
              </div>

              {/* Time tracking: Live for active orders, total time for completed ones */}
              {order.status === "COMPLETED" || order.status === "CANCELLED" ? (
                <div className="mt-2 flex items-center space-x-1">
                  <Clock className="h-3 w-3 text-gray-500" />
                  <span className="text-xs font-medium text-gray-500">
                    Total time:{" "}
                    {getTotalOrderTime(
                      order.createdAt.toString(),
                      order.completedAt?.toString() || null
                    )}
                  </span>
                </div>
              ) : (
                <div className="mt-2 flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span
                    className={`text-xs font-medium ${getElapsedTimeColor(
                      order.createdAt.toString(),
                      order.status
                    )}`}
                  >
                    {getTimeElapsed(order.createdAt.toString())} ago
                  </span>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{order.customer.name}</h3>
                  <p className="text-sm text-gray-500">
                    Table #{order.tableId}
                  </p>
                </div>
                {order.waiter && (
                  <div className="text-right">
                    <p className="text-xs font-medium text-gray-500">Waiter</p>
                    <p className="text-sm">{order.waiter.name}</p>
                  </div>
                )}
              </div>

              <div className="mt-4">
                <p className="mb-2 text-xs font-medium text-gray-500">
                  Items ({order.orderItems.length})
                </p>
                <div className="max-h-28 min-h-24 overflow-y-auto rounded-md bg-gray-50 p-3">
                  <ul className="space-y-2">
                    {order.orderItems.map((item, index) => (
                      <li key={index} className="flex justify-between text-sm">
                        <span>
                          <span className="font-medium">{item.quantity}×</span>{" "}
                          {item.menuItem.name}
                        </span>
                        {item.menuItem.price && (
                          <span className="text-gray-600">
                            £{(item.menuItem.price * item.quantity).toFixed(2)}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm font-medium">
                  Total: £{order.totalPrice?.toFixed(2) || "N/A"}
                </div>
                <Link
                  to={`/staff/dashboard/orders/${order.id}`}
                  className="rounded-full bg-gray-100 p-2 transition-colors hover:bg-blue-100 hover:text-blue-600"
                >
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Role-based action buttons */}
              <div className="mt-4 min-h-10 border-t border-gray-100 pt-4">
                {/* Waiter confirmation button - PENDING to READY_TO_COOK */}
                {user.role === "WAITER" && order.status === "PENDING" && (
                  <button
                    onClick={() =>
                      handleStatusChange(
                        order.id,
                        "READY_TO_COOK",
                        order.customerId
                      )
                    }
                    className="flex w-full items-center justify-center space-x-2 rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Confirm Order</span>
                  </button>
                )}

                {/* Kitchen staff button - COOKING to READY_TO_DELIVER */}
                {isKitchenStaff(user.role as UserRole) &&
                  order.status === "READY_TO_COOK" && (
                    <button
                      onClick={() =>
                        handleStatusChange(
                          order.id,
                          "COOKING",
                          order.customerId
                        )
                      }
                      className="flex w-full items-center justify-center space-x-2 rounded-md bg-orange-600 px-4 py-2 text-white transition-colors hover:bg-orange-700"
                    >
                      <ChefHat className="h-4 w-4" />
                      <span>Mark as Cooking</span>
                    </button>
                  )}

                {/* Kitchen staff button - COOKING to READY_TO_DELIVER */}
                {isKitchenStaff(user.role as UserRole) &&
                  (order.status as OrderStatus) === "COOKING" && (
                    <button
                      onClick={() =>
                        handleStatusChange(
                          order.id,
                          "READY_TO_DELIVER",
                          order.customerId
                        )
                      }
                      className="flex w-full items-center justify-center space-x-2 rounded-md bg-orange-600 px-4 py-2 text-white transition-colors hover:bg-orange-700"
                    >
                      <ChefHat className="h-4 w-4" />
                      <span>Mark as Ready to Deliver</span>
                    </button>
                  )}

                {/* Waiter delivery button - READY_TO_DELIVER to COMPLETED */}
                {user.role === "WAITER" &&
                  order.status === "READY_TO_DELIVER" && (
                    <button
                      onClick={() =>
                        handleStatusChange(
                          order.id,
                          "COMPLETED",
                          order.customerId
                        )
                      }
                      className="flex w-full items-center justify-center space-x-2 rounded-md bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
                    >
                      <Coffee className="h-4 w-4" />
                      <span>Confirm Delivery</span>
                    </button>
                  )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
