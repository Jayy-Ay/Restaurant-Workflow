import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { redirect, useLoaderData } from "@remix-run/react";
import { prisma } from "~/services/database.server";
import React from "react";

export const action = async ({ request }: ActionFunctionArgs) => {
  return null;
};

// Loader function to fetch order details based on the provided ID
export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  // Fetch the order details from the database, including related order items and waiter information
  let data = await prisma.order.findUnique({
    where: { id: Number(params.id) },
    include: {
      orderItems: {
        include: {
          menuItem: true, // Include menu item details for each order item
        },
      },
      waiter: true, // Include waiter details
    },
  });

  // Redirect to the orders dashboard if the order is not found
  if (!data) return redirect("/staff/dashboard/orders");

  // Return the fetched data
  return {
    data,
  };
};

type OrderStatus =
  | "PENDING"
  | "READY_TO_COOK"
  | "IN_PROGRESS"
  | "READY_TO_DELIVER"
  | "COMPLETED"
  | "CANCELLED"
  | "UNAVAILABLE";

const statusColors: Record<OrderStatus, string> = {
  PENDING: "text-blue-500",
  READY_TO_COOK: "text-orange-500",
  IN_PROGRESS: "text-blue-500",
  READY_TO_DELIVER: "text-blue-500",
  COMPLETED: "text-green-500",
  CANCELLED: "text-red-500",
  UNAVAILABLE: "text-gray-500",
};

const statusNames: Record<OrderStatus, string> = {
  PENDING: "Pending",
  READY_TO_COOK: "Ready to cook",
  IN_PROGRESS: "In progress",
  READY_TO_DELIVER: "Ready to deliver",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  UNAVAILABLE: "Unavailable",
};

export default function Index() {
  const { data } = useLoaderData<typeof loader>();

  return (
    <div>
      <h2 className="mb-4 text-2xl">Order #{data.id}</h2>
      <div className="grid grid-cols-[1.25fr_1fr] gap-20 rounded-md border border-separator bg-white p-9">
        <div className="grid h-full w-full grid-cols-[1fr_.75fr_.5fr] items-center justify-center gap-2 rounded-md bg-separator p-16">
          <span className="mb-6">Items</span>
          <span className="mb-6">Quantity</span>
          <span className="mb-6">Cost</span>
          {data.orderItems.map((item) => (
            <React.Fragment key={item.id}>
              <span>{item.menuItem.name}</span>
              <div>
                <span>{item.quantity}</span>
              </div>
              <span>£{item.price}</span>
            </React.Fragment>
          ))}
          <span className="col-span-3 mb-2 mt-12 h-[1px] w-full bg-black" />
          <span>Total Price</span>
          <span></span>
          <span>£{data.totalPrice}</span>
        </div>
        <div className="flex h-full flex-col justify-around">
          <div className="mb-8 grid grid-cols-2 gap-4">
            <span>Order Time:</span>
            <span>12:10</span>
            <span>Table Number:</span>
            <span>{data.tableId}</span>
            <span>Waiter:</span>
            <span>{data.waiter ? data.waiter.name : "Not set"}</span>
            <span>Status:</span>
            <span className={statusColors[data.status as OrderStatus]}>
              {statusNames[data.status as OrderStatus]}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
