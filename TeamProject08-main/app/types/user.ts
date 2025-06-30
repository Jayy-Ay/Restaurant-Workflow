// Represents a staff in the system.
export type Staff = {
  id: number;
  username: string;
  name: string;
  role: string;
};

// Represents a customer in the system.
export type Customer = {
  id: number;
  name: string;
  allergies: string[];
  role: string;
};
