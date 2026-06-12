import { redirect } from "next/navigation";

export default function DiagnosisPage() {
  redirect("/diagnosis/scale?entry=diagnosis");
}
