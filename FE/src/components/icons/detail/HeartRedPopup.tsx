import React from "react";

const HeartRedPopup = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="#f43f5e" // Lấp đầy trái tim bằng màu đỏ
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="#f43f5e" // Đặt viền cùng màu đỏ
      className="h-10 w-10 transition-all duration-300 ease-in-out border border-[#f43f5e] p-2 rounded-full"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
      />
    </svg>
  );
};

export default HeartRedPopup;
