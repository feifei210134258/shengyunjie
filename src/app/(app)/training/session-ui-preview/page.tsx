import TrainingSessionClient from "@/components/training/TrainingSessionClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default function TrainingSessionUiPreviewPage() {
  return <TrainingSessionClient />;
}
