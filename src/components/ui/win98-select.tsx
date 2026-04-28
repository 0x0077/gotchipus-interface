"use client";

import React, { useState, useRef, useEffect } from "react";

interface Win98SelectOption {
  value: string;
  label: string;
}

interface Win98SelectProps {
  options: Win98SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  size?: "sm" | "md";
}

const SIZE_CLASSES = {
  sm: { button: "text-xs py-1", item: "text-xs py-1" },
  md: { button: "text-sm py-1.5", item: "text-sm py-1.5" },
};

export const Win98Select: React.FC<Win98SelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select...",
  className = "",
  size = "sm",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const sz = SIZE_CLASSES[size];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-white border-2 border-[#808080] shadow-win98-inner px-2 ${sz.button} text-left flex items-center justify-between`}
      >
        <span className={selectedOption ? "text-black" : "text-[#808080]"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="text-[#808080] ml-2">▼</span>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border-2 border-[#808080] shadow-win98-outer max-h-60 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={`w-full px-2 ${sz.item} text-left hover:bg-[#000080] hover:text-white ${
                option.value === value ? "bg-[#000080] text-white" : "text-black"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
