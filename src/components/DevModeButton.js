import { Button } from "@/components/ui/button";

export default function DevModeButton({ onClick, visible }) {
  if (!visible) return null;
  return (
    <div className="fixed left-4 bottom-4 z-50 animate-fadeIn">
      <Button
        className="bg-gradient-to-r from-blue-700 to-purple-700 text-white px-5 py-2 rounded-xl shadow-lg hover:scale-105 hover:from-blue-600 hover:to-purple-600 transition-transform duration-300"
        onClick={onClick}
      >
        Dev Mode
      </Button>
    </div>
  );
}
