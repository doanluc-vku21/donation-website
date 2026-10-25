"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { captureMetaAttribution } from "@/lib/meta/client";

export function MetaAttribution() {
  const pathname = usePathname();
  useEffect(() => {
    captureMetaAttribution();
  }, [pathname]);
  return null;
}
