import { redirect } from "next/navigation";

/** Legacy /admin route — personal single-user app lives at /. */
export default function AdminRedirectPage() {
  redirect("/");
}
