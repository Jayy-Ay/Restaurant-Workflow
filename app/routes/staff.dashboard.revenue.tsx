import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { staffAuth } from "~/services/auth.server";
import { prisma } from "~/services/database.server";
import {
  ArrowRight,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Calendar,
  Clock,
  Users,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  ChefHat,
  UserCheck,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  CartesianGrid,
  Line,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart";

export const action = async ({ request }: ActionFunctionArgs) => {
  return null;
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await staffAuth.isAuthenticated(request, {
    failureRedirect: "/staff/login",
    notAllowedRole: "customer",
  });

  // Basic revenue metrics
  const totalRevenue = await prisma.order.aggregate({
    _sum: { totalPrice: true },
  });

  const totalOrders = await prisma.order.count();
  const avgOrderValue =
    totalOrders > 0 ? (totalRevenue._sum.totalPrice || 0) / totalOrders : 0;

  // Order status distribution
  const orderStatusCounts = await prisma.order.groupBy({
    by: ["status"],
    _count: { id: true },
  });

  // Revenue by time period
  const dailyRevenue = await prisma.order.groupBy({
    by: ["createdAt"],
    _sum: { totalPrice: true },
    orderBy: { createdAt: "asc" },
  });

  // New: Revenue by hour of day for peak hours analysis
  const hourlyOrders = await prisma.order.groupBy({
    by: ["createdAt"],
    _count: { id: true },
    orderBy: { createdAt: "asc" },
  });

  // New: Popular menu items
  const popularItems = await prisma.orderItem.groupBy({
    by: ["menuItemId"],
    _count: { id: true },
    orderBy: {
      _count: {
        id: "desc",
      },
    },
    take: 5,
  });

  // Get the menu item details for the popular items
  const popularItemDetails = await Promise.all(
    popularItems.map(async (item) => {
      const menuItem = await prisma.menuItem.findUnique({
        where: { id: item.menuItemId },
      });
      return {
        ...menuItem,
        count: item._count.id,
      };
    })
  );

  // Process daily revenue to sum up by date only (ignoring time)
  const revenueByDate: Record<string, number> = {};
  dailyRevenue.forEach((order) => {
    const date = new Date(order.createdAt).toLocaleDateString();
    revenueByDate[date] =
      (revenueByDate[date] || 0) + (order._sum.totalPrice || 0);
  });

  const revenueTrendData = Object.keys(revenueByDate).map((date) => ({
    date,
    revenue: revenueByDate[date],
  }));

  // Process hourly data for peak hours analysis
  const ordersByHour: Record<number, number> = {};
  hourlyOrders.forEach((order) => {
    const hour = new Date(order.createdAt).getHours();
    ordersByHour[hour] = (ordersByHour[hour] || 0) + order._count.id;
  });

  const hourlyOrderData = Array.from({ length: 24 }, (_, hour) => ({
    hour: `${hour}:00`,
    orders: ordersByHour[hour] || 0,
  }));

  // Calculate month-over-month growth
  const currentMonthRevenue = Object.values(revenueByDate).reduce(
    (sum, value) => sum + value,
    0
  );
  const previousMonthRevenue = currentMonthRevenue * 0.85; // Placeholder - replace with actual calculation
  const growthRate =
    ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100;

  // NEW: Revenue by category
  const categoryRevenue = await prisma.orderItem.groupBy({
    by: ["menuItemId"],
    _sum: { price: true },
  });

  // Get menu item details including categories
  const categoryData: Record<string, number> = {
    STARTER: 0,
    MAIN: 0,
    SIDE: 0,
    DESSERT: 0,
    DRINK: 0,
  };

  await Promise.all(
    categoryRevenue.map(async (item) => {
      const menuItem = await prisma.menuItem.findUnique({
        where: { id: item.menuItemId },
        select: { category: true },
      });
      if (menuItem) {
        categoryData[menuItem.category] =
          (categoryData[menuItem.category] || 0) + (item._sum.price || 0);
      }
    })
  );

  // NEW: Staff performance data
  const staffData = await prisma.staff.findMany({
    include: {
      _count: {
        select: { orders: true },
      },
    },
    orderBy: {
      orders: {
        _count: "desc",
      },
    },
    take: 5,
  });

  // Get average order processing time per staff
  const staffPerformance = await Promise.all(
    staffData.map(async (staff) => {
      const orders = await prisma.order.findMany({
        where: {
          waiterId: staff.id,
          status: "COMPLETED",
        },
        select: {
          id: true,
          createdAt: true,
          completedAt: true,
          totalPrice: true,
        },
      });

      // Calculate average time to complete orders
      let totalTimeInMinutes = 0;
      let validOrderCount = 0;
      let totalSales = 0;
      let avgOrderValue = 0;
      let completionRate = 0;

      const totalAssignedOrders = await prisma.order.count({
        where: {
          waiterId: staff.id,
        },
      });

      orders.forEach((order) => {
        if (order.completedAt) {
          const timeToCompleteInMs =
            order.completedAt.getTime() - order.createdAt.getTime();
          totalTimeInMinutes += timeToCompleteInMs / (1000 * 60); // Convert ms to minutes
          validOrderCount++;
          totalSales += order.totalPrice;
        }
      });

      avgOrderValue = validOrderCount > 0 ? totalSales / validOrderCount : 0;
      completionRate =
        totalAssignedOrders > 0
          ? (validOrderCount / totalAssignedOrders) * 100
          : 0;


      // Calculate items sold per hour
      const totalItemsCount = await prisma.orderItem.count({
        where: {
          order: {
            waiterId: staff.id,
            status: "COMPLETED",
          },
        },
      });

      // Calculate hours worked (assuming 8 hour shifts per order day as a simple example)
      const orderDates = [
        ...new Set(
          orders.map((order) => new Date(order.createdAt).toDateString())
        ),
      ];
      const estimatedHoursWorked = orderDates.length * 8;

      const avgItemsPerHour =
        estimatedHoursWorked > 0 ? totalItemsCount / estimatedHoursWorked : 0;

      const avgProcessingTime =
        validOrderCount > 0 ? totalTimeInMinutes / validOrderCount : 0;

      return {
        id: staff.id,
        name: staff.name,
        role: staff.role,
        orderCount: staff._count.orders,
        completedOrderCount: validOrderCount,
        avgProcessingTime: Math.round(avgProcessingTime), // in minutes
        totalSales,
        avgOrderValue,
        completionRate: Math.round(completionRate),
        itemsSold: totalItemsCount,
        avgItemsPerHour: Math.round(avgItemsPerHour),
      };
    })
  );

  // Sort staff by total sales for the top performers
  const topPerformers = [...staffPerformance]
    .sort((a, b) => b.totalSales - a.totalSales)
    .slice(0, 5);

  return {
    user,
    totalRevenue: totalRevenue._sum.totalPrice || 0,
    totalOrders,
    avgOrderValue,
    orderStatusCounts,
    revenueTrendData,
    hourlyOrderData,
    popularItemDetails,
    growthRate,
    staffPerformance,
    topPerformers,
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
  PENDING: "#3B82F6", // blue-500
  READY_TO_COOK: "#F97316", // orange-500
  IN_PROGRESS: "#3B82F6", // blue-500
  READY_TO_DELIVER: "#9333EA", // purple-500
  COMPLETED: "#22C55E", // green-500
  CANCELLED: "#EF4444", // red-500
  UNAVAILABLE: "#6B7280", // gray-500
};

const statusTextColors: Record<OrderStatus, string> = {
  PENDING: "text-blue-500",
  READY_TO_COOK: "text-orange-500",
  IN_PROGRESS: "text-blue-500",
  READY_TO_DELIVER: "text-purple-500",
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

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(221.2 83.2% 53.3%)",
  },
  orders: {
    label: "Orders",
    color: "hsl(142.1 76.2% 36.3%)",
  },
} satisfies ChartConfig;

export default function Revenue() {
  const {
    totalRevenue,
    totalOrders,
    avgOrderValue,
    orderStatusCounts,
    revenueTrendData,
    hourlyOrderData,
    popularItemDetails,
    growthRate,
    staffPerformance,
    topPerformers,
  } = useLoaderData<typeof loader>();

  const pieChartData = orderStatusCounts.map((status) => ({
    name: statusNames[status.status as OrderStatus],
    value: status._count.id,
    color: statusColors[status.status as OrderStatus] || "#6B7280",
  }));

  return (
    <div>
      <div className="mx-auto min-h-screen max-w-7xl">
        {/* Header */}
        <h1 className="text-2xl font-bold">Restaurant Revenue Dashboard</h1>

        {/* Content */}
        <div className="mt-6">
          {/* Revenue Summary */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border bg-white p-4 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center space-x-3">
                <div className="rounded-full bg-blue-100 p-2">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Total Revenue
                  </p>
                  <h3 className="text-2xl font-bold text-gray-800">
                    £{totalRevenue.toFixed(2)}
                  </h3>
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <div
                  className={`flex items-center ${
                    growthRate >= 0 ? "text-green-500" : "text-red-500"
                  }`}
                >
                  <TrendingUp className="mr-1 h-4 w-4" />
                  <span className="text-sm font-medium">
                    {growthRate.toFixed(1)}%
                  </span>
                </div>
                <span className="ml-2 text-xs text-gray-500">
                  vs last month
                </span>
              </div>
            </div>

            <div className="rounded-lg border bg-white p-4 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center space-x-3">
                <div className="rounded-full bg-green-100 p-2">
                  <ShoppingBag className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Total Orders
                  </p>
                  <h3 className="text-2xl font-bold text-gray-800">
                    {totalOrders}
                  </h3>
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <div className="flex items-center text-green-500">
                  <TrendingUp className="mr-1 h-4 w-4" />
                  <span className="text-sm font-medium">12.3%</span>
                </div>
                <span className="ml-2 text-xs text-gray-500">
                  vs last month
                </span>
              </div>
            </div>

            <div className="rounded-lg border bg-white p-4 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center space-x-3">
                <div className="rounded-full bg-purple-100 p-2">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Avg Order Value
                  </p>
                  <h3 className="text-2xl font-bold text-gray-800">
                    £{avgOrderValue.toFixed(2)}
                  </h3>
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <div className="flex items-center text-green-500">
                  <TrendingUp className="mr-1 h-4 w-4" />
                  <span className="text-sm font-medium">5.8%</span>
                </div>
                <span className="ml-2 text-xs text-gray-500">
                  vs last month
                </span>
              </div>
            </div>

            <div className="rounded-lg border bg-white p-4 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center space-x-3">
                <div className="rounded-full bg-orange-100 p-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Avg Prep Time
                  </p>
                  <h3 className="text-2xl font-bold text-gray-800">22 min</h3>
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <div className="flex items-center text-red-500">
                  <TrendingUp className="mr-1 h-4 w-4 rotate-180" />
                  <span className="text-sm font-medium">3.2%</span>
                </div>
                <span className="ml-2 text-xs text-gray-500">
                  vs last month
                </span>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Revenue Trend Graph */}
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">
                  Revenue Trend
                </h3>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    <div className="mr-2 h-3 w-3 rounded-full bg-blue-500"></div>
                    <span className="text-xs text-gray-500">Revenue</span>
                  </div>
                </div>
              </div>
              <ChartContainer config={chartConfig} className="h-64">
                <LineChart data={revenueTrendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value.slice(0, 5)}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => `£${value}`}
                  />
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Line
                    dataKey="revenue"
                    type="monotone"
                    stroke="var(--color-revenue)"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ChartContainer>
            </div>

            {/* Peak Hours Chart */}
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">
                  Peak Order Hours
                </h3>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    <div className="mr-2 h-3 w-3 rounded-full bg-green-500"></div>
                    <span className="text-xs text-gray-500">Orders</span>
                  </div>
                </div>
              </div>
              <ChartContainer config={chartConfig} className="h-64">
                <BarChart data={hourlyOrderData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="hour"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value.split(":")[0]}
                  />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="orders"
                    fill="var(--color-orders)"
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ChartContainer>
            </div>
          </div>

          {/* Order Status and Popular Items */}
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Order Status */}
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-800">
                Order Status Distribution
              </h3>
              <div className="mb-4 grid grid-cols-2 gap-4">
                {pieChartData.map((status) => (
                  <div
                    key={status.name}
                    className="rounded-lg border p-3 transition-shadow hover:shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-700">
                        {status.name}
                      </h4>
                      <span
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full"
                        style={{
                          backgroundColor: `${status.color}20`,
                          color: status.color,
                        }}
                      >
                        <PieChartIcon className="h-3 w-3" />
                      </span>
                    </div>
                    <p
                      className="mt-1 text-xl font-bold"
                      style={{ color: status.color }}
                    >
                      {status.value}
                    </p>
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={40}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Popular Menu Items */}
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-800">
                Most Popular Items
              </h3>
              <div className="space-y-3">
                {popularItemDetails.map((item, index) => (
                  <div
                    key={item?.id || index}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                        <span className="text-sm font-bold">{index + 1}</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">
                          {item?.name || "Unknown"}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {item?.count || 0} orders
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="font-bold text-blue-600">
                        £{item?.price?.toFixed(2) || "0.00"}
                      </span>
                      <ArrowRight className="ml-2 h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                ))}

                <button className="mt-2 w-full rounded-md border border-blue-500 py-2 text-center text-sm font-medium text-blue-500 hover:bg-blue-50">
                  View All Menu Items
                </button>
              </div>
            </div>
          </div>

          {/* NEW: Cost vs Revenue Analysis */}
          <div className="mt-6">
            <h2 className="mb-4 text-xl font-bold text-gray-800">
              Profitability Analysis
            </h2>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Food Cost Analysis */}
              <div className="rounded-lg border bg-white p-4 shadow-sm">
                <h3 className="mb-4 text-lg font-semibold text-gray-800">
                  Food Cost Analysis
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-600">
                        Total Revenue
                      </span>
                      <p className="text-xl font-bold text-gray-800">
                        £{totalRevenue.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">
                        Food Cost
                      </span>
                      <p className="text-xl font-bold text-red-600">
                        £{(totalRevenue * 0.32).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">
                        Gross Profit
                      </span>
                      <p className="text-xl font-bold text-green-600">
                        £{(totalRevenue * 0.68).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="flex h-4 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-4 bg-red-500"
                      style={{ width: "32%" }}
                    ></div>
                    <div
                      className="h-4 bg-green-500"
                      style={{ width: "68%" }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-red-600">Food Cost: 32%</span>
                    <span className="text-green-600">Gross Profit: 68%</span>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="text-md mb-2 font-medium text-gray-800">
                      Cost by Category
                    </h4>
                    <ul className="space-y-2">
                      <li className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Main Course
                        </span>
                        <div className="flex items-center">
                          <span className="mr-2 text-sm font-medium">31%</span>
                          <div className="h-2 w-24 rounded-full bg-gray-100">
                            <div
                              className="h-2 rounded-full bg-blue-500"
                              style={{ width: "31%" }}
                            ></div>
                          </div>
                        </div>
                      </li>
                      <li className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Starters</span>
                        <div className="flex items-center">
                          <span className="mr-2 text-sm font-medium">28%</span>
                          <div className="h-2 w-24 rounded-full bg-gray-100">
                            <div
                              className="h-2 rounded-full bg-orange-500"
                              style={{ width: "28%" }}
                            ></div>
                          </div>
                        </div>
                      </li>
                      <li className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Desserts</span>
                        <div className="flex items-center">
                          <span className="mr-2 text-sm font-medium">22%</span>
                          <div className="h-2 w-24 rounded-full bg-gray-100">
                            <div
                              className="h-2 rounded-full bg-purple-500"
                              style={{ width: "22%" }}
                            ></div>
                          </div>
                        </div>
                      </li>
                      <li className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Drinks</span>
                        <div className="flex items-center">
                          <span className="mr-2 text-sm font-medium">18%</span>
                          <div className="h-2 w-24 rounded-full bg-gray-100">
                            <div
                              className="h-2 rounded-full bg-green-500"
                              style={{ width: "18%" }}
                            ></div>
                          </div>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Most Profitable Items */}
              <div className="rounded-lg border bg-white p-4 shadow-sm">
                <h3 className="mb-4 text-lg font-semibold text-gray-800">
                  Most Profitable Menu Items
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700">
                        <span className="text-sm font-bold">1</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">
                          Grilled Sea Bass
                        </h4>
                        <div className="flex items-center">
                          <span className="mr-2 text-xs text-gray-500">
                            Cost: £4.50
                          </span>
                          <span className="text-xs text-gray-500">
                            Price: £18.95
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block text-xs text-gray-500">
                        Profit Margin
                      </span>
                      <span className="text-md font-bold text-green-600">
                        76%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700">
                        <span className="text-sm font-bold">2</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">
                          House Red Wine (Bottle)
                        </h4>
                        <div className="flex items-center">
                          <span className="mr-2 text-xs text-gray-500">
                            Cost: £5.75
                          </span>
                          <span className="text-xs text-gray-500">
                            Price: £22.50
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block text-xs text-gray-500">
                        Profit Margin
                      </span>
                      <span className="text-md font-bold text-green-600">
                        74%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700">
                        <span className="text-sm font-bold">3</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">Tiramisu</h4>
                        <div className="flex items-center">
                          <span className="mr-2 text-xs text-gray-500">
                            Cost: £1.80
                          </span>
                          <span className="text-xs text-gray-500">
                            Price: £6.95
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block text-xs text-gray-500">
                        Profit Margin
                      </span>
                      <span className="text-md font-bold text-green-600">
                        74%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700">
                        <span className="text-sm font-bold">4</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">
                          Cocktails (Average)
                        </h4>
                        <div className="flex items-center">
                          <span className="mr-2 text-xs text-gray-500">
                            Cost: £2.25
                          </span>
                          <span className="text-xs text-gray-500">
                            Price: £8.50
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block text-xs text-gray-500">
                        Profit Margin
                      </span>
                      <span className="text-md font-bold text-green-600">
                        73%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700">
                        <span className="text-sm font-bold">5</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">
                          Garlic Bread
                        </h4>
                        <div className="flex items-center">
                          <span className="mr-2 text-xs text-gray-500">
                            Cost: £0.85
                          </span>
                          <span className="text-xs text-gray-500">
                            Price: £3.25
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block text-xs text-gray-500">
                        Profit Margin
                      </span>
                      <span className="text-md font-bold text-green-600">
                        73%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Average Profit Margin
                    </span>
                    <span className="text-lg font-bold text-green-600">
                      68%
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {/* NEW: Employee Performance Section */}
            <div className="mt-6">
              <h2 className="mb-4 text-xl font-bold text-gray-800">
                Employee Performance
              </h2>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Staff Sales Performance Metrics */}
                <div className="rounded-lg border bg-white p-4 shadow-sm">
                  <h3 className="mb-4 text-lg font-semibold text-gray-800">
                    Staff Sales Performance
                  </h3>
                  <div className="space-y-4">
                    {topPerformers.map((staff) => (
                      <div
                        key={staff.id}
                        className="rounded-lg border p-3 hover:bg-gray-50"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                              <span className="text-sm font-bold">
                                {staff.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-800">
                                {staff.name}
                              </h4>
                              <p className="text-xs text-gray-500">
                                {staff.role.replace("_", " ")}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-medium text-gray-600">
                              Total Sales
                            </span>
                            <p className="text-lg font-bold text-green-600">
                              £{staff.totalSales.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-3 gap-2">
                          <div className="rounded border bg-gray-50 p-2 text-center">
                            <span className="text-xs text-gray-500">
                              Avg Order
                            </span>
                            <p className="text-sm font-bold text-gray-800">
                              £{staff.avgOrderValue.toFixed(2)}
                            </p>
                          </div>
                          <div className="rounded border bg-gray-50 p-2 text-center">
                            <span className="text-xs text-gray-500">
                              Items/Hour
                            </span>
                            <p className="text-sm font-bold text-gray-800">
                              {staff.avgItemsPerHour}
                            </p>
                          </div>
                          <div className="rounded border bg-gray-50 p-2 text-center">
                            <span className="text-xs text-gray-500">
                              Completion
                            </span>
                            <p className="text-sm font-bold text-gray-800">
                              {staff.completionRate}%
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
