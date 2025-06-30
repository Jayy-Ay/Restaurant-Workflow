import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { Home, Menu, Info, Phone, ChefHat, Clock } from "lucide-react";

export const meta: MetaFunction = () => {
  return [
    { title: "Restaurant | Home" },
    { name: "description", content: "Welcome to our restaurant" },
  ];
};

export default function Index() {
  return (
    <div className="font-inter min-h-screen bg-gray-50">
      {/* Header with Navigation */}
      <header className="border-b bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center space-x-2">
            <Link to="/" className="rounded-full p-2 hover:bg-gray-100">
              <Home className="h-5 w-5 text-gray-600" />
            </Link>
            <h1 className="text-xl font-bold text-gray-800">Oaxaca</h1>
          </div>
          <nav className="hidden md:block">
            <div className="flex space-x-4">
              <Link
                to="/"
                className="flex items-center space-x-1 text-gray-600 transition-colors hover:text-blue-600"
              >
                <Home className="h-4 w-4" />
                <span className="text-sm">Home</span>
              </Link>
              <Link
                to="/login"
                className="flex items-center space-x-1 text-gray-600 transition-colors hover:text-blue-600"
              >
                <Menu className="h-4 w-4" />
                <span className="text-sm">Menu</span>
              </Link>
              <Link
                to="#about"
                className="flex items-center space-x-1 text-gray-600 transition-colors hover:text-blue-600"
              >
                <Info className="h-4 w-4" />
                <span className="text-sm">About</span>
              </Link>
              <Link
                to="#contact"
                className="flex items-center space-x-1 text-gray-600 transition-colors hover:text-blue-600"
              >
                <Phone className="h-4 w-4" />
                <span className="text-sm">Contact</span>
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div className="space-y-6">
            <h2 className="text-4xl font-bold text-gray-800">
              Delicious Meals,
              <br />
              Crafted with Care
            </h2>
            <p className="max-w-md text-gray-600">
              Experience a culinary journey at Oaxaca. Fresh ingredients,
              innovative recipes, and a passion for great food await you.
            </p>
            <div className="flex space-x-4">
              <Link
                to="/login"
                className="flex items-center space-x-2 rounded-md bg-blue-600 
                px-6 py-2 text-white transition-colors hover:bg-blue-700"
              >
                <Menu className="h-4 w-4" />
                <span>View Menu</span>
              </Link>
              <Link
                to="/login"
                className="flex items-center space-x-2 rounded-md border border-blue-600 
                px-6 py-2 text-blue-600 transition-colors hover:bg-blue-50"
              >
                <ChefHat className="h-4 w-4" />
                <span>Order Now</span>
              </Link>
            </div>
          </div>
          <div className="hidden overflow-hidden rounded-lg shadow-md md:block">
            <img
              src="/images/team08-restaurant.jpg"
              alt="Restaurant Interior"
              className="h-96 w-full object-cover"
            />
          </div>
        </div>
      </main>

      {/* About Section */}
      <section id="about" className="bg-white py-16">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-6 md:grid-cols-2">
          <div className="hidden overflow-hidden rounded-lg shadow-md md:block">
            <img
              src="/images/team08-restaurant1.jpg"
              alt="Our Kitchen"
              className="h-96 w-full object-cover"
            />
          </div>
          <div className="space-y-6">
            <h3 className="text-3xl font-bold text-gray-800">
              About Our Restaurant
            </h3>
            <p className="text-gray-600">
              At Team08 Restaurant, we believe in creating memorable dining
              experiences. Our chefs are passionate about using fresh, locally
              sourced ingredients to craft delightful dishes that tell a story.
            </p>
            <div className="space-y-2">
              <p className="flex items-center space-x-2 text-gray-700">
                <ChefHat className="h-5 w-5 text-blue-600" />
                <span>Handcrafted Meals</span>
              </p>
              <p className="flex items-center space-x-2 text-gray-700">
                <Clock className="h-5 w-5 text-blue-600" />
                <span>Open Monday to Sunday, 9AM - 10PM</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-6">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <p className="text-sm text-gray-600">
            © {new Date().getFullYear()} Team08 Restaurant. All rights reserved.
          </p>
          <div className="mt-2 flex justify-center space-x-4 text-sm text-gray-500">
            <span>123 Street Name, City, Country</span>
            <span>|</span>
            <span>Phone: (123) 456-7890</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
