import { redirect } from "@remix-run/node";
import { prisma } from "./database.server";
import { emitter } from "./emitter.server";
import stripe from "stripe";
import "dotenv/config";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Initiates the order process by creating a Stripe checkout session for the given order.
 *
 * - This function retrieves the order details from the database, including associated menu items.
 * - It filters out items without a Stripe ID and maps them into a format suitable for Stripe's API.
 * - If the order is not found, the user is redirected to the basket page.
 * - If the Stripe session is successfully created, the user is redirected to the session URL.
 * - In case of any errors during the process, the user is redirected to the basket page.
 */
export async function startOrder({ orderId }: { orderId: string }) {
  const stripeAPI = new stripe(process.env.STRIPE_SECRET_KEY!);

  let order = await prisma.order.findUnique({
    where: { id: Number(orderId) },
    include: { orderItems: { include: { menuItem: true } } },
  });

  if (!order) return redirect("/menu/basket");

  const stripeBasket = order.orderItems
    .filter((item) => item.menuItem.stripeId !== null)
    .map((item) => ({
      price: item.menuItem.stripeId!,
      quantity: item.quantity,
    }));

  try {
    const session = await stripeAPI.checkout.sessions.create({
      line_items: stripeBasket,
      payment_method_types: ["card"],
      mode: "payment",
      success_url: `http://localhost:${
        isProduction ? "3000" : "5173"
      }/order/${orderId}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:${
        isProduction ? "3000" : "5173"
      }/order/${orderId}`,
    });

    if (!session || !session.url) {
      throw new Error("Failed to create Stripe session");
    }

    return redirect(session?.url);
  } catch (error) {
    console.error(error);
    return redirect("/menu/basket");
  }
}

export async function getCheckoutSession(sessionId: string) {
  const stripeAPI = new stripe(process.env.STRIPE_SECRET_KEY!);

  const session = await stripeAPI.checkout.sessions.retrieve(sessionId);
  return session;
}

export async function createOrder({
  user,
  basket,
}: {
  user: any;
  basket: any;
}) {
  const menuItems = await prisma.menuItem.findMany();

  const detailedBasket = menuItems
    .filter((menuItem: any) => basket[menuItem.id])
    .map((menuItem: any) => {
      const quantity = basket[menuItem.id];
      return {
        price: parseFloat((menuItem.price * quantity).toFixed(2)),
        quantity: quantity,
        note: "",
        reason: "",
        menuItem: { connect: { id: menuItem.id } },
      };
    });

  let createdData = await prisma.order.create({
    data: {
      customerId: user.id,
      waiterId: 1,
      tableId: user.tableId,
      orderItems: {
        create: detailedBasket,
      },
      paid: false,
      totalPrice: parseFloat(
        detailedBasket.reduce((total, item) => total + item.price, 0).toFixed(2)
      ),
    },
  });

  emitter.emit("dashboard:orders");

  return createdData;
}
