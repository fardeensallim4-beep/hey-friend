import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ChevronDown, Search } from "lucide-react";
import { useMemo, useState } from "react";

interface Country {
  name: string;
  code: string;
  dial: string;
  flag: string;
}

// Comprehensive list of countries
const COUNTRIES: Country[] = [
  { name: "Afghanistan", code: "AF", dial: "+93", flag: "🇦🇫" },
  { name: "Albania", code: "AL", dial: "+355", flag: "🇦🇱" },
  { name: "Algeria", code: "DZ", dial: "+213", flag: "🇩🇿" },
  { name: "Andorra", code: "AD", dial: "+376", flag: "🇦🇩" },
  { name: "Angola", code: "AO", dial: "+244", flag: "🇦🇴" },
  { name: "Argentina", code: "AR", dial: "+54", flag: "🇦🇷" },
  { name: "Armenia", code: "AM", dial: "+374", flag: "🇦🇲" },
  { name: "Australia", code: "AU", dial: "+61", flag: "🇦🇺" },
  { name: "Austria", code: "AT", dial: "+43", flag: "🇦🇹" },
  { name: "Azerbaijan", code: "AZ", dial: "+994", flag: "🇦🇿" },
  { name: "Bahamas", code: "BS", dial: "+1-242", flag: "🇧🇸" },
  { name: "Bahrain", code: "BH", dial: "+973", flag: "🇧🇭" },
  { name: "Bangladesh", code: "BD", dial: "+880", flag: "🇧🇩" },
  { name: "Belgium", code: "BE", dial: "+32", flag: "🇧🇪" },
  { name: "Bolivia", code: "BO", dial: "+591", flag: "🇧🇴" },
  { name: "Bosnia and Herzegovina", code: "BA", dial: "+387", flag: "🇧🇦" },
  { name: "Botswana", code: "BW", dial: "+267", flag: "🇧🇼" },
  { name: "Brazil", code: "BR", dial: "+55", flag: "🇧🇷" },
  { name: "Brunei", code: "BN", dial: "+673", flag: "🇧🇳" },
  { name: "Bulgaria", code: "BG", dial: "+359", flag: "🇧🇬" },
  { name: "Burkina Faso", code: "BF", dial: "+226", flag: "🇧🇫" },
  { name: "Burundi", code: "BI", dial: "+257", flag: "🇧🇮" },
  { name: "Cambodia", code: "KH", dial: "+855", flag: "🇰🇭" },
  { name: "Cameroon", code: "CM", dial: "+237", flag: "🇨🇲" },
  { name: "Canada", code: "CA", dial: "+1", flag: "🇨🇦" },
  { name: "Cape Verde", code: "CV", dial: "+238", flag: "🇨🇻" },
  { name: "Central African Republic", code: "CF", dial: "+236", flag: "🇨🇫" },
  { name: "Chad", code: "TD", dial: "+235", flag: "🇹🇩" },
  { name: "Chile", code: "CL", dial: "+56", flag: "🇨🇱" },
  { name: "China", code: "CN", dial: "+86", flag: "🇨🇳" },
  { name: "Colombia", code: "CO", dial: "+57", flag: "🇨🇴" },
  { name: "Comoros", code: "KM", dial: "+269", flag: "🇰🇲" },
  { name: "Congo (DRC)", code: "CD", dial: "+243", flag: "🇨🇩" },
  { name: "Congo (Republic)", code: "CG", dial: "+242", flag: "🇨🇬" },
  { name: "Costa Rica", code: "CR", dial: "+506", flag: "🇨🇷" },
  { name: "Croatia", code: "HR", dial: "+385", flag: "🇭🇷" },
  { name: "Cuba", code: "CU", dial: "+53", flag: "🇨🇺" },
  { name: "Cyprus", code: "CY", dial: "+357", flag: "🇨🇾" },
  { name: "Czech Republic", code: "CZ", dial: "+420", flag: "🇨🇿" },
  { name: "Denmark", code: "DK", dial: "+45", flag: "🇩🇰" },
  { name: "Djibouti", code: "DJ", dial: "+253", flag: "🇩🇯" },
  { name: "Dominican Republic", code: "DO", dial: "+1-809", flag: "🇩🇴" },
  { name: "Ecuador", code: "EC", dial: "+593", flag: "🇪🇨" },
  { name: "Egypt", code: "EG", dial: "+20", flag: "🇪🇬" },
  { name: "El Salvador", code: "SV", dial: "+503", flag: "🇸🇻" },
  { name: "Equatorial Guinea", code: "GQ", dial: "+240", flag: "🇬🇶" },
  { name: "Eritrea", code: "ER", dial: "+291", flag: "🇪🇷" },
  { name: "Estonia", code: "EE", dial: "+372", flag: "🇪🇪" },
  { name: "Eswatini", code: "SZ", dial: "+268", flag: "🇸🇿" },
  { name: "Ethiopia", code: "ET", dial: "+251", flag: "🇪🇹" },
  { name: "Fiji", code: "FJ", dial: "+679", flag: "🇫🇯" },
  { name: "Finland", code: "FI", dial: "+358", flag: "🇫🇮" },
  { name: "France", code: "FR", dial: "+33", flag: "🇫🇷" },
  { name: "Gabon", code: "GA", dial: "+241", flag: "🇬🇦" },
  { name: "Gambia", code: "GM", dial: "+220", flag: "🇬🇲" },
  { name: "Georgia", code: "GE", dial: "+995", flag: "🇬🇪" },
  { name: "Germany", code: "DE", dial: "+49", flag: "🇩🇪" },
  { name: "Ghana", code: "GH", dial: "+233", flag: "🇬🇭" },
  { name: "Greece", code: "GR", dial: "+30", flag: "🇬🇷" },
  { name: "Guatemala", code: "GT", dial: "+502", flag: "🇬🇹" },
  { name: "Guinea", code: "GN", dial: "+224", flag: "🇬🇳" },
  { name: "Guinea-Bissau", code: "GW", dial: "+245", flag: "🇬🇼" },
  { name: "Guyana", code: "GY", dial: "+592", flag: "🇬🇾" },
  { name: "Haiti", code: "HT", dial: "+509", flag: "🇭🇹" },
  { name: "Honduras", code: "HN", dial: "+504", flag: "🇭🇳" },
  { name: "Hungary", code: "HU", dial: "+36", flag: "🇭🇺" },
  { name: "Iceland", code: "IS", dial: "+354", flag: "🇮🇸" },
  { name: "India", code: "IN", dial: "+91", flag: "🇮🇳" },
  { name: "Indonesia", code: "ID", dial: "+62", flag: "🇮🇩" },
  { name: "Iran", code: "IR", dial: "+98", flag: "🇮🇷" },
  { name: "Iraq", code: "IQ", dial: "+964", flag: "🇮🇶" },
  { name: "Ireland", code: "IE", dial: "+353", flag: "🇮🇪" },
  { name: "Israel", code: "IL", dial: "+972", flag: "🇮🇱" },
  { name: "Italy", code: "IT", dial: "+39", flag: "🇮🇹" },
  { name: "Jamaica", code: "JM", dial: "+1-876", flag: "🇯🇲" },
  { name: "Japan", code: "JP", dial: "+81", flag: "🇯🇵" },
  { name: "Jordan", code: "JO", dial: "+962", flag: "🇯🇴" },
  { name: "Kazakhstan", code: "KZ", dial: "+7", flag: "🇰🇿" },
  { name: "Kenya", code: "KE", dial: "+254", flag: "🇰🇪" },
  { name: "Kuwait", code: "KW", dial: "+965", flag: "🇰🇼" },
  { name: "Kyrgyzstan", code: "KG", dial: "+996", flag: "🇰🇬" },
  { name: "Laos", code: "LA", dial: "+856", flag: "🇱🇦" },
  { name: "Latvia", code: "LV", dial: "+371", flag: "🇱🇻" },
  { name: "Lebanon", code: "LB", dial: "+961", flag: "🇱🇧" },
  { name: "Lesotho", code: "LS", dial: "+266", flag: "🇱🇸" },
  { name: "Liberia", code: "LR", dial: "+231", flag: "🇱🇷" },
  { name: "Libya", code: "LY", dial: "+218", flag: "🇱🇾" },
  { name: "Liechtenstein", code: "LI", dial: "+423", flag: "🇱🇮" },
  { name: "Lithuania", code: "LT", dial: "+370", flag: "🇱🇹" },
  { name: "Luxembourg", code: "LU", dial: "+352", flag: "🇱🇺" },
  { name: "Madagascar", code: "MG", dial: "+261", flag: "🇲🇬" },
  { name: "Malawi", code: "MW", dial: "+265", flag: "🇲🇼" },
  { name: "Malaysia", code: "MY", dial: "+60", flag: "🇲🇾" },
  { name: "Maldives", code: "MV", dial: "+960", flag: "🇲🇻" },
  { name: "Mali", code: "ML", dial: "+223", flag: "🇲🇱" },
  { name: "Malta", code: "MT", dial: "+356", flag: "🇲🇹" },
  { name: "Mauritania", code: "MR", dial: "+222", flag: "🇲🇷" },
  { name: "Mauritius", code: "MU", dial: "+230", flag: "🇲🇺" },
  { name: "Mexico", code: "MX", dial: "+52", flag: "🇲🇽" },
  { name: "Moldova", code: "MD", dial: "+373", flag: "🇲🇩" },
  { name: "Monaco", code: "MC", dial: "+377", flag: "🇲🇨" },
  { name: "Mongolia", code: "MN", dial: "+976", flag: "🇲🇳" },
  { name: "Montenegro", code: "ME", dial: "+382", flag: "🇲🇪" },
  { name: "Morocco", code: "MA", dial: "+212", flag: "🇲🇦" },
  { name: "Mozambique", code: "MZ", dial: "+258", flag: "🇲🇿" },
  { name: "Myanmar", code: "MM", dial: "+95", flag: "🇲🇲" },
  { name: "Namibia", code: "NA", dial: "+264", flag: "🇳🇦" },
  { name: "Nepal", code: "NP", dial: "+977", flag: "🇳🇵" },
  { name: "Netherlands", code: "NL", dial: "+31", flag: "🇳🇱" },
  { name: "New Zealand", code: "NZ", dial: "+64", flag: "🇳🇿" },
  { name: "Nicaragua", code: "NI", dial: "+505", flag: "🇳🇮" },
  { name: "Niger", code: "NE", dial: "+227", flag: "🇳🇪" },
  { name: "Nigeria", code: "NG", dial: "+234", flag: "🇳🇬" },
  { name: "North Korea", code: "KP", dial: "+850", flag: "🇰🇵" },
  { name: "North Macedonia", code: "MK", dial: "+389", flag: "🇲🇰" },
  { name: "Norway", code: "NO", dial: "+47", flag: "🇳🇴" },
  { name: "Oman", code: "OM", dial: "+968", flag: "🇴🇲" },
  { name: "Pakistan", code: "PK", dial: "+92", flag: "🇵🇰" },
  { name: "Palestine", code: "PS", dial: "+970", flag: "🇵🇸" },
  { name: "Panama", code: "PA", dial: "+507", flag: "🇵🇦" },
  { name: "Papua New Guinea", code: "PG", dial: "+675", flag: "🇵🇬" },
  { name: "Paraguay", code: "PY", dial: "+595", flag: "🇵🇾" },
  { name: "Peru", code: "PE", dial: "+51", flag: "🇵🇪" },
  { name: "Philippines", code: "PH", dial: "+63", flag: "🇵🇭" },
  { name: "Poland", code: "PL", dial: "+48", flag: "🇵🇱" },
  { name: "Portugal", code: "PT", dial: "+351", flag: "🇵🇹" },
  { name: "Qatar", code: "QA", dial: "+974", flag: "🇶🇦" },
  { name: "Romania", code: "RO", dial: "+40", flag: "🇷🇴" },
  { name: "Russia", code: "RU", dial: "+7", flag: "🇷🇺" },
  { name: "Rwanda", code: "RW", dial: "+250", flag: "🇷🇼" },
  { name: "Saudi Arabia", code: "SA", dial: "+966", flag: "🇸🇦" },
  { name: "Senegal", code: "SN", dial: "+221", flag: "🇸🇳" },
  { name: "Serbia", code: "RS", dial: "+381", flag: "🇷🇸" },
  { name: "Sierra Leone", code: "SL", dial: "+232", flag: "🇸🇱" },
  { name: "Singapore", code: "SG", dial: "+65", flag: "🇸🇬" },
  { name: "Slovakia", code: "SK", dial: "+421", flag: "🇸🇰" },
  { name: "Slovenia", code: "SI", dial: "+386", flag: "🇸🇮" },
  { name: "Somalia", code: "SO", dial: "+252", flag: "🇸🇴" },
  { name: "South Africa", code: "ZA", dial: "+27", flag: "🇿🇦" },
  { name: "South Korea", code: "KR", dial: "+82", flag: "🇰🇷" },
  { name: "South Sudan", code: "SS", dial: "+211", flag: "🇸🇸" },
  { name: "Spain", code: "ES", dial: "+34", flag: "🇪🇸" },
  { name: "Sri Lanka", code: "LK", dial: "+94", flag: "🇱🇰" },
  { name: "Sudan", code: "SD", dial: "+249", flag: "🇸🇩" },
  { name: "Suriname", code: "SR", dial: "+597", flag: "🇸🇷" },
  { name: "Sweden", code: "SE", dial: "+46", flag: "🇸🇪" },
  { name: "Switzerland", code: "CH", dial: "+41", flag: "🇨🇭" },
  { name: "Syria", code: "SY", dial: "+963", flag: "🇸🇾" },
  { name: "Taiwan", code: "TW", dial: "+886", flag: "🇹🇼" },
  { name: "Tajikistan", code: "TJ", dial: "+992", flag: "🇹🇯" },
  { name: "Tanzania", code: "TZ", dial: "+255", flag: "🇹🇿" },
  { name: "Thailand", code: "TH", dial: "+66", flag: "🇹🇭" },
  { name: "Timor-Leste", code: "TL", dial: "+670", flag: "🇹🇱" },
  { name: "Togo", code: "TG", dial: "+228", flag: "🇹🇬" },
  { name: "Trinidad and Tobago", code: "TT", dial: "+1-868", flag: "🇹🇹" },
  { name: "Tunisia", code: "TN", dial: "+216", flag: "🇹🇳" },
  { name: "Turkey", code: "TR", dial: "+90", flag: "🇹🇷" },
  { name: "Turkmenistan", code: "TM", dial: "+993", flag: "🇹🇲" },
  { name: "Uganda", code: "UG", dial: "+256", flag: "🇺🇬" },
  { name: "Ukraine", code: "UA", dial: "+380", flag: "🇺🇦" },
  { name: "United Arab Emirates", code: "AE", dial: "+971", flag: "🇦🇪" },
  { name: "United Kingdom", code: "GB", dial: "+44", flag: "🇬🇧" },
  { name: "United States", code: "US", dial: "+1", flag: "🇺🇸" },
  { name: "Uruguay", code: "UY", dial: "+598", flag: "🇺🇾" },
  { name: "Uzbekistan", code: "UZ", dial: "+998", flag: "🇺🇿" },
  { name: "Venezuela", code: "VE", dial: "+58", flag: "🇻🇪" },
  { name: "Vietnam", code: "VN", dial: "+84", flag: "🇻🇳" },
  { name: "Yemen", code: "YE", dial: "+967", flag: "🇾🇪" },
  { name: "Zambia", code: "ZM", dial: "+260", flag: "🇿🇲" },
  { name: "Zimbabwe", code: "ZW", dial: "+263", flag: "🇿🇼" },
];

