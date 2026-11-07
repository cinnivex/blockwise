import { Placeholder } from "@/components/Placeholder";

export default function DashboardPage() {
  return (
    <Placeholder
      title="Timer"
      milestone="milestone 4 (Timer)"
      items={[
        "Pick a category and start a stopwatch in one click",
        "Countdown presets: 15, 25, 50 minutes, or custom",
        "Running timer survives a refresh (saved as an open time entry)",
        "Only one timer runs at a time",
      ]}
    />
  );
}
