import { FormStrategy, type FormStrategyVerifyParams } from "remix-auth-form";
import { prisma } from "~/services/database.server";
import { AuthorizationError } from "remix-auth";
import bcrypt from "bcryptjs";

/**
 * A strategy for handling staff form authentication.
 *
 * This strategy verifies the provided form credentials (username and password)
 * against the staff records in the database. If the credentials are valid, it
 * returns the staff's details; otherwise, it throws an appropriate error.
 *
 * An object containing the authenticated staff's details.
 */
export const staffFormStrategy = new FormStrategy(
  async ({ form }: FormStrategyVerifyParams) => {
    const formUsername = form.get("username") as string;
    const formPassword = form.get("password") as string;

    if (!formUsername) throw new AuthorizationError("username is required");
    if (!formPassword) throw new AuthorizationError("Password is required");

    let staff = prisma.staff.findUnique({
      where: { username: formUsername },
    });

    const [result] = await Promise.allSettled([staff]);

    if (result.status === "rejected") {
      throw new AuthorizationError("An error occurred accessing the database");
    }

    if (!result.value) throw new AuthorizationError("Invalid credentials");

    let { id, name, username, password, role } = result.value;

    const pwdCheck = await bcrypt.compare(formPassword, password);
    if (!pwdCheck) throw new AuthorizationError("Invalid credentials");

    return {
      id,
      username,
      name,
      role,
    };
  }
);
