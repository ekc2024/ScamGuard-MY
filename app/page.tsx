import { BriefIntakeForm } from "@/components/brief-intake-form";

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-4rem)] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <BriefIntakeForm />
      </div>
    </div>
  );
}
