import { isSession, redirect } from "@remix-run/server-runtime";
import { sessionStorage } from "./session.server";
import { Authenticator } from "remix-auth";

/**
 * A class that extends the `Authenticator` to provide role-based authentication.
 * It checks the user's role and handles redirection based on the provided options.
 */
export class RoleAuthenticator<a> extends Authenticator {
  async isAuthenticated(request: Request, options?: any) {
    var _a;
    let session = isSession(request)
      ? request
      : await sessionStorage.getSession(request.headers.get("Cookie"));
    let user =
      (_a = session.get(this.sessionKey)) !== null && _a !== void 0 ? _a : null;
    if (user) {
      if (options?.notAllowedRole && user.role === options.notAllowedRole) {
        if (options.failureRedirect) {
          throw redirect(options.failureRedirect, {
            headers: options.headers,
          });
        } else return null;
      }
      if (options?.role && user.role !== options.role) {
        if (options.failureRedirect) {
          throw redirect(options.failureRedirect, {
            headers: options.headers,
          });
        } else return null;
      }
      if (options?.successRedirect) {
        throw redirect(options.successRedirect, {
          headers: options.headers,
        });
      } else return user;
    }
    if (options?.failureRedirect) {
      throw redirect(options.failureRedirect, {
        headers: options.headers,
      });
    } else return null;
  }
}
