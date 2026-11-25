
UPDATE public.products
SET product_data = '{"mrp":7,"emoji":"🖊️","badge":"Best Seller","rating":4.5,"reviews":2341,"tags":["pen","ball pen","cello","blue"],"features":["Smooth ink flow","Comfortable grip","1500m ink","Daily writing"]}'::jsonb
WHERE legacy_mongo_id = '1'
  AND name = 'Cello Blue Ball Pen';


UPDATE public.products
SET product_data = '{"mrp":15,"emoji":"🖊️","badge":"Popular","rating":4.4,"reviews":1876,"tags":["pen","gel pen","reynolds","black"],"features":["Waterproof gel ink","No smearing","0.5mm tip","Exam friendly"]}'::jsonb
WHERE legacy_mongo_id = '2'
  AND name = 'Reynolds Black Gel Pen';


UPDATE public.products
SET product_data = '{"mrp":35,"emoji":"🖊️","badge":"Value Pack","rating":4.2,"reviews":654,"tags":["pen","red pen","pack","teacher"],"features":["5 pens pack","Bright red ink","Smooth writing","Durable"]}'::jsonb
WHERE legacy_mongo_id = '3'
  AND name = 'Red Ballpoint Pen (5 Pack)';


UPDATE public.products
SET product_data = '{"mrp":50,"emoji":"🖍️","badge":"Kids Fav","rating":4.5,"reviews":1200,"tags":["sketch pen","color pen","art","kids"],"features":["12 colors","Non-toxic","Fine tip","Washable"]}'::jsonb
WHERE legacy_mongo_id = '4'
  AND name = 'Sketch Pens 12 Colors';


UPDATE public.products
SET product_data = '{"mrp":60,"emoji":"✒️","badge":"Premium","rating":4.3,"reviews":432,"tags":["fountain pen","calligraphy","premium"],"features":["Refillable cartridge","Smooth nib","Classic design","All sizes"]}'::jsonb
WHERE legacy_mongo_id = '5'
  AND name = 'Ink Fountain Pen';


UPDATE public.products
SET product_data = '{"mrp":40,"emoji":"✏️","badge":"Best Value","rating":4.6,"reviews":3201,"tags":["pencil","hb","natraj","pack","school"],"features":["12 pencils","HB grade","Strong lead","Easy sharpening"]}'::jsonb
WHERE legacy_mongo_id = '6'
  AND name = 'Natraj HB Pencil (12 Pack)';


UPDATE public.products
SET product_data = '{"mrp":55,"emoji":"✏️","badge":"New","rating":4.4,"reviews":876,"tags":["mechanical pencil","engineering","0.5mm"],"features":["0.5mm precision","Never sharpened","Refillable","Metal grip"]}'::jsonb
WHERE legacy_mongo_id = '7'
  AND name = 'Camlin Mechanical Pencil 0.5mm';


UPDATE public.products
SET product_data = '{"mrp":28,"emoji":"✏️","badge":"","rating":4.5,"reviews":2100,"tags":["apsara","pencil","hb","school"],"features":["10 pack","HB lead","Pre-sharpened","Smooth"]}'::jsonb
WHERE legacy_mongo_id = '8'
  AND name = 'Apsara HB Pencil (10 Pack)';


UPDATE public.products
SET product_data = '{"mrp":15,"emoji":"⬜","badge":"","rating":4.5,"reviews":1234,"tags":["eraser","rubber","apsara"],"features":["Dust-free","No tear","Soft","3 pieces"]}'::jsonb
WHERE legacy_mongo_id = '9'
  AND name = 'Apsara Eraser (3 Pack)';


UPDATE public.products
SET product_data = '{"mrp":85,"emoji":"✏️","badge":"Artist Set","rating":4.7,"reviews":1100,"tags":["drawing pencil","sketch","12 grades","artist"],"features":["12 pencils 6H–6B","Professional","Sketching","Wooden barrel"]}'::jsonb
WHERE legacy_mongo_id = '48'
  AND name = 'Drawing Pencil Set 12 Grades';


