"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { FaHome, FaHistory, FaShoppingCart, FaChartLine } from "react-icons/fa";

interface CreditNavigationProps {
  className?: string;
}

export default function CreditNavigation({
  className = "",
}: CreditNavigationProps) {
  const pathname = usePathname();

  const navItems = [
    {
      name: "Dashboard",
      href: "/credits/dashboard",
      icon: <FaHome className="mr-2" />,
      active: pathname === "/credits/dashboard",
    },
    {
      name: "Purchase",
      href: "/credits",
      icon: <FaShoppingCart className="mr-2" />,
      active: pathname === "/credits",
    },
    {
      name: "History",
      href: "/credits/history",
      icon: <FaHistory className="mr-2" />,
      active: pathname === "/credits/history",
    },
    {
      name: "Usage Stats",
      href: "/credits/usage",
      icon: <FaChartLine className="mr-2" />,
      active: pathname === "/credits/usage",
    },
  ];

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}
    >
      <nav className="flex flex-col sm:flex-row">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center px-4 py-3 text-sm font-medium transition-colors ${
              item.active
                ? "text-blue-600 border-b-2 sm:border-b-0 sm:border-l-2 border-blue-600 bg-blue-50"
                : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
            }`}
          >
            {item.icon}
            {item.name}
          </Link>
        ))}
      </nav>
    </div>
  );
}
