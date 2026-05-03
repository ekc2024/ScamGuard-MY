import { BriefIntakeForm } from "@/components/brief-intake-form";

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-4rem)] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-3xl font-bold text-[#1A1F36] tracking-tight">
            Create New Brief
          </h1>
          <p className="text-[#1A1F36]/60 mt-3">
            Submit your video brief to get an AI-generated script
          </p>
        </header>

        <BriefIntakeForm />
      </div>
    </div>
  );
}