UPDATE public.products
SET product_data = '{"mrp":70,"emoji":"📓","badge":"Popular","rating":4.3,"reviews":2109,"tags":["notebook","ruled","school","college"],"features":["200 pages","A4 size","Smooth","Durable cover"]}'::jsonb
WHERE legacy_mongo_id = '10'
  AND name = 'Notebook 200 Pages Single Line';


UPDATE public.products
SET product_data = '{"mrp":85,"emoji":"📒","badge":"Trending","rating":4.5,"reviews":1543,"tags":["spiral notebook","a5","college"],"features":["Spiral binding","A5 size","Lay-flat","Perforated"]}'::jsonb
WHERE legacy_mongo_id = '11'
  AND name = 'Spiral Notebook A5 160 Pages';


UPDATE public.products
SET product_data = '{"mrp":55,"emoji":"📔","badge":"","rating":4.2,"reviews":876,"tags":["register","long size","accounts"],"features":["200 pages","Long format","Hardbound","Double ruled"]}'::jsonb
WHERE legacy_mongo_id = '12'
  AND name = 'Register 200 Pages Long Size';


UPDATE public.products
SET product_data = '{"mrp":50,"emoji":"🎨","badge":"Art","rating":4.4,"reviews":654,"tags":["drawing book","a3","art","sketch"],"features":["150 GSM","A3 size","Smooth","No bleed"]}'::jsonb
WHERE legacy_mongo_id = '13'
  AND name = 'Drawing Book A3 32 Sheets';


UPDATE public.products
SET product_data = '{"mrp":100,"emoji":"📅","badge":"New","rating":4.6,"reviews":543,"tags":["diary","planner","daily","yearly"],"features":["365 pages","Goal setting","Premium cover","Ribbon bookmark"]}'::jsonb
WHERE legacy_mongo_id = '50'
  AND name = 'Diary / Planner 365 Pages';


UPDATE public.products
SET product_data = '{"mrp":30,"emoji":"📁","badge":"Must Have","rating":4.4,"reviews":3421,"tags":["file","exam file","transparent"],"features":["Clear design","Waterproof","Locking","A4 size"]}'::jsonb
WHERE legacy_mongo_id = '14'
  AND name = 'Clear Plastic Exam File';


UPDATE public.products
SET product_data = '{"mrp":50,"emoji":"📂","badge":"","rating":4.3,"reviews":876,"tags":["folder","l-shape","assignment"],"features":["5 pieces","L-shape","Clear","Strong edge"]}'::jsonb
WHERE legacy_mongo_id = '15'
  AND name = 'L-Shape Folder (5 Pack)';


UPDATE public.products
SET product_data = '{"mrp":160,"emoji":"🗂️","badge":"Premium","rating":4.6,"reviews":1234,"tags":["organizer","12 pocket","monthly"],"features":["12 pockets","Labels","Hardcover","Handle"]}'::jsonb
WHERE legacy_mongo_id = '16'
  AND name = 'Office Document Organizer';


UPDATE public.products
SET product_data = '{"mrp":35,"emoji":"📎","badge":"","rating":4.3,"reviews":540,"tags":["binder clip","paper","office"],"features":["12 clips","3 sizes","Strong grip","Rust-resistant"]}'::jsonb
WHERE legacy_mongo_id = '17'
  AND name = 'Binder Clip (12 Pack)';


UPDATE public.products
SET product_data = '{"mrp":75,"emoji":"🖌️","badge":"Best Seller","rating":4.7,"reviews":2876,"tags":["highlighter","marker","5 colors","notes"],"features":["5 bright colors","Chisel tip","Quick-dry","No bleed"]}'::jsonb
WHERE legacy_mongo_id = '18'
  AND name = 'Classmate Highlighter (5 Colors)';