interface Props {
  value: string;
  onChange: (dial: string) => void;
}

export function CountryCodeSelector({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = useMemo(
    () => COUNTRIES.find((c) => c.dial === value) ?? COUNTRIES[0],
    [value],
  );

  const filtered = useMemo(
    () =>
      search.trim()
        ? COUNTRIES.filter(
            (c) =>
              c.name.toLowerCase().includes(search.toLowerCase()) ||
              c.dial.includes(search),
          )
        : COUNTRIES,
    [search],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-1.5 px-2 min-w-[80px] h-10"
          type="button"
        >
          <span className="text-base leading-none">{selected.flag}</span>
          <span className="text-sm font-medium">{selected.dial}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <div className="p-2 border-b border-border">
          <div className="flex items-center gap-2 px-2">
            <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <input
              className="w-full text-sm bg-transparent outline-none placeholder:text-muted-foreground"
              placeholder="Search country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <ScrollArea className="h-60">
          <div className="p-1">
            {filtered.map((country) => (
              <button
                key={country.code}
                type="button"
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors",
                  country.dial === value &&
                    "bg-primary/10 text-primary font-medium",
                )}
                onClick={() => {
                  onChange(country.dial);
                  setOpen(false);
                  setSearch("");
                }}
              >
                <span className="text-base leading-none">{country.flag}</span>
                <span className="flex-1 text-left truncate">
                  {country.name}
                </span>
                <span className="text-muted-foreground text-xs flex-shrink-0">
                  {country.dial}
                </span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">
                No countries found
              </p>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

export { COUNTRIES };
export type { Country };
