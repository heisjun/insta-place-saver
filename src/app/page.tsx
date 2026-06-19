import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/map");
  }

  return (
    <main className="h-full overflow-y-auto bg-white">
      <Hero />
      <HowItWorks />
    </main>
  );
}
