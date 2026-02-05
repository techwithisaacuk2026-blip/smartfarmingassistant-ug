import { Sprout, Leaf, Bug, Droplets, Sun } from "lucide-react";

interface WelcomeScreenProps {
  onExampleClick: (question: string) => void;
}

const exampleQuestions = [
  {
    icon: Leaf,
    question: "My maize leaves are yellow and drying at the edges",
    label: "Yellow leaves",
  },
  {
    icon: Bug,
    question: "I see small holes in my bean leaves",
    label: "Pest damage",
  },
  {
    icon: Droplets,
    question: "How often should I water my tomatoes?",
    label: "Watering tips",
  },
  {
    icon: Sun,
    question: "When is the best time to plant cassava in Uganda?",
    label: "Planting season",
  },
];

export function WelcomeScreen({ onExampleClick }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fade-in">
      <div className="w-20 h-20 rounded-full gradient-hero flex items-center justify-center mb-6 shadow-elevated">
        <Sprout className="w-10 h-10 text-primary-foreground" />
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
        Smart Farming Assistant
      </h1>
      <p className="text-muted-foreground mb-8 max-w-md">
        Hello! I'm here to help you grow healthy crops. Ask me about plant problems, 
        pests, watering, or upload a photo of your plants.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
        {exampleQuestions.map(({ icon: Icon, question, label }) => (
          <button
            key={label}
            onClick={() => onExampleClick(question)}
            className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border hover:border-primary hover:shadow-soft transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm font-medium text-foreground">{label}</span>
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground mt-8 max-w-sm">
        📷 Tip: Upload a photo of your plant for better diagnosis!
      </p>
    </div>
  );
}
