import { useState } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

const jobRoles = [
  "AI Engineer",
  "Full Stack Developer",
  "Frontend Developer",
  "Backend Developer",
  "Data Scientist",
  "Data Analyst",
  "DevOps Engineer",
  "Machine Learning Engineer",
  "Software Engineer",
  "Product Manager",
  "UX/UI Designer",
  "Mobile Developer",
  "Cloud Architect",
  "Security Engineer",
  "QA Engineer",
];

interface JobRoleSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  className?: string;
}

export const JobRoleSelector = ({ value, onValueChange, className }: JobRoleSelectorProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between glass hover:border-accent/50",
            className
          )}
        >
          {value ? (
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" />
              <span>{value}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">Select job role...</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 glass border-white/20">
        <Command>
          <CommandInput placeholder="Search job roles..." className="h-9" />
          <CommandList>
            <CommandEmpty>No role found.</CommandEmpty>
            <CommandGroup>
              {jobRoles.map((role) => (
                <CommandItem
                  key={role}
                  value={role}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                  className="cursor-pointer hover:bg-primary/10"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === role ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {role}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};