UPDATE public.products
SET product_data = '{"mrp":80,"emoji":"✍️","badge":"","rating":4.5,"reviews":1432,"tags":["whiteboard marker","teacher","board"],"features":["4 colors","Easy erase","Low-odour","24hr cap-off"]}'::jsonb
WHERE legacy_mongo_id = '19'
  AND name = 'Whiteboard Marker (4 Colors)';


UPDATE public.products
SET product_data = '{"mrp":28,"emoji":"🖊️","badge":"","rating":4.3,"reviews":987,"tags":["permanent marker","waterproof","black"],"features":["Waterproof","All surfaces","Bold lines","Quick-dry"]}'::jsonb
WHERE legacy_mongo_id = '20'
  AND name = 'Permanent Marker Black';


UPDATE public.products
SET product_data = '{"mrp":75,"emoji":"🖍️","badge":"Kids Fav","rating":4.8,"reviews":4321,"tags":["crayons","24 colors","kids","drawing"],"features":["24 shades","Non-toxic","Strong wax","Bright"]}'::jsonb
WHERE legacy_mongo_id = '21'
  AND name = 'Camlin Wax Crayons 24 Shades';


UPDATE public.products
SET product_data = '{"mrp":120,"emoji":"🎨","badge":"Premium","rating":4.9,"reviews":5678,"tags":["color pencils","faber castell","24 colors","art"],"features":["24 rich shades","Soft core","Pre-sharpened","Break-resistant"]}'::jsonb
WHERE legacy_mongo_id = '22'
  AND name = 'Faber-Castell Color Pencils 24';


UPDATE public.products
SET product_data = '{"mrp":65,"emoji":"🎨","badge":"Art Class","rating":4.5,"reviews":2134,"tags":["watercolor","12 colors","art","painting"],"features":["12 shades","Water-activated","Refillable","Kid-safe"]}'::jsonb
WHERE legacy_mongo_id = '23'
  AND name = 'Camel Water Colors 12 Shades';


UPDATE public.products
SET product_data = '{"mrp":90,"emoji":"🖌️","badge":"","rating":4.4,"reviews":876,"tags":["poster color","6 colors","charts"],"features":["6 shades","High pigment","Fast drying","For charts"]}'::jsonb
WHERE legacy_mongo_id = '24'
  AND name = 'Poster Color Set 6 Shades';


UPDATE public.products
SET product_data = '{"mrp":70,"emoji":"🖍️","badge":"","rating":4.4,"reviews":760,"tags":["oil pastels","25 colors","art","blending"],"features":["25 colors","Easy blending","Non-toxic","All surfaces"]}'::jsonb
WHERE legacy_mongo_id = '25'
  AND name = 'Oil Pastels 25 Colors';


UPDATE public.products
SET product_data = '{"mrp":35,"emoji":"📦","badge":"Value Pack","rating":4.4,"reviews":1876,"tags":["cello tape","transparent","packing"],"features":["3 rolls","Strong adhesive","Clear","40m each"]}'::jsonb
WHERE legacy_mongo_id = '26'
  AND name = 'Cello Tape (3 Pack)';


UPDATE public.products
SET product_data = '{"mrp":50,"emoji":"📦","badge":"","rating":4.3,"reviews":654,"tags":["packing tape","brown tape","50m"],"features":["50 meters","Extra strong","Heat resistant","2 inch"]}'::jsonb
WHERE legacy_mongo_id = '27'
  AND name = 'Brown Packing Tape 50m';


UPDATE public.products
SET product_data = '{"mrp":28,"emoji":"📦","badge":"","rating":4.2,"reviews":430,"tags":["double sided tape","craft","mounting"],"features":["Double-sided","Invisible","Craft & mounting","10m"]}'::jsonb
WHERE legacy_mongo_id = '28'
  AND name = 'Double-Sided Tape 15mm';


