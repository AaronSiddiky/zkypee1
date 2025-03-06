import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  PhoneIcon,
  ClockIcon,
  CreditCardIcon,
} from "@heroicons/react/24/outline";

export default function CallsNavigation() {
  const pathname = usePathname();

  const navItems = [
    {
      name: "Dialer",
      href: "/dial",
      icon: PhoneIcon,
      active: pathname === "/dial",
    },
    {
      name: "Call History",
      href: "/calls/history",
      icon: ClockIcon,
      active: pathname === "/calls/history",
    },
    {
      name: "Credits",
      href: "/credits",
      icon: CreditCardIcon,
      active: pathname === "/credits",
    },
  ];

  return (
    <div className="bg-white shadow-sm mb-6">
      <div className="max-w-4xl mx-auto">
        <nav className="flex">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 ${
                item.active
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <item.icon className="h-5 w-5 mr-2" />
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
