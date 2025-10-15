import { CheckCircle2 } from "lucide-react";

const AllCaughtUp = () => {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-card border border-border rounded-lg shadow-lg animate-fade-in-up">
      <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
      <h2 className="text-2xl font-bold text-foreground">All Caught Up!</h2>
      <p className="text-muted-foreground">No upcoming tasks. Great job staying organized!</p>
    </div>
  );
};

export default AllCaughtUp;