export default function Footer() {
  return (
    <footer className="mt-auto bg-gray-100 px-6 py-6">
      <div>
        <p className="text-sm text-gray-600">
          © {new Date().getFullYear()} Team 08 Restaurant. All rights reserved.
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Royal Holloway, University of London Egham Hill Egham Surrey TW20 0EX | Phone: (123) 456-7890
        </p>
      </div>
    </footer>
  );
}
