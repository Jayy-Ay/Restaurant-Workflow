// Interface representing the possible statuses for an order
export interface StatusProps {
  status:
    | "PENDING" // Order is pending
    | "READY_TO_COOK" // Order is ready to be cooked
    | "COOKING" // Order is currently being cooked
    | "READY_TO_DELIVER" // Order is ready to be delivered
    | "COMPLETED"; // Order has been completed
}
