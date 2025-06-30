import {
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
  redirect,
  data,
} from "@remix-run/node";
import { custAuth } from "~/services/auth.server";
import { userBasket } from "~/services/cookies.server";

// This action function handles updates to the user's basket.
// It authenticates the user, processes form data, and updates the basket cookie.
export const action = async ({ request }: ActionFunctionArgs) => {
  // Authenticate the user, redirecting to login if not authenticated.
  const user = await custAuth.isAuthenticated(request, {
    failureRedirect: "/login",
  });

  // Parse the form data from the request.
  const formData = await request.formData();
  const type = formData.get("type");
  const basketUpdates = formData.get("basketUpdates") as string;

  // Parse the basket updates from the form data.
  const newBasket = basketUpdates ? JSON.parse(basketUpdates) : null;

  // Parse the existing basket from the cookies, or initialize an empty object.
  let cookie = (await userBasket.parse(request.headers.get("Cookie"))) || {};

  // If no new basket updates are provided, return the current basket.
  if (!newBasket) {
    return data({ basket: cookie });
  }

  // Update the basket with the new items or quantities.
  newBasket.forEach((update) => {
    const { menuItemId, quantity } = update;
    if (cookie[menuItemId]) {
      cookie[menuItemId] += quantity; // Increment quantity if item exists.
    } else {
      cookie[menuItemId] = quantity; // Add new item to the basket.
    }
  });

  // Return the updated basket and set the updated cookie in the response headers.
  return data(
    { basket: cookie },
    {
      headers: { "Set-Cookie": await userBasket.serialize(cookie) },
    }
  );
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return redirect("/menu/basket");
};
