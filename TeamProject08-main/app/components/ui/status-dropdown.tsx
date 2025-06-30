import * as React from "react";
import { useSubmit } from "@remix-run/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

type OrderStatus =
  | "PENDING"
  | "READY_TO_COOK"
  | "COOKING"
  | "READY_TO_DELIVER"
  | "COMPLETED"
  | "CANCELLED"
  | "UNAVAILABLE";

type UserRole =
  | "WAITER"
  | "HEAD_CHEF"
  | "SOUS_CHEF"
  | "DISH_WASHER"
  | "PORTER"
  | "GRILL_CHEF"
  | "ADMIN"
  | "CUSTOMER";

interface StatusSelectPillProps {
  currentStatus: OrderStatus;
  orderId: number;
  customerId: number;
  userRole: UserRole;
  statusColors: Record<OrderStatus, string>;
  statusNames: Record<OrderStatus, string>;
}

export const StatusSelectPill: React.FC<StatusSelectPillProps> = ({
  currentStatus,
  orderId,
  customerId,
  userRole,
  statusColors,
  statusNames,
}) => {
  const [value, setValue] = React.useState(currentStatus);
  const submit = useSubmit();
  const availableStatuses = [
    "PENDING",
    "READY_TO_COOK",
    "COOKING",
    "READY_TO_DELIVER",
    "COMPLETED",
    "CANCELLED",
  ];

  // Extract background color class from statusColors
  const getBgClass = (status: OrderStatus) => {
    const classes = statusColors[status].split(" ");
    return classes.find((cls) => cls.startsWith("bg-")) || "";
  };

  const handleStatusChange = (newStatus: OrderStatus) => {
    if (newStatus === currentStatus) return;

    const formData = new FormData();
    formData.append("orderId", orderId.toString());
    formData.append("action", newStatus);
    formData.append("customerId", customerId.toString());
    submit(formData, { method: "post" });
    setValue(newStatus);
  };

  // If user can't change status, just show a pill
  // if (!canChangeStatus) {
  //   return (
  //     <span
  //       className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[currentStatus]}`}
  //     >
  //       {statusNames[currentStatus]}
  //     </span>
  //   );
  // }

  React.useEffect(() => {
    setValue(currentStatus);
  }, [currentStatus]);

  return (
    <Select
      // defaultValue={currentStatus}
      value={value}
      onValueChange={(value) => handleStatusChange(value as OrderStatus)}
    >
      <SelectTrigger
        className={`h-6 w-fit border-none px-3 py-1 text-xs font-medium shadow-none ${statusColors[currentStatus]} rounded-full focus:ring-transparent focus:ring-offset-0`}
      >
        <SelectValue placeholder={statusNames[currentStatus]} />
      </SelectTrigger>
      <SelectContent align="end" className="w-fit bg-white">
        {availableStatuses.map((status) => (
          <SelectItem
            key={status}
            value={status}
            className="cursor-pointer py-1.5 text-xs hover:bg-gray-100"
          >
            <div className="flex items-center">
              {/* <span
                className={`mr-2 h-2 w-2 rounded-full ${getBgClass(status)}`}
              ></span> */}
              {statusNames[status]}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
