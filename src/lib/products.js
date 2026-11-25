// ── ALL PRODUCTS (50 items) ───────────────────────────────────
export const BASE_PRODUCTS = [
  // ── PENS ──
  { id: 1, name: 'Cello Blue Ball Pen', price: 5, mrp: 7, category: 'pen', emoji: '🖊️', badge: 'Best Seller', rating: 4.5, reviews: 2341, stock: 50, image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=500&auto=format&fit=crop&q=80', tags: ['pen','ball pen','cello','blue'], desc: 'Cello ki smooth writing ball pen. Student aur office dono ke liye perfect.', features: ['Smooth ink flow','Comfortable grip','1500m ink','Daily writing'] },
  { id: 2, name: 'Reynolds Black Gel Pen', price: 10, mrp: 15, category: 'pen', emoji: '🖊️', badge: 'Popular', rating: 4.4, reviews: 1876, stock: 35, image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=500&auto=format&fit=crop&q=80', tags: ['pen','gel pen','reynolds','black'], desc: 'Reynolds ki premium gel pen. Smooth writing, no smearing.', features: ['Waterproof gel ink','No smearing','0.5mm tip','Exam friendly'] },
  { id: 3, name: 'Red Ballpoint Pen (5 Pack)', price: 25, mrp: 35, category: 'pen', emoji: '🖊️', badge: 'Value Pack', rating: 4.2, reviews: 654, stock: 20, image: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=500&auto=format&fit=crop&q=80', tags: ['pen','red pen','pack','teacher'], desc: 'Teachers ke liye best. 5 pens ka value pack.', features: ['5 pens pack','Bright red ink','Smooth writing','Durable'] },
  { id: 4, name: 'Sketch Pens 12 Colors', price: 35, mrp: 50, category: 'pen', emoji: '🖍️', badge: 'Kids Fav', rating: 4.5, reviews: 1200, stock: 40, image: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=500&auto=format&fit=crop&q=80', tags: ['sketch pen','color pen','art','kids'], desc: '12 vibrant sketch pens. Art class ke liye.', features: ['12 colors','Non-toxic','Fine tip','Washable'] },
  { id: 5, name: 'Ink Fountain Pen', price: 45, mrp: 60, category: 'pen', emoji: '✒️', badge: 'Premium', rating: 4.3, reviews: 432, stock: 15, image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=500&auto=format&fit=crop&q=80', tags: ['fountain pen','calligraphy','premium'], desc: 'Classic fountain pen for calligraphy aur formal writing.', features: ['Refillable cartridge','Smooth nib','Classic design','All sizes'] },

  // ── PENCILS & ERASERS ──
  { id: 6, name: 'Natraj HB Pencil (12 Pack)', price: 30, mrp: 40, category: 'pencil', emoji: '✏️', badge: 'Best Value', rating: 4.6, reviews: 3201, stock: 40, image: 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=500&auto=format&fit=crop&q=80', tags: ['pencil','hb','natraj','pack','school'], desc: 'Natraj HB pencils. School exams ke liye best.', features: ['12 pencils','HB grade','Strong lead','Easy sharpening'] },
  { id: 7, name: 'Camlin Mechanical Pencil 0.5mm', price: 40, mrp: 55, category: 'pencil', emoji: '✏️', badge: 'New', rating: 4.4, reviews: 876, stock: 25, image: 'https://images.unsplash.com/photo-1569683795645-b62e50fbf103?w=500&auto=format&fit=crop&q=80', tags: ['mechanical pencil','engineering','0.5mm'], desc: 'Mechanical pencil for engineering drawing.', features: ['0.5mm precision','Never sharpened','Refillable','Metal grip'] },
  { id: 8, name: 'Apsara HB Pencil (10 Pack)', price: 20, mrp: 28, category: 'pencil', emoji: '✏️', rating: 4.5, reviews: 2100, stock: 60, image: 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=500&auto=format&fit=crop&q=80', tags: ['apsara','pencil','hb','school'], desc: 'Apsara smooth writing pencils.', features: ['10 pack','HB lead','Pre-sharpened','Smooth'] },
  { id: 9, name: 'Apsara Eraser (3 Pack)', price: 12, mrp: 15, category: 'pencil', emoji: '⬜', rating: 4.5, reviews: 1234, stock: 60, image: 'https://images.unsplash.com/photo-1589782182703-2aaa69037b5b?w=500&auto=format&fit=crop&q=80', tags: ['eraser','rubber','apsara'], desc: 'Clean eraser, paper ko damage nahi karta.', features: ['Dust-free','No tear','Soft','3 pieces'] },
  { id: 48, name: 'Drawing Pencil Set 12 Grades', price: 60, mrp: 85, category: 'pencil', emoji: '✏️', badge: 'Artist Set', rating: 4.7, reviews: 1100, stock: 18, image: 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=500&auto=format&fit=crop&q=80', tags: ['drawing pencil','sketch','12 grades','artist'], desc: '12 grade pencils 6H to 6B for professional sketching.', features: ['12 pencils 6H–6B','Professional','Sketching','Wooden barrel'] },

  // ── NOTEBOOKS ──
  { id: 10, name: 'Notebook 200 Pages Single Line', price: 55, mrp: 70, category: 'notebook', emoji: '📓', badge: 'Popular', rating: 4.3, reviews: 2109, stock: 30, image: 'https://m.media-amazon.com/images/I/71VxWwbdwmL._SX679_.jpg', tags: ['notebook','ruled','school','college'], desc: '200 page thick notebook for school aur college.', features: ['200 pages','A4 size','Smooth','Durable cover'] },
  { id: 11, name: 'Spiral Notebook A5 160 Pages', price: 60, mrp: 85, category: 'notebook', emoji: '📒', badge: 'Trending', rating: 4.5, reviews: 1543, stock: 20, image: 'https://m.media-amazon.com/images/I/41ZJMlWq4pL.jpg', tags: ['spiral notebook','a5','college'], desc: 'Spiral binding, lay-flat design.', features: ['Spiral binding','A5 size','Lay-flat','Perforated'] },
  { id: 12, name: 'Register 200 Pages Long Size', price: 40, mrp: 55, category: 'notebook', emoji: '📔', rating: 4.2, reviews: 876, stock: 45, image: 'https://m.media-amazon.com/images/I/51xrj4YJbSL._SX679_.jpg', tags: ['register','long size','accounts'], desc: 'Long size register for school aur accounts.', features: ['200 pages','Long format','Hardbound','Double ruled'] },
  { id: 13, name: 'Drawing Book A3 32 Sheets', price: 35, mrp: 50, category: 'notebook', emoji: '🎨', badge: 'Art', rating: 4.4, reviews: 654, stock: 18, image: 'https://m.media-amazon.com/images/I/51q5YMsniAL._SX679_.jpg', tags: ['drawing book','a3','art','sketch'], desc: '150 GSM drawing book for watercolor aur sketch.', features: ['150 GSM','A3 size','Smooth','No bleed'] },
  { id: 50, name: 'Diary / Planner 365 Pages', price: 75, mrp: 100, category: 'notebook', emoji: '📅', badge: 'New', rating: 4.6, reviews: 543, stock: 20, image: 'https://m.media-amazon.com/images/I/71VxWwbdwmL._SX679_.jpg', tags: ['diary','planner','daily','yearly'], desc: '365-page daily planner diary.', features: ['365 pages','Goal setting','Premium cover','Ribbon bookmark'] },

  // ── FILES & FOLDERS ──
  { id: 14, name: 'Clear Plastic Exam File', price: 20, mrp: 30, category: 'file', emoji: '📁', badge: 'Must Have', rating: 4.4, reviews: 3421, stock: 80, image: 'https://m.media-amazon.com/images/I/51pS0f4D3ML._SX679_.jpg', tags: ['file','exam file','transparent'], desc: 'Transparent file for exam documents.', features: ['Clear design','Waterproof','Locking','A4 size'] },
  { id: 15, name: 'L-Shape Folder (5 Pack)', price: 35, mrp: 50, category: 'file', emoji: '📂', rating: 4.3, reviews: 876, stock: 40, image: 'https://m.media-amazon.com/images/I/41VQyj4VxhL._SX679_.jpg', tags: ['folder','l-shape','assignment'], desc: 'L-shape transparent folders for assignments.', features: ['5 pieces','L-shape','Clear','Strong edge'] },
  { id: 16, name: 'Office Document Organizer', price: 120, mrp: 160, category: 'file', emoji: '🗂️', badge: 'Premium', rating: 4.6, reviews: 1234, stock: 12, image: 'https://m.media-amazon.com/images/I/41bh6FDDL7L._SX679_.jpg', tags: ['organizer','12 pocket','monthly'], desc: '12 pocket organizer for monthly documents.', features: ['12 pockets','Labels','Hardcover','Handle'] },
  { id: 17, name: 'Binder Clip (12 Pack)', price: 25, mrp: 35, category: 'file', emoji: '📎', rating: 4.3, reviews: 540, stock: 50, image: 'https://m.media-amazon.com/images/I/51pS0f4D3ML._SX679_.jpg', tags: ['binder clip','paper','office'], desc: 'Strong binder clips, assorted sizes.', features: ['12 clips','3 sizes','Strong grip','Rust-resistant'] },

  // ── MARKERS ──
  { id: 18, name: 'Classmate Highlighter (5 Colors)', price: 55, mrp: 75, category: 'marker', emoji: '🖌️', badge: 'Best Seller', rating: 4.7, reviews: 2876, stock: 35, image: 'https://m.media-amazon.com/images/I/71kPJcXKijL._SX679_.jpg', tags: ['highlighter','marker','5 colors','notes'], desc: '5 vibrant highlighters. Notes ke liye must have.', features: ['5 bright colors','Chisel tip','Quick-dry','No bleed'] },
  { id: 19, name: 'Whiteboard Marker (4 Colors)', price: 60, mrp: 80, category: 'marker', emoji: '✍️', rating: 4.5, reviews: 1432, stock: 20, image: 'https://m.media-amazon.com/images/I/61sUQzovGML._SX679_.jpg', tags: ['whiteboard marker','teacher','board'], desc: 'Easy erase whiteboard markers.', features: ['4 colors','Easy erase','Low-odour','24hr cap-off'] },
  { id: 20, name: 'Permanent Marker Black', price: 20, mrp: 28, category: 'marker', emoji: '🖊️', rating: 4.3, reviews: 987, stock: 30, image: 'https://m.media-amazon.com/images/I/41yUB-OWEML.jpg', tags: ['permanent marker','waterproof','black'], desc: 'Waterproof permanent marker for all surfaces.', features: ['Waterproof','All surfaces','Bold lines','Quick-dry'] },

  // ── COLORS & ART ──
  { id: 21, name: 'Camlin Wax Crayons 24 Shades', price: 55, mrp: 75, category: 'colors', emoji: '🖍️', badge: 'Kids Fav', rating: 4.8, reviews: 4321, stock: 40, image: 'https://m.media-amazon.com/images/I/81j7U2WNFNL._SX679_.jpg', tags: ['crayons','24 colors','kids','drawing'], desc: '24 vibrant wax crayons. Non-toxic, kids ke liye safe.', features: ['24 shades','Non-toxic','Strong wax','Bright'] },
  { id: 22, name: 'Faber-Castell Color Pencils 24', price: 85, mrp: 120, category: 'colors', emoji: '🎨', badge: 'Premium', rating: 4.9, reviews: 5678, stock: 22, image: 'https://m.media-amazon.com/images/I/81r+qKHJBNL._SX679_.jpg', tags: ['color pencils','faber castell','24 colors','art'], desc: 'World-famous Faber-Castell color pencils.', features: ['24 rich shades','Soft core','Pre-sharpened','Break-resistant'] },
  { id: 23, name: 'Camel Water Colors 12 Shades', price: 45, mrp: 65, category: 'colors', emoji: '🎨', badge: 'Art Class', rating: 4.5, reviews: 2134, stock: 28, image: 'https://m.media-amazon.com/images/I/61DuY1E4KRL._SX679_.jpg', tags: ['watercolor','12 colors','art','painting'], desc: 'Camel watercolors for smooth blending.', features: ['12 shades','Water-activated','Refillable','Kid-safe'] },
  { id: 24, name: 'Poster Color Set 6 Shades', price: 65, mrp: 90, category: 'colors', emoji: '🖌️', rating: 4.4, reviews: 876, stock: 20, image: 'https://m.media-amazon.com/images/I/61H4mAi8koL._SX679_.jpg', tags: ['poster color','6 colors','charts'], desc: 'Bold poster colors for charts aur projects.', features: ['6 shades','High pigment','Fast drying','For charts'] },
  { id: 25, name: 'Oil Pastels 25 Colors', price: 50, mrp: 70, category: 'colors', emoji: '🖍️', rating: 4.4, reviews: 760, stock: 25, image: 'https://m.media-amazon.com/images/I/81j7U2WNFNL._SX679_.jpg', tags: ['oil pastels','25 colors','art','blending'], desc: 'Smooth oil pastels for art projects.', features: ['25 colors','Easy blending','Non-toxic','All surfaces'] },

  // ── TAPES ──
  { id: 26, name: 'Cello Tape (3 Pack)', price: 25, mrp: 35, category: 'tape', emoji: '📦', badge: 'Value Pack', rating: 4.4, reviews: 1876, stock: 50, image: 'https://m.media-amazon.com/images/I/51Wfsy6H4lL._SX679_.jpg', tags: ['cello tape','transparent','packing'], desc: 'Clear tape for packing aur crafting.', features: ['3 rolls','Strong adhesive','Clear','40m each'] },
  { id: 27, name: 'Brown Packing Tape 50m', price: 35, mrp: 50, category: 'tape', emoji: '📦', rating: 4.3, reviews: 654, stock: 25, image: 'https://m.media-amazon.com/images/I/619AEO5U6XL._SX679_.jpg', tags: ['packing tape','brown tape','50m'], desc: 'Heavy-duty brown tape for parcels.', features: ['50 meters','Extra strong','Heat resistant','2 inch'] },
  { id: 28, name: 'Double-Sided Tape 15mm', price: 20, mrp: 28, category: 'tape', emoji: '📦', rating: 4.2, reviews: 430, stock: 35, image: 'https://m.media-amazon.com/images/I/51Wfsy6H4lL._SX679_.jpg', tags: ['double sided tape','craft','mounting'], desc: 'Double-sided tape for craft aur mounting.', features: ['Double-sided','Invisible','Craft & mounting','10m'] },

  // ── PAPER ──
  { id: 29, name: 'A4 White Paper 500 Sheets', price: 180, mrp: 220, category: 'paper', emoji: '📄', badge: 'Office Essential', rating: 4.6, reviews: 5432, stock: 30, image: 'https://m.media-amazon.com/images/I/71nnBgLtPiL._SX679_.jpg', tags: ['a4 paper','printer paper','500 sheets','70gsm'], desc: '70 GSM A4 paper for printer aur handwriting.', features: ['500 sheets','70 GSM','Jam-free','Bright white'] },
  { id: 30, name: 'Colored Paper A4 (50 Sheets)', price: 40, mrp: 55, category: 'paper', emoji: '📄', badge: 'Craft', rating: 4.3, reviews: 876, stock: 40, image: 'https://m.media-amazon.com/images/I/71T4VDdxStL._SX679_.jpg', tags: ['colored paper','craft','origami','a4'], desc: '5 color A4 paper for craft projects.', features: ['5 colors','50 sheets','80 GSM','Printable'] },
  { id: 31, name: 'Graph Paper (5 Sheets)', price: 25, mrp: 35, category: 'paper', emoji: '📊', rating: 4.3, reviews: 320, stock: 40, image: 'https://m.media-amazon.com/images/I/71T4VDdxStL._SX679_.jpg', tags: ['graph paper','engineering','maths'], desc: '1mm grid graph paper for engineering aur maths.', features: ['1mm grid','A4 size','80 GSM','Engineering'] },

  // ── GLUE & ADHESIVE ──
  { id: 32, name: 'Fevicol Glue Tube 15g', price: 10, mrp: 15, category: 'glue', emoji: '🔧', badge: 'Must Have', rating: 4.7, reviews: 6543, stock: 100, image: 'https://m.media-amazon.com/images/I/61S8bLzQ6QL._SX679_.jpg', tags: ['fevicol','glue','adhesive','craft'], desc: 'Fevicol – India ka sabse famous glue.', features: ['Strong bond','Dries clear','Non-toxic','15g'] },
  { id: 33, name: 'Glue Stick 20g (3 Pack)', price: 30, mrp: 45, category: 'glue', emoji: '🔧', rating: 4.5, reviews: 2134, stock: 40, image: 'https://m.media-amazon.com/images/I/61P6IQYD39L._SX679_.jpg', tags: ['glue stick','mess-free','kids'], desc: 'Mess-free glue stick. Kids ke liye best.', features: ['3 sticks','No mess','Dries clear','Washable'] },
  { id: 34, name: 'Fevikwik Instant Adhesive', price: 15, mrp: 22, category: 'glue', emoji: '🔧', rating: 4.6, reviews: 1200, stock: 50, image: 'https://m.media-amazon.com/images/I/61S8bLzQ6QL._SX679_.jpg', tags: ['fevikwik','super glue','instant'], desc: 'Instant bonding adhesive for all surfaces.', features: ['Instant bond','2g tube','Strong','Multi-surface'] },

  // ── SCISSORS ──
  { id: 35, name: 'Student Scissors 7 inch', price: 25, mrp: 35, category: 'scissors', emoji: '✂️', rating: 4.4, reviews: 1234, stock: 30, image: 'https://m.media-amazon.com/images/I/51Nw+bHH2nL._SX679_.jpg', tags: ['scissors','student','7 inch'], desc: 'Sharp stainless steel scissors for students.', features: ['Stainless steel','Comfortable grip','7 inch','Multi-purpose'] },
  { id: 36, name: 'Craft Scissors Zigzag', price: 40, mrp: 55, category: 'scissors', emoji: '✂️', badge: 'Craft', rating: 4.2, reviews: 543, stock: 15, image: 'https://m.media-amazon.com/images/I/51KHGpP-kQL._SX679_.jpg', tags: ['craft scissors','zigzag','decorative'], desc: 'Decorative zigzag scissors for craft.', features: ['Zigzag pattern','Stainless steel','Light cardboard','Rounded tips'] },

  // ── BAGS ──
  { id: 37, name: 'School Bag 30L Waterproof', price: 350, mrp: 500, category: 'bag', emoji: '🎒', badge: 'Best Seller', rating: 4.6, reviews: 3421, stock: 12, image: 'https://m.media-amazon.com/images/I/61V3A03BKSL._SX679_.jpg', tags: ['school bag','backpack','30l','waterproof','laptop'], desc: '30L waterproof school bag with multiple compartments.', features: ['30L capacity','Waterproof','Padded straps','Laptop pocket','Multiple pockets'] },
  { id: 38, name: 'Pencil Pouch Canvas Zipper', price: 60, mrp: 85, category: 'bag', emoji: '👝', badge: 'Popular', rating: 4.5, reviews: 2109, stock: 25, image: 'https://m.media-amazon.com/images/I/61S9t3QnBxL._SX679_.jpg', tags: ['pencil pouch','canvas','zipper'], desc: 'Durable canvas pencil pouch with multiple pockets.', features: ['Canvas material','Double zip','Multiple pockets','Lightweight'] },
  { id: 39, name: 'Water Bottle 750ml Steel', price: 160, mrp: 220, category: 'bag', emoji: '🍶', rating: 4.6, reviews: 2000, stock: 20, image: 'https://m.media-amazon.com/images/I/61V3A03BKSL._SX679_.jpg', tags: ['water bottle','steel','750ml','school'], desc: 'Insulated steel bottle for school. Keeps water cold 12hr.', features: ['750ml','Double wall insulated','Leak-proof','BPA-free'] },
  { id: 49, name: 'Lunch Box Stainless Steel', price: 180, mrp: 250, category: 'bag', emoji: '🍱', badge: 'Durable', rating: 4.7, reviews: 1800, stock: 15, image: 'https://m.media-amazon.com/images/I/61V3A03BKSL._SX679_.jpg', tags: ['lunch box','tiffin','steel','school'], desc: 'Stainless steel leak-proof lunch box.', features: ['Steel body','Leak-proof lid','3 compartments','Dishwasher safe'] },

  // ── BOXES & ORGANIZERS ──
  { id: 40, name: 'Plastic Pencil Box Multicolor', price: 45, mrp: 65, category: 'box', emoji: '🗃️', badge: 'Kids Fav', rating: 4.4, reviews: 1876, stock: 30, image: 'https://m.media-amazon.com/images/I/51y0B+2H9xL._SX679_.jpg', tags: ['pencil box','plastic','double layer'], desc: 'Hard plastic pencil box with double layer tray.', features: ['Double layer','Strong latch','Sliding tray','5 colors'] },
  { id: 41, name: 'Desk Organizer 5-in-1', price: 120, mrp: 180, category: 'box', emoji: '🗂️', badge: 'Study Essential', rating: 4.5, reviews: 987, stock: 18, image: 'https://m.media-amazon.com/images/I/51y0B+2H9xL._SX679_.jpg', tags: ['desk organizer','pen holder','study desk'], desc: '5-in-1 desk organizer for pens, files, mobile.', features: ['5 compartments','Easy assembly','Sturdy','Modern'] },

  // ── STICKY NOTES ──
  { id: 42, name: 'Sticky Notes 3×3 (5 Color Pads)', price: 35, mrp: 50, category: 'sticky', emoji: '📌', badge: 'Office Fav', rating: 4.6, reviews: 2341, stock: 40, image: 'https://m.media-amazon.com/images/I/71wDIoTJSnL._SX679_.jpg', tags: ['sticky notes','post it','5 colors','100 sheets'], desc: '5 color sticky note pads, 100 sheets each.', features: ['5 colors','100 sheets each','Strong adhesive','Repositionable'] },

  // ── EXTRAS / STATIONERY ──
  { id: 43, name: 'Scientific Calculator 12-Digit', price: 150, mrp: 220, category: 'extra', emoji: '🧮', badge: 'Exam Essential', rating: 4.7, reviews: 4312, stock: 15, image: 'https://m.media-amazon.com/images/I/71SrxJaKJLL._SX679_.jpg', tags: ['calculator','scientific','exam','solar'], desc: '12-digit scientific calculator, board exam approved.', features: ['12-digit','Scientific functions','Solar+battery','Exam approved'] },
  { id: 44, name: 'Geometry Box Set 8 Pieces', price: 80, mrp: 110, category: 'extra', emoji: '📐', badge: 'Must Have', rating: 4.5, reviews: 3201, stock: 20, image: 'https://m.media-amazon.com/images/I/61E1wkXU3ML._SX679_.jpg', tags: ['geometry box','compass','protractor','maths'], desc: '8-piece geometry set for maths exams.', features: ['8 instruments','Metal compass','Protractor + set squares','Hard case'] },
  { id: 45, name: 'Ruler 30cm Transparent', price: 10, mrp: 15, category: 'extra', emoji: '📏', rating: 4.3, reviews: 987, stock: 60, image: 'https://m.media-amazon.com/images/I/51o+K3j7ZiL._SX679_.jpg', tags: ['ruler','30cm','scale'], desc: '30cm transparent shatterproof ruler.', features: ['30cm','Clear body','cm & inch','Anti-slip'] },
  { id: 46, name: 'Metal Sharpener Double Hole', price: 8, mrp: 12, category: 'extra', emoji: '🔑', rating: 4.2, reviews: 765, stock: 80, image: 'https://m.media-amazon.com/images/I/41Ni-jHXjnL.jpg', tags: ['sharpener','double hole','metal'], desc: 'Double hole metal sharpener for regular aur jumbo pencils.', features: ['Double hole','Metal body','Sharp blade','Standard + jumbo'] },
  { id: 47, name: 'Correction Pen / Whitener', price: 15, mrp: 20, category: 'extra', emoji: '🖊️', badge: 'Office Must', rating: 4.4, reviews: 1432, stock: 40, image: 'https://m.media-amazon.com/images/I/41WLr0cgpjL._SX679_.jpg', tags: ['whitener','correction pen','quick dry'], desc: 'Quick-dry whitener correction pen.', features: ['Quick-dry','Fine tip','All paper','No clumping'] },
];

// ── SEARCH SYNONYMS (Hindi + English) ───────────────────────
export const SYNONYMS = {
  'kalam': 'pen', 'qalam': 'pen',
  'pensil': 'pencil',
  'copy': 'notebook', 'copies': 'notebook', 'khata': 'notebook', 'kitab': 'notebook',
  'rang': 'colors', 'color': 'colors', 'colour': 'colors', 'rangeen': 'colors',
  'kaenchi': 'scissors', 'kaichi': 'scissors', 'kainchi': 'scissors',
  'gum': 'glue',
  'scale': 'ruler',
  'mitao': 'pencil', 'rubber': 'pencil',
  'tiffin': 'bag', 'dabba': 'bag', 'lunch': 'bag', 'backpack': 'bag', 'pouch': 'bag',
  'post': 'sticky', 'note': 'sticky',
  'kagaz': 'paper', 'sheet': 'paper',
  'calc': 'extra', 'calculator': 'extra',
  'compass': 'extra', 'geometry': 'extra',
  'whitener': 'extra', 'correction': 'extra',
  'folder': 'file',
  'sketch': 'pencil', 'drawing': 'colors', 'art': 'colors',
  'highlighter': 'marker', 'board': 'marker',
  'register': 'notebook', 'diary': 'notebook', 'planner': 'notebook',
};

// ── PRODUCT HELPERS ──────────────────────────────────────────
let _cachedMergedProducts = null;

export function deduplicateProducts(list) {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  const result = [];
  for (const item of list) {
    if (!item) continue;
    const key = String(item.id ?? item._id ?? '');
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

export function setCachedProducts(products) {
  if (!Array.isArray(products)) return;
  const deduped = deduplicateProducts(products);
  _cachedMergedProducts = deduped;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('ggsCachedServerProducts', JSON.stringify(deduped));
      window.dispatchEvent(new CustomEvent('ggsProductsUpdated', { detail: deduped }));
    } catch {}
  }
}

let _lastClientSyncTime = 0;
const CLIENT_SYNC_THROTTLE_MS = 30000; // Throttle to max 1 sync every 30s during active navigation

export async function syncProductsFromServer(force = false) {
  const now = Date.now();
  if (!force && _cachedMergedProducts && (now - _lastClientSyncTime < CLIENT_SYNC_THROTTLE_MS)) {
    return _cachedMergedProducts;
  }
  _lastClientSyncTime = now;

  try {
    const res = await fetch('/api/products?t=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.ok && Array.isArray(data.products)) {
      const deduped = deduplicateProducts(data.products);
      setCachedProducts(deduped);
      if (typeof window !== 'undefined' && data.rawStore) {
        try {
          if (data.rawStore.overrides) localStorage.setItem('ggsProductOverrides', JSON.stringify(data.rawStore.overrides));
          if (data.rawStore.customs) localStorage.setItem('ggsCustomProducts', JSON.stringify(data.rawStore.customs));
          if (data.rawStore.stocks) localStorage.setItem('ggsStock', JSON.stringify(data.rawStore.stocks));
          if (data.rawStore.availability) localStorage.setItem('ggsAvailability', JSON.stringify(data.rawStore.availability));
          if (data.rawStore.images) localStorage.setItem('ggsProductImages', JSON.stringify(data.rawStore.images));
          if (data.rawStore.deleted) localStorage.setItem('ggsDeletedProducts', JSON.stringify(data.rawStore.deleted));
        } catch {}
      }
      return deduped;
    }
  } catch (err) {
    console.warn('syncProductsFromServer failed:', err?.message);
  }
  return null;
}

export function getMergedProducts() {
  if (_cachedMergedProducts && _cachedMergedProducts.length > 0) {
    return _cachedMergedProducts;
  }

  if (typeof window === 'undefined') return deduplicateProducts(BASE_PRODUCTS);

  try {
    const cached = localStorage.getItem('ggsCachedServerProducts');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const deduped = deduplicateProducts(parsed);
        _cachedMergedProducts = deduped;
        return deduped;
      }
    }
  } catch {}

  try {
    const overrides = JSON.parse(localStorage.getItem('ggsProductOverrides') || '{}');
    const customs   = JSON.parse(localStorage.getItem('ggsCustomProducts')   || '[]');
    const stocks    = JSON.parse(localStorage.getItem('ggsStock')             || '{}');
    const avails    = JSON.parse(localStorage.getItem('ggsAvailability')      || '{}');
    const images    = JSON.parse(localStorage.getItem('ggsProductImages')     || '{}');
    const deleted   = JSON.parse(localStorage.getItem('ggsDeletedProducts')   || '[]');

    const existingIds = new Set();

    const merged = BASE_PRODUCTS
      .filter(p => !deleted.includes(p.id))
      .map(p => {
        existingIds.add(String(p.id));
        const ov  = overrides[p.id] || {};
        const img = images[p.id] || ov.image || p.image;
        const stk = stocks[p.id] !== undefined ? stocks[p.id] : p.stock;
        const avl = avails[p.id] !== undefined ? avails[p.id] : true;
        const base = { ...p, ...ov, image: img, stock: stk };
        if (!avl) base._hidden = true;
        return base;
      })
      .filter(p => !p._hidden);

    customs.forEach(cp => {
      if (deleted.includes(cp.id)) return;
      if (existingIds.has(String(cp.id))) return;
      existingIds.add(String(cp.id));
      const avl = avails[cp.id] !== undefined ? avails[cp.id] : true;
      if (!avl) return;
      merged.push({
        ...cp,
        image: images[cp.id] || cp.image,
        stock: stocks[cp.id] !== undefined ? stocks[cp.id] : (cp.stock || 0),
        tags: cp.tags || [cp.name.toLowerCase(), cp.category],
        features: cp.features || [],
        rating: cp.rating || 4.0,
        reviews: cp.reviews || 0,
      });
    });

    const finalMerged = deduplicateProducts(merged);
    _cachedMergedProducts = finalMerged;
    return finalMerged;
  } catch {
    return deduplicateProducts(BASE_PRODUCTS);
  }
}


export const CATEGORY_FALLBACK_IMAGES = {
  pen: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400&auto=format&fit=crop&q=80',
  pencil: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400&auto=format&fit=crop&q=80',
  notebook: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80',
  file: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&auto=format&fit=crop&q=80',
  marker: 'https://images.unsplash.com/photo-1569683795645-b62e50fbf103?w=400&auto=format&fit=crop&q=80',
  colors: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&auto=format&fit=crop&q=80',
  tape: 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?w=400&auto=format&fit=crop&q=80',
  paper: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80',
  glue: 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?w=400&auto=format&fit=crop&q=80',
  scissors: 'https://images.unsplash.com/photo-1503792501406-2c40da09e1e2?w=400&auto=format&fit=crop&q=80',
  bag: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&auto=format&fit=crop&q=80',
  box: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&auto=format&fit=crop&q=80',
  sticky: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400&auto=format&fit=crop&q=80',
  extra: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400&auto=format&fit=crop&q=80',
};

export function getProductFallbackImage(name = '', category = '') {
  const n = String(name || '').toLowerCase();
  const c = String(category || '').toLowerCase();
  if (n.includes('fountain') || n.includes('ink')) {
    return 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400&auto=format&fit=crop&q=80';
  }
  if (n.includes('pencil') || n.includes('eraser') || n.includes('sharpener')) {
    return 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400&auto=format&fit=crop&q=80';
  }
  if (n.includes('notebook') || n.includes('register') || n.includes('diary') || n.includes('book')) {
    return 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80';
  }
  if (n.includes('color') || n.includes('crayon') || n.includes('pastel') || n.includes('sketch')) {
    return 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&auto=format&fit=crop&q=80';
  }
  if (n.includes('scissor')) {
    return 'https://images.unsplash.com/photo-1503792501406-2c40da09e1e2?w=400&auto=format&fit=crop&q=80';
  }
  if (n.includes('bag') || n.includes('bottle') || n.includes('lunch')) {
    return 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&auto=format&fit=crop&q=80';
  }
  if (n.includes('sticky') || n.includes('note')) {
    return 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400&auto=format&fit=crop&q=80';
  }
  if (n.includes('pen') || n.includes('ballpoint') || n.includes('gel')) {
    return 'https://images.unsplash.com/photo-1569683795645-b62e50fbf103?w=400&auto=format&fit=crop&q=80';
  }
  return CATEGORY_FALLBACK_IMAGES[c] || CATEGORY_FALLBACK_IMAGES.pen;
}