UPDATE public.products
SET product_data = '{"mrp":220,"emoji":"📄","badge":"Office Essential","rating":4.6,"reviews":5432,"tags":["a4 paper","printer paper","500 sheets","70gsm"],"features":["500 sheets","70 GSM","Jam-free","Bright white"]}'::jsonb
WHERE legacy_mongo_id = '29'
  AND name = 'A4 White Paper 500 Sheets';


UPDATE public.products
SET product_data = '{"mrp":55,"emoji":"📄","badge":"Craft","rating":4.3,"reviews":876,"tags":["colored paper","craft","origami","a4"],"features":["5 colors","50 sheets","80 GSM","Printable"]}'::jsonb
WHERE legacy_mongo_id = '30'
  AND name = 'Colored Paper A4 (50 Sheets)';


UPDATE public.products
SET product_data = '{"mrp":35,"emoji":"📊","badge":"","rating":4.3,"reviews":320,"tags":["graph paper","engineering","maths"],"features":["1mm grid","A4 size","80 GSM","Engineering"]}'::jsonb
WHERE legacy_mongo_id = '31'
  AND name = 'Graph Paper (5 Sheets)';


UPDATE public.products
SET product_data = '{"mrp":15,"emoji":"🔧","badge":"Must Have","rating":4.7,"reviews":6543,"tags":["fevicol","glue","adhesive","craft"],"features":["Strong bond","Dries clear","Non-toxic","15g"]}'::jsonb
WHERE legacy_mongo_id = '32'
  AND name = 'Fevicol Glue Tube 15g';


UPDATE public.products
SET product_data = '{"mrp":45,"emoji":"🔧","badge":"","rating":4.5,"reviews":2134,"tags":["glue stick","mess-free","kids"],"features":["3 sticks","No mess","Dries clear","Washable"]}'::jsonb
WHERE legacy_mongo_id = '33'
  AND name = 'Glue Stick 20g (3 Pack)';


UPDATE public.products
SET product_data = '{"mrp":22,"emoji":"🔧","badge":"","rating":4.6,"reviews":1200,"tags":["fevikwik","super glue","instant"],"features":["Instant bond","2g tube","Strong","Multi-surface"]}'::jsonb
WHERE legacy_mongo_id = '34'
  AND name = 'Fevikwik Instant Adhesive';


UPDATE public.products
SET product_data = '{"mrp":35,"emoji":"✂️","badge":"","rating":4.4,"reviews":1234,"tags":["scissors","student","7 inch"],"features":["Stainless steel","Comfortable grip","7 inch","Multi-purpose"]}'::jsonb
WHERE legacy_mongo_id = '35'
  AND name = 'Student Scissors 7 inch';


UPDATE public.products
SET product_data = '{"mrp":55,"emoji":"✂️","badge":"Craft","rating":4.2,"reviews":543,"tags":["craft scissors","zigzag","decorative"],"features":["Zigzag pattern","Stainless steel","Light cardboard","Rounded tips"]}'::jsonb
WHERE legacy_mongo_id = '36'
  AND name = 'Craft Scissors Zigzag';


UPDATE public.products
SET product_data = '{"mrp":500,"emoji":"🎒","badge":"Best Seller","rating":4.6,"reviews":3421,"tags":["school bag","backpack","30l","waterproof","laptop"],"features":["30L capacity","Waterproof","Padded straps","Laptop pocket","Multiple pockets"]}'::jsonb
WHERE legacy_mongo_id = '37'
  AND name = 'School Bag 30L Waterproof';


UPDATE public.products
SET product_data = '{"mrp":85,"emoji":"👝","badge":"Popular","rating":4.5,"reviews":2109,"tags":["pencil pouch","canvas","zipper"],"features":["Canvas material","Double zip","Multiple pockets","Lightweight"]}'::jsonb
WHERE legacy_mongo_id = '38'
  AND name = 'Pencil Pouch Canvas Zipper';


