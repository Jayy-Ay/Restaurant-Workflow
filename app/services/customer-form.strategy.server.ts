import { AuthorizationError } from "remix-auth";
import { FormStrategy } from "remix-auth-form";
import type { FormStrategyVerifyParams } from "remix-auth-form";
import { prisma } from "~/services/database.server";

export const customerFormStrategy = new FormStrategy(
  async ({ form }: FormStrategyVerifyParams) => {
    const name = form.get("name") as string;
    const table = form.get("table") as string;
    let allergies = form.getAll("allergies") as string[];
    let tableId = parseInt(table);

    if (!name || !table || isNaN(tableId))
      throw new AuthorizationError("name and table are required");

    // Add user to database
    try {
      const user = await prisma.customer.create({
        data: {
          name,
          allergies,
          tableId,
        },
      });

      return {
        id: user.id,
        name,
        allergies,
        tableId,
        role: "customer",
      };
    } catch (error) {
      console.error(error);
      throw new AuthorizationError("Error creating user");
    }
  }
);
