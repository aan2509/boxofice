"use client";

import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

export function PaymentSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      data-haptic="medium"
      className="mt-4 h-12 w-full bg-red-600 text-white hover:bg-red-500 disabled:opacity-80"
    >
      {pending ? (
        <>
          <LoaderCircle className="size-4 animate-spin" />
          Membuat pembayaran...
        </>
      ) : (
        "Lanjutkan pembayaran"
      )}
    </Button>
  );
}
