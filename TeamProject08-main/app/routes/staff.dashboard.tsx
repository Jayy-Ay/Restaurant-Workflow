import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { Role } from "@prisma/client";
import {
  Link,
  Outlet,
  useLoaderData,
  useLocation,
  Form,
  useSubmit,
} from "@remix-run/react";
import {
  BadgePoundSterling,
  Bell,
  ConciergeBell,
  Database,
  LogOutIcon,
  SquareMenu,
  User2,
  Utensils,
  X,
  AlertTriangle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "~/components/ui/sidebar";
import { useEventStream } from "~/hooks/use-event-stream";
import { staffAuth } from "~/services/auth.server";
import { emitter } from "~/services/emitter.server";

// Handles form submissions for sending alerts to other staff members
export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const type = formData.get("type");
  const message = formData.get("message");

  // Emit a notification event for the kitchen staff
  if (type === "message") {
    emitter.emit("notifications:kitchen", JSON.stringify({ type, message }));
  }

  return true;
};

// Loader function to authenticate staff and determine their role type
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await staffAuth.isAuthenticated(request, {
    failureRedirect: "/staff/login",
    notAllowedRole: "customer",
  });

  // Determine the role type for event stream subscription
  const roleType = user.role === "WAITER" ? "waiter" : "kitchen";

  return {
    user,
    roleType,
  };
};

const items = [
  {
    title: "Orders",
    url: "/staff/dashboard/orders",
    icon: ConciergeBell,
  },
  {
    title: "Tables",
    url: "/staff/dashboard/tables",
    icon: Utensils,
  },
  {
    title: "Menu",
    url: "/staff/dashboard/menu",
    icon: SquareMenu,
  },
  {
    title: "Stock",
    url: "/staff/dashboard/stock",
    icon: Database,
  },
  {
    title: "Revenue",
    url: "/staff/dashboard/revenue",
    icon: BadgePoundSterling,
  },
  {
    title: "Send Notifications",
    url: "/staff/dashboard/send-notifications",
    icon: Bell, // You'll need to import Bell from 'lucide-react'
  },
];

const roleNames: Record<Role, string> = {
  HEAD_CHEF: "Head Chef",
  SOUS_CHEF: "Sous Chef",
  DISH_WASHER: "Dish Washer",
  PORTER: "Porter",
  GRILL_CHEF: "Grill Chef",
  WAITER: "Waiter",
  MANAGER: "Manager",
};

export default function Index() {
  const { user, roleType } = useLoaderData<typeof loader>();
  const [messages, setMessages] = useState<any[]>([]);
  const [alertedMessages, setAlertedMessages] = useState<Set<string>>(
    new Set()
  );
  const { pathname } = useLocation();
  const submit = useSubmit();

  const { data } = useEventStream(
    `/staff/dashboard/notifications?role=${roleType}`
  );

  useEffect(() => {
    if (data) {
      setMessages((prev) => [...prev, data]);
    }
  }, [data]);

  const dismissMessage = (id: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
  };

  const handleAlertSent = (message: any) => {
    setAlertedMessages((prev) => new Set(prev).add(message.id));

    let formData = new FormData();
    formData.append("type", message.type);
    formData.append("message", message.message);
    submit(formData, {
      method: "post",
    });
  };

  return (
    <SidebarProvider className="font-inter bg-[#F5F7FA]">
      <Sidebar>
        <SidebarHeader className="border-b">
          <h1 className="py-2 pl-2 text-xl font-medium text-black">Oaxaca</h1>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Pages</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => {
                  if (
                    user.role !== "MANAGER" &&
                    ["Revenue", "Stock"].includes(item.title)
                  )
                    return null;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={item.url === pathname}
                      >
                        <Link className="pl-6" to={item.url}>
                          <item.icon />
                          <span className="text-base">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>Logged in as</SidebarGroupLabel>
            <SidebarGroupContent className="rounded-lg border bg-white">
              <SidebarMenu className="select-none border-b p-4 hover:bg-slate-50">
                <div className="flex flex-row items-center gap-4">
                  <div className="w-fit rounded-lg bg-slate-200 p-2">
                    <User2 className="h-6 w-6" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-lg text-black">{user.name}</span>
                    <span className="text-sm capitalize">
                      {roleNames[user.role]}
                    </span>
                  </div>
                </div>
              </SidebarMenu>
              <Link
                className="flex w-full flex-row items-center justify-center rounded-b-lg text-red-500 transition-all hover:bg-red-100"
                to="/logout"
              >
                <Button variant="ghost">Log out</Button>
                <LogOutIcon className="h-4 w-4" />
              </Link>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>Messages</span>
                {messages.length > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs text-white">
                    {messages.length}
                  </span>
                )}
              </div>
              {messages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear all
                </button>
              )}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="scrollbar-none overflow-visible">
                {messages?.length > 0 ? (
                  messages.map((notification) => (
                    <div
                      key={notification.id}
                      className="mb-2 flex flex-col rounded-xl border border-amber-200 bg-amber-50 p-3 shadow hover:bg-amber-100"
                    >
                      <div className="mb-1 flex justify-between">
                        <span className="text-xs font-medium text-amber-700">
                          {new Date().toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <button
                          onClick={() => dismissMessage(notification.id)}
                          className="text-amber-700 hover:text-amber-900"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="my-1 text-sm font-medium text-amber-800">
                        {notification.message}
                      </p>
                      <div className="mt-2 flex justify-end gap-2">
                        {alertedMessages.has(notification.id) ? (
                          <span className="flex items-center gap-1 text-xs text-amber-700">
                            <Bell className="h-3 w-3" />
                            Alert sent
                          </span>
                        ) : (
                          <Form method="post">
                            <input
                              type="hidden"
                              name="messageId"
                              value={notification.id}
                            />
                            <button
                              type="submit"
                              onClick={() => handleAlertSent(notification)}
                              className="flex items-center gap-1 rounded-lg bg-amber-200 px-3 py-1 text-xs font-medium text-amber-800 hover:bg-amber-300"
                            >
                              <AlertTriangle className="h-3 w-3" />
                              Alert others
                            </button>
                          </Form>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-gray-400">
                    <Bell className="mb-2 h-8 w-8 opacity-50" />
                    <p className="text-sm">No new messages</p>
                  </div>
                )}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <main className="max-w-7xl p-8">
        <Outlet />
      </main>
    </SidebarProvider>
  );
}
