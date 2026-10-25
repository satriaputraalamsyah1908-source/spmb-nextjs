"use client";

import Image from "next/image";
import { useState } from "react";

type Props = {
  id: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  autoComplete?: string;
  invalid?: boolean;
};

export default function PasswordInput({ id, value, onChange, onBlur, autoComplete, invalid }: Props) {
  const [show, setShow] = useState(false);

  return (
    <div className={`field-wrap ${invalid ? "invalid" : ""}`}>
      <input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        className="eye-btn"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
      >
        <Image src={show ? "/icons/eye-off.svg" : "/icons/eye.svg"} alt="" width={28} height={28} unoptimized />
      </button>
    </div>
  );
}
