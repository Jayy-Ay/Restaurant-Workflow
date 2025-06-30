import { sessionStorage } from "~/services/session.server";
import { AuthStrategies } from "~/services/auth-strategies";

import { customerFormStrategy } from "./customer-form.strategy.server";
import { RoleAuthenticator } from "./RoleAuthenticator.server";
import { staffFormStrategy } from "./staff-form.strategy.server";

export type AuthStrategy = (typeof AuthStrategies)[keyof typeof AuthStrategies];

// Create an instance of the authenticator, pass a generic with what
// strategies will return and will store in the session
export const custAuth = new RoleAuthenticator(sessionStorage);
export const staffAuth = new RoleAuthenticator(sessionStorage);

// Register your strategies below
custAuth.use(customerFormStrategy, AuthStrategies.CUSTOMER);
staffAuth.use(staffFormStrategy, AuthStrategies.STAFF);
