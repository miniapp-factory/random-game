"use client";
import Image from "next/image";

export default function Background() {
  return (
    <div className="fixed inset-0 -z-10">
      <Image src="/background.png" alt="Background scene" fill style={{ objectFit: "cover" }} />
    </div>
  );
}