UPDATE public.products
SET product_data = '{"mrp":220,"emoji":"🍶","badge":"","rating":4.6,"reviews":2000,"tags":["water bottle","steel","750ml","school"],"features":["750ml","Double wall insulated","Leak-proof","BPA-free"]}'::jsonb
WHERE legacy_mongo_id = '39'
  AND name = 'Water Bottle 750ml Steel';


UPDATE public.products
SET product_data = '{"mrp":250,"emoji":"🍱","badge":"Durable","rating":4.7,"reviews":1800,"tags":["lunch box","tiffin","steel","school"],"features":["Steel body","Leak-proof lid","3 compartments","Dishwasher safe"]}'::jsonb
WHERE legacy_mongo_id = '49'
  AND name = 'Lunch Box Stainless Steel';


UPDATE public.products
SET product_data = '{"mrp":65,"emoji":"🗃️","badge":"Kids Fav","rating":4.4,"reviews":1876,"tags":["pencil box","plastic","double layer"],"features":["Double layer","Strong latch","Sliding tray","5 colors"]}'::jsonb
WHERE legacy_mongo_id = '40'
  AND name = 'Plastic Pencil Box Multicolor';


UPDATE public.products
SET product_data = '{"mrp":180,"emoji":"🗂️","badge":"Study Essential","rating":4.5,"reviews":987,"tags":["desk organizer","pen holder","study desk"],"features":["5 compartments","Easy assembly","Sturdy","Modern"]}'::jsonb
WHERE legacy_mongo_id = '41'
  AND name = 'Desk Organizer 5-in-1';


UPDATE public.products
SET product_data = '{"mrp":50,"emoji":"📌","badge":"Office Fav","rating":4.6,"reviews":2341,"tags":["sticky notes","post it","5 colors","100 sheets"],"features":["5 colors","100 sheets each","Strong adhesive","Repositionable"]}'::jsonb
WHERE legacy_mongo_id = '42'
  AND name = 'Sticky Notes 3×3 (5 Color Pads)';


UPDATE public.products
SET product_data = '{"mrp":220,"emoji":"🧮","badge":"Exam Essential","rating":4.7,"reviews":4312,"tags":["calculator","scientific","exam","solar"],"features":["12-digit","Scientific functions","Solar+battery","Exam approved"]}'::jsonb
WHERE legacy_mongo_id = '43'
  AND name = 'Scientific Calculator 12-Digit';


UPDATE public.products
SET product_data = '{"mrp":110,"emoji":"📐","badge":"Must Have","rating":4.5,"reviews":3201,"tags":["geometry box","compass","protractor","maths"],"features":["8 instruments","Metal compass","Protractor + set squares","Hard case"]}'::jsonb
WHERE legacy_mongo_id = '44'
  AND name = 'Geometry Box Set 8 Pieces';


UPDATE public.products
SET product_data = '{"mrp":15,"emoji":"📏","badge":"","rating":4.3,"reviews":987,"tags":["ruler","30cm","scale"],"features":["30cm","Clear body","cm & inch","Anti-slip"]}'::jsonb
WHERE legacy_mongo_id = '45'
  AND name = 'Ruler 30cm Transparent';


UPDATE public.products
SET product_data = '{"mrp":12,"emoji":"🔑","badge":"","rating":4.2,"reviews":765,"tags":["sharpener","double hole","metal"],"features":["Double hole","Metal body","Sharp blade","Standard + jumbo"]}'::jsonb
WHERE legacy_mongo_id = '46'
  AND name = 'Metal Sharpener Double Hole';


UPDATE public.products
SET product_data = '{"mrp":20,"emoji":"🖊️","badge":"Office Must","rating":4.4,"reviews":1432,"tags":["whitener","correction pen","quick dry"],"features":["Quick-dry","Fine tip","All paper","No clumping"]}'::jsonb
WHERE legacy_mongo_id = '47'
  AND name = 'Correction Pen / Whitener';
