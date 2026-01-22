import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, X, Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  background_image_url: string | null;
  primary_color: string;
  secondary_color: string;
  font_family: string;
  require_login: boolean;
  status: string;
  custom_content: string | null;
  use_knowsy_topics: boolean;
  enable_popup: boolean;
  popup_description: string | null;
}

interface OrganizationBrandingProps {
  organization: Organization;
  onUpdate: () => void;
}

const OrganizationBranding = ({ organization, onUpdate }: OrganizationBrandingProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState(organization.logo_url || "");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState(organization.background_image_url || "");
  const [backgroundImageFile, setBackgroundImageFile] = useState<File | null>(null);
  const [uploadingBackgroundImage, setUploadingBackgroundImage] = useState(false);
  const [primaryColor, setPrimaryColor] = useState(organization.primary_color);
  const [secondaryColor, setSecondaryColor] = useState(organization.secondary_color);
  const [fontFamily, setFontFamily] = useState(organization.font_family);
  const [requireLogin, setRequireLogin] = useState(organization.require_login);
  const [description, setDescription] = useState(organization.description || "");
  // const [customContent, setCustomContent] = useState(organization.custom_content || "");
  const [useKnowsyTopics, setUseKnowsyTopics] = useState(organization.use_knowsy_topics);
  const [enablePopup, setEnablePopup] = useState(organization.enable_popup);
  const [popupDescription, setPopupDescription] = useState(organization.popup_description || "");
  const [fontOpen, setFontOpen] = useState(false);
  const { toast } = useToast();

  const modules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'size': ['small', false, 'large', 'huge'] }]
    ],
  };

  const formats = [
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'size'
  ];

  useEffect(() => {
    setPopupDescription(organization.popup_description || "");
  }, [organization.popup_description]);

  const googleFonts = [
    "Roboto",
    "Open Sans",
    "Montserrat",
    "Lato",
    "Poppins",
    "Roboto Condensed",
    "Oswald",
    "Source Sans Pro",
    "Slabo 27px",
    "Raleway",
    "PT Sans",
    "Merriweather",
    "Ubuntu",
    "Noto Sans",
    "Roboto Slab",
    "Playfair Display",
    "Nunito",
    "Rubik",
    "Work Sans",
    "Fira Sans",
    "Quicksand",
    "Mukta",
    "Noto Serif",
    "Inconsolata",
    "Crimson Text",
    "Space Mono",
    "Arimo",
    "Tinos",
    "Cousine",
    "Karla",
    "Libre Franklin",
    "Lora",
    "Cairo",
    "Arvo",
    "Bitter",
    "Domine",
    "EB Garamond",
    "Crimson Pro",
    "Libre Baskerville",
    "Merriweather Sans",
    "Source Serif Pro",
    "Vollkorn",
    "Old Standard TT",
    "PT Serif",
    "Libre Caslon Text",
    "Alice",
    "Amiri",
    "Andada",
    "Dancing Script",
    "Pacifico",
    "Great Vibes",
    "Satisfy",
    "Caveat",
    "Shadows Into Light",
    "Amatic SC",
    "Permanent Marker",
    "Fredoka One",
    "Comfortaa",
    "Righteous",
    "Bangers",
    "Chewy",
    "Lobster",
    "Indie Flower",
    "Architects Daughter",
    "Handlee",
    "Patrick Hand",
    "Gloria Hallelujah",
    "Coming Soon",
    "Schoolbell",
    "Crafty Girls",
    "Just Another Hand",
    "Kalam",
    "Neucha",
    "Covered By Your Grace",
    "Rock Salt",
    "Walter Turncoat",
    "Special Elite",
    "Press Start 2P",
    "Orbitron",
    "Audiowide",
    "Exo",
    "Teko",
    "Russo One",
    "Black Ops One",
    "Wallpoet",
    "Sigmar One",
    "Fugaz One",
    "Electrolize",
    "Quantico",
    "Share Tech Mono",
    "Fira Code",
    "JetBrains Mono",
    "Source Code Pro",
    "Roboto Mono",
    "Space Grotesk",
    "Inter",
    "Manrope",
    "DM Sans",
    "Epilogue",
    "Figtree",
    "Lexend",
    "Plus Jakarta Sans",
    "Clash Display",
    "Cal Sans",
    "Satoshi",
    "Geist",
    "Instrument Sans",
    "Supreme",
    "Cabinet Grotesk",
    "Panchang",
    "General Sans",
    "Thunder",
    "Aeonik",
    "Roobert",
    "Maison Neue",
    "Calibre",
    "Switzer",
    "Gambarino",
    "Ploy",
    "Anybody",
    "Whyte",
    "Editorial New",
    "Tiempos Headline",
    "Tiempos Text",
    "Pilot",
    "Silk Serif",
    "Silk Display",
    "Canela",
    "Canela Text",
    "Canela Deck",
    "Freight Text",
    "Freight Display",
    "Freight Big",
    "Freight Micro",
    "Abel",
    "Acme",
    "Actor",
    "Adamina",
    "Advent Pro",
    "Agrandir",
    "Akronim",
    "Aladin",
    "Aldrich",
    "Alef",
    "Alegreya",
    "Alegreya Sans",
    "Alegreya Sans SC",
    "Alegreya SC",
    "Alex Brush",
    "Alfa Slab One",
    "Alice",
    "Alike",
    "Alike Angular",
    "Allan",
    "Allerta",
    "Allerta Stencil",
    "Allura",
    "Almendra",
    "Almendra Display",
    "Almendra SC",
    "Amarante",
    "Amaranth",
    "Amatic SC",
    "Amethysta",
    "Amiko",
    "Amiri",
    "Amita",
    "Anaheim",
    "Andada",
    "Andika",
    "Angkor",
    "Annie Use Your Telescope",
    "Anonymous Pro",
    "Antic",
    "Antic Didone",
    "Antic Slab",
    "Anton",
    "Arapey",
    "Arbutus",
    "Arbutus Slab",
    "Architects Daughter",
    "Archivo",
    "Archivo Black",
    "Archivo Narrow",
    "Arimo",
    "Arizonia",
    "Armata",
    "Arsenal",
    "Artifika",
    "Arvo",
    "Arya",
    "Asap",
    "Asap Condensed",
    "Asar",
    "Asset",
    "Assistant",
    "Astloch",
    "Asul",
    "Athiti",
    "Atma",
    "Atomic Age",
    "Aubrey",
    "Audiowide",
    "Autour One",
    "Average",
    "Average Sans",
    "Averia Gruesa Libre",
    "Averia Libre",
    "Averia Sans Libre",
    "Averia Serif Libre",
    "Bad Script",
    "Bahiana",
    "Baloo",
    "Baloo Bhai",
    "Baloo Bhaijaan",
    "Baloo Bhaina",
    "Baloo Chettan",
    "Baloo Da",
    "Baloo Paaji",
    "Baloo Tamma",
    "Baloo Tammudu",
    "Baloo Thambi",
    "Balsamiq Sans",
    "Balthazar",
    "Bangers",
    "Barrio",
    "Basic",
    "Battambang",
    "Baumans",
    "Bayon",
    "Be Vietnam",
    "Be Vietnam Pro",
    "Beaver",
    "Belgrano",
    "Bellefair",
    "Belleza",
    "BenchNine",
    "Bentham",
    "Berkshire Swash",
    "Bevan",
    "Bigelow Rules",
    "Bigshot One",
    "Bilbo",
    "Bilbo Swash Caps",
    "Bio Rhyme",
    "Bio Rhyme Expanded",
    "Biryani",
    "Bitter",
    "Black And White Picture",
    "Black Han Sans",
    "Black Ops One",
    "Blinker",
    "Bodoni Moda",
    "Bokor",
    "Bonbon",
    "Boogaloo",
    "Bowlby One",
    "Bowlby One SC",
    "Brawler",
    "Bree Serif",
    "Bubblegum Sans",
    "Bubbler One",
    "Buda",
    "Buenard",
    "Bungee",
    "Bungee Hairline",
    "Bungee Inline",
    "Bungee Outline",
    "Bungee Shade",
    "Butcherman",
    "Butterfly Kids",
    "Cabin",
    "Cabin Condensed",
    "Cabin Sketch",
    "Caesar Dressing",
    "Cagliostro",
    "Cairo",
    "Calligraffitti",
    "Cambay",
    "Cambo",
    "Candal",
    "Cantarell",
    "Cantata One",
    "Cantora One",
    "Capriola",
    "Cardo",
    "Carme",
    "Carrois Gothic",
    "Carrois Gothic SC",
    "Carter One",
    "Catamaran",
    "Caudex",
    "Caveat",
    "Caveat Brush",
    "Cedarville Cursive",
    "Ceviche One",
    "Chakra Petch",
    "Changa",
    "Changa One",
    "Chango",
    "Charm",
    "Charmonman",
    "Chathura",
    "Chau Philomene One",
    "Chela One",
    "Chelsea Market",
    "Chenla",
    "Cherry Cream Soda",
    "Cherry Swash",
    "Chewy",
    "Chicle",
    "Chilanka",
    "Chivo",
    "Chonburi",
    "Cinzel",
    "Cinzel Decorative",
    "Cirrus Cumulus",
    "Coda",
    "Coda Caption",
    "Codystar",
    "Coiny",
    "Combo",
    "Comfortaa",
    "Comic Neue",
    "Coming Soon",
    "Concert One",
    "Condiment",
    "Content",
    "Contrail One",
    "Convergence",
    "Cookie",
    "Copse",
    "Corben",
    "Cormorant",
    "Cormorant Garamond",
    "Cormorant Infant",
    "Cormorant SC",
    "Cormorant Unicase",
    "Cormorant Upright",
    "Courgette",
    "Cousine",
    "Coustard",
    "Covered By Your Grace",
    "Crafty Girls",
    "Creepster",
    "Crete Round",
    "Crimson Pro",
    "Crimson Text",
    "Croissant One",
    "Crushed",
    "Cuprum",
    "Cute Font",
    "Cutive",
    "Cutive Mono",
    "Damion",
    "Dancing Script",
    "Dangrek",
    "David Libre",
    "Dawning of a New Day",
    "Days One",
    "Dekko",
    "Delius",
    "Delius Swash Caps",
    "Delius Unicase",
    "Della Respira",
    "Denk One",
    "Devonshire",
    "Dhurjati",
    "Didact Gothic",
    "Diplomata",
    "Diplomata SC",
    "DM Sans",
    "DM Serif Display",
    "DM Serif Text",
    "Do Hyeon",
    "Dokdo",
    "Domine",
    "Donegal One",
    "Doppio One",
    "Dorsa",
    "Dosis",
    "Dr Sugiyama",
    "Droid Sans",
    "Droid Sans Mono",
    "Droid Serif",
    "Duru Sans",
    "Dynalight",
    "EB Garamond",
    "Eater",
    "Economica",
    "Eczar",
    "El Messiri",
    "Electrolize",
    "Elsie",
    "Elsie Swash Caps",
    "Emblema One",
    "Emilys Candy",
    "Encode Sans",
    "Encode Sans Condensed",
    "Encode Sans Expanded",
    "Encode Sans Semi Condensed",
    "Encode Sans Semi Expanded",
    "Engagement",
    "Englebert",
    "Enriqueta",
    "Epilogue",
    "Erica One",
    "Esteban",
    "Euphoria Script",
    "Ewdu CV 07",
    "Exo",
    "Exo 2",
    "Expletus Sans",
    "Fahkwang",
    "Fanwood Text",
    "Farro",
    "Farsan",
    "Fascinate",
    "Fascinate Inline",
    "Faster One",
    "Fasthand",
    "Fauna One",
    "Faustina",
    "Federant",
    "Federo",
    "Felipa",
    "Fenix",
    "Finger Paint",
    "Fira Code",
    "Fira Mono",
    "Fira Sans",
    "Fira Sans Condensed",
    "Fira Sans Extra Condensed",
    "Fira Sans Extra Light",
    "Fira Sans Light",
    "Fira Sans Medium",
    "Fira Sans Semi Bold",
    "Fira Sans Thin",
    "Fjalla One",
    "Fjord One",
    "Flamenco",
    "Flavors",
    "Fondamento",
    "Fontdiner Swanky",
    "Forum",
    "Francois One",
    "Frank Ruhl Libre",
    "Fraunces",
    "Freckle Face",
    "Fredericka the Great",
    "Fredoka One",
    "Freehand",
    "Fresca",
    "Frijole",
    "Fruktur",
    "Fugaz One",
    "GFS Didot",
    "GFS Neohellenic",
    "Gabriela",
    "Gaegu",
    "Gafata",
    "Galada",
    "Galdeano",
    "Galindo",
    "Gamja Flower",
    "Gayathri",
    "Gelasio",
    "Gentium Basic",
    "Gentium Book Basic",
    "Geo",
    "Geostar",
    "Geostar Fill",
    "Germania One",
    "Gidugu",
    "Gilda Display",
    "Give You Glory",
    "Glass Antiqua",
    "Glegoo",
    "Gloria Hallelujah",
    "Goblin One",
    "Gochi Hand",
    "Gorditas",
    "Goudy Bookletter 1911",
    "Graduate",
    "Grand Hotel",
    "Gravitas One",
    "Great Vibes",
    "Grenze",
    "Grenze Gotisch",
    "Griffiths",
    "Gruppo",
    "Gudea",
    "Gugi",
    "Gulzar",
    "Gupter",
    "Gurajada",
    "Habibi",
    "Halant",
    "Hammersmith One",
    "Hanalei",
    "Hanalei Fill",
    "Handlee",
    "Hanuman",
    "Happy Monkey",
    "Harmattan",
    "Headland One",
    "Heebo",
    "Henny Penny",
    "Hermeneus One",
    "Herr Von Muellerhoff",
    "Hi Melody",
    "Hind",
    "Hind Guntur",
    "Hind Madurai",
    "Hind Siliguri",
    "Hind Vadodara",
    "Holtwood One SC",
    "Homemade Apple",
    "Homenaje",
    "IBM Plex Mono",
    "IBM Plex Sans",
    "IBM Plex Serif",
    "Iceland",
    "Imprima",
    "Inconsolata",
    "Inder",
    "Indie Flower",
    "Inika",
    "Inknut Antiqua",
    "Irish Grover",
    "Istok Web",
    "Italiana",
    "Italianno",
    "Itim",
    "Jacques Francois",
    "Jacques Francois Shadow",
    "Jaldi",
    "Jim Nightshade",
    "Jockey One",
    "Jolly Lodger",
    "Jomhuria",
    "Jomolhari",
    "Josefin Sans",
    "Josefin Slab",
    "Jost",
    "Joti One",
    "Jua",
    "Judson",
    "Julee",
    "Julius Sans One",
    "Junge",
    "Jura",
    "Just Another Hand",
    "Just Me Again Down Here",
    "K2D",
    "Kadwa",
    "Kalam",
    "Kameron",
    "Kanit",
    "Kantumruy",
    "Karla",
    "Karma",
    "Katibeh",
    "Kaushan Script",
    "Kavivanar",
    "Kavoon",
    "Kdam Thmor",
    "Keania One",
    "Kelly Slab",
    "Kenia",
    "Khand",
    "Khmer",
    "Khula",
    "Kings",
    "Kirang Haerang",
    "Kites",
    "Knewave",
    "KoHo",
    "Kodchasan",
    "Kosugi",
    "Kosugi Maru",
    "Kotta One",
    "Koulen",
    "Kranky",
    "Kreon",
    "Kristi",
    "Krona One",
    "Kumar One",
    "Kumar One Outline",
    "Kurale",
    "La Belle Aurore",
    "Lacquer",
    "Laila",
    "Lakki Reddy",
    "Lalezar",
    "Lancelot",
    "Lateef",
    "Lato",
    "League Gothic",
    "League Script",
    "League Spartan",
    "Leckerli One",
    "Ledger",
    "Lekton",
    "Lemon",
    "Lemonada",
    "Lexend Deca",
    "Lexend Exa",
    "Lexend Giga",
    "Lexend Mega",
    "Lexend Peta",
    "Lexend Tera",
    "Lexend Zetta",
    "Libre Barcode 128",
    "Libre Barcode 128 Text",
    "Libre Barcode 39",
    "Libre Barcode 39 Extended",
    "Libre Barcode 39 Extended Text",
    "Libre Barcode 39 Text",
    "Libre Barcode EAN13 Text",
    "Libre Baskerville",
    "Libre Bodoni",
    "Libre Caslon Display",
    "Libre Caslon Text",
    "Libre Franklin",
    "Lilita One",
    "Lily Script One",
    "Limelight",
    "Linden Hill",
    "Literata",
    "Liu Jian Mao Cao",
    "Livvic",
    "Lobster",
    "Lobster Two",
    "Londrina Outline",
    "Londrina Shadow",
    "Londrina Sketch",
    "Londrina Solid",
    "Long Cang",
    "Lora",
    "Love Ya Like A Sister",
    "Loved by the King",
    "Lovers Quarrel",
    "Luckiest Guy",
    "Lusitana",
    "Lustria",
    "Macondo",
    "Macondo Swash Caps",
    "Mada",
    "Magra",
    "Maiden Orange",
    "Maitree",
    "Major Mono Display",
    "Mako",
    "Mali",
    "Mallanna",
    "Mandali",
    "Manjari",
    "Manrope",
    "Mansalva",
    "Manuale",
    "Marcellus",
    "Marcellus SC",
    "Marck Script",
    "Margarine",
    "Markazi Text",
    "Marko One",
    "Marmelad",
    "Martel",
    "Martel Sans",
    "Marvel",
    "Mate",
    "Mate SC",
    "Maven Pro",
    "McLaren",
    "Meddon",
    "MedievalSharp",
    "Medula One",
    "Meera",
    "Megrim",
    "Meie Script",
    "Merienda",
    "Merienda One",
    "Merriweather",
    "Merriweather Sans",
    "Metal",
    "Metal Mania",
    "Metamorphous",
    "Metrophobic",
    "Michroma",
    "Milonga",
    "Miltonian",
    "Miltonian Tattoo",
    "Mina",
    "Miniver",
    "Miriam Libre",
    "Mirza",
    "Miss Fajardose",
    "Mitr",
    "Modak",
    "Modern Antiqua",
    "Mogra",
    "Molengo",
    "Molle",
    "Monda",
    "Montez",
    "Montserrat",
    "Montserrat Alternates",
    "Montserrat Subrayada",
    "Moul",
    "Moulpali",
    "Mountains of Christmas",
    "Mouse Memoirs",
    "Mr Bedfort",
    "Mr Dafoe",
    "Mr De Haviland",
    "Mrs Saint Delafield",
    "Mrs Sheppards",
    "Mukti",
    "Mulish",
    "MuseoModerno",
    "Mystery Quest",
    "NTR",
    "Nanum Brush Script",
    "Nanum Gothic",
    "Nanum Gothic Coding",
    "Nanum Myeongjo",
    "Nanum Pen Script",
    "Neucha",
    "Neuton",
    "New Rocker",
    "News Cycle",
    "Niconne",
    "Niramit",
    "Nixie One",
    "Nobile",
    "Nokora",
    "Norican",
    "Nosifer",
    "Notable",
    "Nothing You Could Do",
    "Noticia Text",
    "Noto Color Emoji",
    "Noto Emoji",
    "Noto Kufi Arabic",
    "Noto Music",
    "Noto Naskh Arabic",
    "Noto Nastaliq Urdu",
    "Noto Rashi Hebrew",
    "Noto Sans",
    "Noto Sans Adlam",
    "Noto Sans Adlam Unjoined",
    "Noto Sans Anatolian Hieroglyphs",
    "Noto Sans Arabic",
    "Noto Sans Armenian",
    "Noto Sans Avestan",
    "Noto Sans Balinese",
    "Noto Sans Bamum",
    "Noto Sans Bassa Vah",
    "Noto Sans Batak",
    "Noto Sans Bengali",
    "Noto Sans Bhaiksuki",
    "Noto Sans Brahmi",
    "Noto Sans Buginese",
    "Noto Sans Buhid",
    "Noto Sans Canadian Aboriginal",
    "Noto Sans Carian",
    "Noto Sans Caucasian Albanian",
    "Noto Sans Chakma",
    "Noto Sans Cham",
    "Noto Sans Cherokee",
    "Noto Sans Coptic",
    "Noto Sans Cuneiform",
    "Noto Sans Cypriot",
    "Noto Sans Deseret",
    "Noto Sans Devanagari",
    "Noto Sans Display",
    "Noto Sans Duployan",
    "Noto Sans Egyptian Hieroglyphs",
    "Noto Sans Elbasan",
    "Noto Sans Elymaic",
    "Noto Sans Georgian",
    "Noto Sans Glagolitic",
    "Noto Sans Gothic",
    "Noto Sans Grantha",
    "Noto Sans Gujarati",
    "Noto Sans Gunjala Gondi",
    "Noto Sans Gurmukhi",
    "Noto Sans HK",
    "Noto Sans Hanifi Rohingya",
    "Noto Sans Hanunoo",
    "Noto Sans Hatran",
    "Noto Sans Hebrew",
    "Noto Sans Imperial Aramaic",
    "Noto Sans Indic Siyaq Numbers",
    "Noto Sans Inscriptional Pahlavi",
    "Noto Sans Inscriptional Parthian",
    "Noto Sans JP",
    "Noto Sans Javanese",
    "Noto Sans Kaithi",
    "Noto Sans Kannada",
    "Noto Sans Kayah Li",
    "Noto Sans Kharoshthi",
    "Noto Sans Khmer",
    "Noto Sans Khojki",
    "Noto Sans Khudawadi",
    "Noto Sans Lao",
    "Noto Sans Lepcha",
    "Noto Sans Limbu",
    "Noto Sans Linear A",
    "Noto Sans Linear B",
    "Noto Sans Lisu",
    "Noto Sans Lycian",
    "Noto Sans Lydian",
    "Noto Sans Mahajani",
    "Noto Sans Malayalam",
    "Noto Sans Mandaic",
    "Noto Sans Manichaean",
    "Noto Sans Marchen",
    "Noto Sans Masaram Gondi",
    "Noto Sans Math",
    "Noto Sans Mayan Numerals",
    "Noto Sans Medefaidrin",
    "Noto Sans Meetei Mayek",
    "Noto Sans Meroitic",
    "Noto Sans Miao",
    "Noto Sans Modi",
    "Noto Sans Mongolian",
    "Noto Sans Mono",
    "Noto Sans Mro",
    "Noto Sans Multani",
    "Noto Sans Myanmar",
    "Noto Sans NKo",
    "Noto Sans Nabataean",
    "Noto Sans New Tai Lue",
    "Noto Sans Newa",
    "Noto Sans Nushu",
    "Noto Sans Ogham",
    "Noto Sans Ol Chiki",
    "Noto Sans Old Hungarian",
    "Noto Sans Old Italic",
    "Noto Sans Old North Arabian",
    "Noto Sans Old Permic",
    "Noto Sans Old Persian",
    "Noto Sans Old Sogdian",
    "Noto Sans Old South Arabian",
    "Noto Sans Old Turkic",
    "Noto Sans Oriya",
    "Noto Sans Osage",
    "Noto Sans Osmanya",
    "Noto Sans Pahawh Hmong",
    "Noto Sans Palmyrene",
    "Noto Sans Pau Cin Hau",
    "Noto Sans Phags Pa",
    "Noto Sans Phoenician",
    "Noto Sans Psalter Pahlavi",
    "Noto Sans Rejang",
    "Noto Sans Runic",
    "Noto Sans Samaritan",
    "Noto Sans Saurashtra",
    "Noto Sans Sharada",
    "Noto Sans Shavian",
    "Noto Sans Siddham",
    "Noto Sans Sinhala",
    "Noto Sans Sogdian",
    "Noto Sans Sora Sompeng",
    "Noto Sans Soyombo",
    "Noto Sans Sundanese",
    "Noto Sans Syloti Nagri",
    "Noto Sans Symbols",
    "Noto Sans Symbols 2",
    "Noto Sans Syriac",
    "Noto Sans Tagalog",
    "Noto Sans Tagbanwa",
    "Noto Sans Tai Le",
    "Noto Sans Tai Tham",
    "Noto Sans Tai Viet",
    "Noto Sans Takri",
    "Noto Sans Tamil",
    "Noto Sans Tamil Supplement",
    "Noto Sans Telugu",
    "Noto Sans Thaana",
    "Noto Sans Thai",
    "Noto Sans Tibetan",
    "Noto Sans Tifinagh",
    "Noto Sans Tirhuta",
    "Noto Sans Ugaritic",
    "Noto Sans Vai",
    "Noto Sans Wancho",
    "Noto Sans Warang Citi",
    "Noto Sans Yi",
    "Noto Sans Zanabazar Square",
    "Noto Serif",
    "Noto Serif Ahom",
    "Noto Serif Armenian",
    "Noto Serif Balinese",
    "Noto Serif Bengali",
    "Noto Serif Devanagari",
    "Noto Serif Display",
    "Noto Serif Dogra",
    "Noto Serif Ethiopic",
    "Noto Serif Georgian",
    "Noto Serif Grantha",
    "Noto Serif Gujarati",
    "Noto Serif Gurmukhi",
    "Noto Serif Hebrew",
    "Noto Serif JP",
    "Noto Serif KR",
    "Noto Serif Kannada",
    "Noto Serif Khmer",
    "Noto Serif Lao",
    "Noto Serif Malayalam",
    "Noto Serif Myanmar",
    "Noto Serif Nyiakeng Puachue Hmong",
    "Noto Serif Oriya",
    "Noto Serif SC",
    "Noto Serif Sinhala",
    "Noto Serif TC",
    "Noto Serif Tamil",
    "Noto Serif Telugu",
    "Noto Serif Thai",
    "Noto Serif Tibetan",
    "Noto Serif Yezidi",
    "Nova Cut",
    "Nova Flat",
    "Nova Mono",
    "Nova Oval",
    "Nova Round",
    "Nova Script",
    "Nova Slim",
    "Nova Square",
    "Numans",
    "Nunito",
    "Nunito Sans",
    "Odibee Sans",
    "Odor Mean Chey",
    "Offside",
    "Oi",
    "Old Standard TT",
    "Oldenburg",
    "Oleo Script",
    "Oleo Script Swash Caps",
    "Open Sans",
    "Open Sans Condensed",
    "Oranienbaum",
    "Orbitron",
    "Oregano",
    "Orienta",
    "Original Surfer",
    "Oswald",
    "Over the Rainbow",
    "Overlock",
    "Overlock SC",
    "Overpass",
    "Overpass Mono",
    "Oxanium",
    "Oxygen",
    "Oxygen Mono",
    "PT Mono",
    "PT Sans",
    "PT Sans Caption",
    "PT Sans Narrow",
    "PT Serif",
    "PT Serif Caption",
    "Pacifico",
    "Padauk",
    "Palanquin",
    "Palanquin Dark",
    "Pangolin",
    "Paprika",
    "Parisienne",
    "Passero One",
    "Passion One",
    "Pathway Gothic One",
    "Patrick Hand",
    "Patrick Hand SC",
    "Pattaya",
    "Patua One",
    "Pavanam",
    "Paytone One",
    "Peddana",
    "Peralta",
    "Permanent Marker",
    "Petit Formal Script",
    "Petrona",
    "Philosopher",
    "Piedra",
    "Pinyon Script",
    "Pirata One",
    "Plaster",
    "Play",
    "Playball",
    "Playfair Display",
    "Playfair Display SC",
    "Podkova",
    "Poiret One",
    "Poller One",
    "Poly",
    "Pompiere",
    "Pontano Sans",
    "Poor Story",
    "Poppins",
    "Port Lligat Sans",
    "Port Lligat Slab",
    "Potta One",
    "Pragati Narrow",
    "Prata",
    "Preahvihear",
    "Press Start 2P",
    "Pridi",
    "Princess Sofia",
    "Prociono",
    "Prompt",
    "Prosto One",
    "Proza Libre",
    "Public Sans",
    "Puritan",
    "Purple Purse",
    "Quando",
    "Quantico",
    "Quattrocento",
    "Quattrocento Sans",
    "Questrial",
    "Quicksand",
    "Quintessential",
    "Qwigley",
    "Racing Sans One",
    "Radley",
    "Rajdhani",
    "Rakkas",
    "Raleway",
    "Raleway Dots",
    "Ramabhadra",
    "Ramaraja",
    "Rambla",
    "Rammetto One",
    "Ranchers",
    "Rancho",
    "Ranga",
    "Rasa",
    "Rationale",
    "Ravi Prakash",
    "Recursive",
    "Red Hat Display",
    "Red Hat Text",
    "Red Rose",
    "Redressed",
    "Reem Kufi",
    "Reenie Beanie",
    "Revalia",
    "Rhodium Libre",
    "Ribeye",
    "Ribeye Marrow",
    "Righteous",
    "Risque",
    "Roboto",
    "Roboto Condensed",
    "Roboto Mono",
    "Roboto Slab",
    "Rochester",
    "Rock Salt",
    "Rokkitt",
    "Romanesco",
    "Ropa Sans",
    "Rosario",
    "Rosarivo",
    "Rouge Script",
    "Rowdies",
    "Rozha One",
    "Rubik",
    "Rubik Beastly",
    "Rubik Bubbles",
    "Rubik Burned",
    "Rubik Dirt",
    "Rubik Distressed",
    "Rubik Gemstones",
    "Rubik Glitch",
    "Rubik Iso",
    "Rubik Marker Hatch",
    "Rubik Maze",
    "Rubik Microbe",
    "Rubik Mono One",
    "Rubik Moonrocks",
    "Rubik Puddles",
    "Rubik Spray Paint",
    "Rubik Storm",
    "Rubik Vinyl",
    "Rubik Wet Paint",
    "Ruda",
    "Rufina",
    "Rugelach",
    "Ruluko",
    "Rum Raisin",
    "Ruslan Display",
    "Russo One",
    "Ruthie",
    "Rye",
    "Sacramento",
    "Sahitya",
    "Sail",
    "Saira",
    "Saira Condensed",
    "Saira Extra Condensed",
    "Saira Semi Condensed",
    "Saira Stencil One",
    "Salsa",
    "Sanchez",
    "Sancreek",
    "Sansita",
    "Sansita Swashed",
    "Sarabun",
    "Sarala",
    "Sarina",
    "Sarpanch",
    "Satisfy",
    "Sawarabi Gothic",
    "Sawarabi Mincho",
    "Scada",
    "Scheherazade",
    "Schoolbell",
    "Scope One",
    "Seaweed Script",
    "Secular One",
    "Sedgwick Ave",
    "Sedgwick Ave Display",
    "Sen",
    "Sevillana",
    "Seymour One",
    "Shadows Into Light",
    "Shadows Into Light Two",
    "Shanti",
    "Share",
    "Share Tech",
    "Share Tech Mono",
    "Shojumaru",
    "Short Stack",
    "Shrikhand",
    "Siemreap",
    "Sigmar One",
    "Signika",
    "Signika Negative",
    "Simonetta",
    "Single Day",
    "Sintony",
    "Sirin Stencil",
    "Six Caps",
    "Skranji",
    "Slabo 13px",
    "Slabo 27px",
    "Slackey",
    "Smokum",
    "Smythe",
    "Sniglet",
    "Snippet",
    "Snowburst One",
    "Sofadi One",
    "Sofia",
    "Solway",
    "Song Myung",
    "Sonsie One",
    "Sora",
    "Sorts Mill Goudy",
    "Source Code Pro",
    "Source Sans Pro",
    "Source Serif Pro",
    "Space Grotesk",
    "Space Mono",
    "Spartan",
    "Special Elite",
    "Spectral",
    "Spectral SC",
    "Spicy Rice",
    "Spinnaker",
    "Spirax",
    "Squada One",
    "Sree Krushnadevaraya",
    "Sriracha",
    "Srisakdi",
    "Staatliches",
    "Stalemate",
    "Stalinist One",
    "Stardos Stencil",
    "Stick",
    "Stick No Bills",
    "Stint Ultra Condensed",
    "Stint Ultra Expanded",
    "Stoke",
    "Strait",
    "Stylish",
    "Sue Ellen Francisco",
    "Suez One",
    "Sulphur Point",
    "Sumana",
    "Sunflower",
    "Sunshiney",
    "Supermercado One",
    "Sura",
    "Suranna",
    "Suravaram",
    "Suwannaphum",
    "Swanky and Moo Moo",
    "Syncopate",
    "Syne",
    "Syne Mono",
    "Syne Tactile",
    "Tajawal",
    "Tangerine",
    "Taprom",
    "Tauri",
    "Taviraj",
    "Teko",
    "Telex",
    "Tenali Ramakrishna",
    "Tenor Sans",
    "Text Me One",
    "Thasadith",
    "The Girl Next Door",
    "Tienne",
    "Tillana",
    "Timmana",
    "Tinos",
    "Titan One",
    "Titillium Web",
    "Tomorrow",
    "Trade Winds",
    "Trirong",
    "Trispace",
    "Trocchi",
    "Trochut",
    "Truculenta",
    "Trykker",
    "Tulpen One",
    "Ubuntu",
    "Ubuntu Condensed",
    "Ubuntu Mono",
    "Ultra",
    "Uncial Antiqua",
    "Underdog",
    "Unica One",
    "UnifrakturCook",
    "UnifrakturMaguntia",
    "Unkempt",
    "Unlock",
    "Unna",
    "Urbanist",
    "VT323",
    "Vampiro One",
    "Varela",
    "Varela Round",
    "Varta",
    "Vast Shadow",
    "Vazirmatn",
    "Vesper Libre",
    "Viaoda Libre",
    "Vibes",
    "Vibur",
    "Vidaloka",
    "Viga",
    "Voces",
    "Volkhov",
    "Vollkorn",
    "Vollkorn SC",
    "Voltaire",
    "Waiting for the Sunrise",
    "Wallpoet",
    "Walter Turncoat",
    "Warnes",
    "Wellfleet",
    "Wendy One",
    "Wire One",
    "Work Sans",
    "Xanh Mono",
    "Yanone Kaffeesatz",
    "Yantramanav",
    "Yatra One",
    "Yellowtail",
    "Yeon Sung",
    "Yeseva One",
    "Yesteryear",
    "Yrsa",
    "Yusei Magic",
    "ZCOOL KuaiLe",
    "ZCOOL QingKe HuangYou",
    "ZCOOL XiaoWei",
    "Zen Antique",
    "Zen Antique Soft",
    "Zen Dots",
    "Zen Kaku Gothic Antique",
    "Zen Kaku Gothic New",
    "Zen Kurenaido",
    "Zen Loop",
    "Zen Maru Gothic",
    "Zen Old Mincho",
    "Zen Tokyo Zoo",
    "Zeyada",
    "Zhi Mang Xing",
    "Zilla Slab",
    "Zilla Slab Highlight",
    "Zodiak",
    "Abel",
    "Acme",
    "Actor",
    "Adamina",
    "Advent Pro",
    "Agrandir",
    "Akronim",
    "Aladin",
    "Aldrich",
    "Alef",
    "Alegreya",
    "Alegreya Sans",
    "Alegreya Sans SC",
    "Alegreya SC",
    "Alex Brush",
    "Alfa Slab One",
    "Alice",
    "Alike",
    "Alike Angular",
    "Allan",
    "Allerta",
    "Allerta Stencil",
    "Allura",
    "Almendra",
    "Almendra Display",
    "Almendra SC",
    "Amarante",
    "Amaranth",
    "Amatic SC",
    "Amethysta",
    "Amiko",
    "Amiri",
    "Amita",
    "Anaheim",
    "Andada",
    "Andika",
    "Angkor",
    "Annie Use Your Telescope",
    "Anonymous Pro",
    "Antic",
    "Antic Didone",
    "Antic Slab",
    "Anton",
    "Arapey",
    "Arbutus",
    "Arbutus Slab",
    "Architects Daughter",
    "Archivo",
    "Archivo Black",
    "Archivo Narrow",
    "Arimo",
    "Arizonia",
    "Armata",
    "Arsenal",
    "Artifika",
    "Arvo",
    "Arya",
    "Asap",
    "Asap Condensed",
    "Asar",
    "Asset",
    "Assistant",
    "Astloch",
    "Asul",
    "Athiti",
    "Atma",
    "Atomic Age",
    "Aubrey",
    "Audiowide",
    "Autour One",
    "Average",
    "Average Sans",
    "Averia Gruesa Libre",
    "Averia Libre",
    "Averia Sans Libre",
    "Averia Serif Libre",
    "Bad Script",
    "Bahiana",
    "Baloo",
    "Baloo Bhai",
    "Baloo Bhaijaan",
    "Baloo Bhaina",
    "Baloo Chettan",
    "Baloo Da",
    "Baloo Paaji",
    "Baloo Tamma",
    "Baloo Tammudu",
    "Baloo Thambi",
    "Balsamiq Sans",
    "Balthazar",
    "Bangers",
    "Barrio",
    "Basic",
    "Battambang",
    "Baumans",
    "Bayon",
    "Be Vietnam",
    "Be Vietnam Pro",
    "Beaver",
    "Belgrano",
    "Bellefair",
    "Belleza",
    "BenchNine",
    "Bentham",
    "Berkshire Swash",
    "Bevan",
    "Bigelow Rules",
    "Bigshot One",
    "Bilbo",
    "Bilbo Swash Caps",
    "Bio Rhyme",
    "Bio Rhyme Expanded",
    "Biryani",
    "Bitter",
    "Black And White Picture",
    "Black Han Sans",
    "Black Ops One",
    "Blinker",
    "Bodoni Moda",
    "Bokor",
    "Bonbon",
    "Boogaloo",
    "Bowlby One",
    "Bowlby One SC",
    "Brawler",
    "Bree Serif",
    "Bubblegum Sans",
    "Bubbler One",
    "Buda",
    "Buenard",
    "Bungee",
    "Bungee Hairline",
    "Bungee Inline",
    "Bungee Outline",
    "Bungee Shade",
    "Butcherman",
    "Butterfly Kids",
    "Cabin",
    "Cabin Condensed",
    "Cabin Sketch",
    "Caesar Dressing",
    "Cagliostro",
    "Cairo",
    "Calligraffitti",
    "Cambay",
    "Cambo",
    "Candal",
    "Cantarell",
    "Cantata One",
    "Cantora One",
    "Capriola",
    "Cardo",
    "Carme",
    "Carrois Gothic",
    "Carrois Gothic SC",
    "Carter One",
    "Catamaran",
    "Caudex",
    "Caveat",
    "Caveat Brush",
    "Cedarville Cursive",
    "Ceviche One",
    "Chakra Petch",
    "Changa",
    "Changa One",
    "Chango",
    "Charm",
    "Charmonman",
    "Chathura",
    "Chau Philomene One",
    "Chela One",
    "Chelsea Market",
    "Chenla",
    "Cherry Cream Soda",
    "Cherry Swash",
    "Chewy",
    "Chicle",
    "Chilanka",
    "Chivo",
    "Chonburi",
    "Cinzel",
    "Cinzel Decorative",
    "Cirrus Cumulus",
    "Coda",
    "Coda Caption",
    "Codystar",
    "Coiny",
    "Combo",
    "Comfortaa",
    "Comic Neue",
    "Coming Soon",
    "Concert One",
    "Condiment",
    "Content",
    "Contrail One",
    "Convergence",
    "Cookie",
    "Copse",
    "Corben",
    "Cormorant",
  ];

  const handleLogoUpload = async (file: File): Promise<string | null> => {
    try {
      setUploadingLogo(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `logo.${fileExt}`;
      const filePath = `${organization.id}/${fileName}`;

      // Delete old logo if exists
      if (organization.logo_url) {
        const oldPath = organization.logo_url.split('/').slice(-2).join('/');
        await supabase.storage.from('org-logos').remove([oldPath]);
      }

      const { error: uploadError } = await supabase.storage
        .from('org-logos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('org-logos')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload Error",
        description: error.message || "Failed to upload logo.",
      });
      return null;
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleBackgroundImageUpload = async (file: File): Promise<string | null> => {
    try {
      setUploadingBackgroundImage(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `background.${fileExt}`;
      const filePath = `${organization.id}/${fileName}`;

      // Delete old background image if exists
      if (organization.background_image_url) {
        const oldPath = organization.background_image_url.split('/').slice(-2).join('/');
        await supabase.storage.from('org-backgrounds').remove([oldPath]);
      }

      const { error: uploadError } = await supabase.storage
        .from('org-backgrounds')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('org-backgrounds')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload Error",
        description: error.message || "Failed to upload background image.",
      });
      return null;
    } finally {
      setUploadingBackgroundImage(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      let finalLogoUrl = logoUrl;
      let finalBackgroundImageUrl = backgroundImageUrl;

      if (logoFile) {
        const uploadedUrl = await handleLogoUpload(logoFile);
        if (!uploadedUrl) {
          setIsLoading(false);
          return;
        }
        finalLogoUrl = uploadedUrl;
      }

      if (backgroundImageFile) {
        const uploadedUrl = await handleBackgroundImageUpload(backgroundImageFile);
        if (!uploadedUrl) {
          setIsLoading(false);
          return;
        }
        finalBackgroundImageUrl = uploadedUrl;
      }

      const { error } = await supabase
        .from("organizations")
        .update({
          logo_url: finalLogoUrl || null,
          background_image_url: finalBackgroundImageUrl || null,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          font_family: fontFamily,
          require_login: requireLogin,
          description: description || null,
          // custom_content: customContent || null,
          use_knowsy_topics: useKnowsyTopics,
          enable_popup: enablePopup,
          popup_description: popupDescription || null,
        })
        .eq("id", organization.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Branding updated successfully.",
      });

      setLogoFile(null);
      setBackgroundImageFile(null);
      onUpdate();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update branding.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customize Your Branding</CardTitle>
        <CardDescription>
          Update your organization's visual identity and settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="logo">Organization Logo</Label>
          <div className="flex items-center gap-4">
            <Input
              id="logo"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setLogoFile(file);
                  setLogoUrl(URL.createObjectURL(file));
                }
              }}
              className="flex-1"
            />
            {logoUrl && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  setLogoUrl("");
                  setLogoFile(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {logoUrl && (
            <div className="mt-2 p-4 border rounded-lg bg-muted/50">
              <img src={logoUrl} alt="Logo preview" className="h-20 object-contain" />
            </div>
          )}
          {logoFile && (
            <p className="text-sm text-muted-foreground">
              Selected: {logoFile.name}
            </p>
          )}
          {uploadingLogo && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              Uploading logo...
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="background-image">Background Image</Label>
          <div className="flex items-center gap-4">
            <Input
              id="background-image"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setBackgroundImageFile(file);
                  setBackgroundImageUrl(URL.createObjectURL(file));
                }
              }}
              className="flex-1"
            />
            {backgroundImageUrl && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  setBackgroundImageUrl("");
                  setBackgroundImageFile(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {backgroundImageUrl && (
            <div className="mt-2 p-4 border rounded-lg bg-muted/50">
              <img src={backgroundImageUrl} alt="Background preview" className="h-48 w-full object-contain rounded border" />
            </div>
          )}
          {backgroundImageFile && (
            <p className="text-sm text-muted-foreground">
              Selected: {backgroundImageFile.name}
            </p>
          )}
          {uploadingBackgroundImage && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              Uploading background image...
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Brief description of your organization..."
            value={description}
            onChange={(e) => {
              const value = e.target.value;
              if (value.length <= 250) {
                setDescription(value);
              }
            }}
            rows={3}
          />
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              A short description of your organization
            </p>
            <p className="text-sm text-muted-foreground">
              {description.length}/250 characters
            </p>
          </div>
        </div>

        {/* <div className="space-y-2">
          <Label htmlFor="custom-content">Custom Content</Label>
          <Textarea
            id="custom-content"
            placeholder="Welcome message or description for your organization page..."
            value={customContent}
            onChange={(e) => {
              const value = e.target.value;
              if (value.length <= 250) {
                setCustomContent(value);
              }
            }}
            rows={4}
          />
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              This content will be displayed on your organization's game pages
            </p>
            <p className="text-sm text-muted-foreground">
              {customContent.length}/250 characters
            </p>
          </div>
        </div> */}


        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="primary-color">Primary Color</Label>
            <div className="flex gap-2">
              <Input
                id="primary-color"
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-20 h-10"
              />
              <Input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                placeholder="#1EAEDB"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondary-color">Secondary Color</Label>
            <div className="flex gap-2">
              <Input
                id="secondary-color"
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="w-20 h-10"
              />
              <Input
                type="text"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                placeholder="#33C3F0"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="font">Font Family</Label>
          <div className="relative">
            <Input
              id="font"
              type="text"
              placeholder="Roboto"
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              onFocus={() => setFontOpen(true)}
              onBlur={() => setTimeout(() => setFontOpen(false), 200)}
            />
            {fontOpen && fontFamily && (
              <div className="absolute top-full left-0 right-0 z-10 bg-popover border rounded-md shadow-md max-h-60 overflow-auto">
                {googleFonts
                  .filter(font => font.toLowerCase().includes(fontFamily.toLowerCase()))
                  .slice(0, 10)
                  .map((font) => (
                    <div
                      key={font}
                      className="px-3 py-2 hover:bg-accent cursor-pointer"
                      onMouseDown={() => {
                        setFontFamily(font);
                        setFontOpen(false);
                      }}
                    >
                      {font}
                    </div>
                  ))}
                {googleFonts.filter(font => font.toLowerCase().includes(fontFamily.toLowerCase())).length === 0 && (
                  <div className="px-3 py-2 text-muted-foreground">No fonts found</div>
                )}
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Use Google Fonts names (e.g., Roboto, Open Sans, Montserrat)
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="require-login">Require Login</Label>
            <p className="text-sm text-muted-foreground">
              Players must sign in to join games
            </p>
          </div>
          <Switch
            id="require-login"
            checked={requireLogin}
            onCheckedChange={setRequireLogin}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="use-knowsy-topics">Use Knowsy Topics</Label>
            <p className="text-sm text-muted-foreground">
              Allow players to select from Knowsy's default topics in addition to your custom topics
            </p>
          </div>
          <Switch
            id="use-knowsy-topics"
            checked={useKnowsyTopics}
            onCheckedChange={setUseKnowsyTopics}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="enable-popup">Enable Pop-up</Label>
            <p className="text-sm text-muted-foreground">
              Display pop-up notifications during organizational game sessions
            </p>
          </div>
          <Switch
            id="enable-popup"
            checked={enablePopup}
            onCheckedChange={setEnablePopup}
          />
        </div>

        {enablePopup && (
          <div className="space-y-2">
            <Label htmlFor="popup-description">Pop-up Message</Label>
            <ReactQuill
              key={organization.popup_description}
              defaultValue={popupDescription}
              onChange={(content) => setPopupDescription(content)}
              modules={modules}
              formats={formats}
              theme="snow"
            />
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                This message will be displayed as a toast notification
              </p>
            </div>
          </div>
        )}

        <Button onClick={handleSave} disabled={isLoading || uploadingLogo || uploadingBackgroundImage} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Save Branding
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default OrganizationBranding;