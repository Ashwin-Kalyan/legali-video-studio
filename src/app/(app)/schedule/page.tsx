import { ScheduleScreen } from "./_components/ScheduleScreen";

export const metadata = {
  title: "Schedule · Legali Video Studio",
};

export default function SchedulePage() {
  return (
    <div className="mx-auto max-w-[1240px] px-6 py-7 md:px-8">
      <ScheduleScreen />
    </div>
  );
}
