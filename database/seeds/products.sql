
INSERT INTO public.products
  (id, legacy_mongo_id, name, description, price, category,
   stock_quantity, image_url, is_available, created_at, updated_at)
SELECT
  gen_random_uuid(), '1', 'Cello Blue Ball Pen', 'Cello ki smooth writing ball pen. Student aur office dono ke liye perfect.', 5,
  'pen', 50, 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=500&auto=format&fit=crop&q=80', true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.products
  WHERE legacy_mongo_id = '1'
);

INSERT INTO public.products
  (id, legacy_mongo_id, name, description, price, category,
   stock_quantity, image_url, is_available, created_at, updated_at)
SELECT
  gen_random_uuid(), '2', 'Reynolds Black Gel Pen', 'Reynolds ki premium gel pen. Smooth writing, no smearing.', 10,
  'pen', 35, 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=500&auto=format&fit=crop&q=80', true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.products
  WHERE legacy_mongo_id = '2'
);

INSERT INTO public.products
  (id, legacy_mongo_id, name, description, price, category,
   stock_quantity, image_url, is_available, created_at, updated_at)
SELECT
  gen_random_uuid(), '3', 'Red Ballpoint Pen (5 Pack)', 'Teachers ke liye best. 5 pens ka value pack.', 25,
  'pen', 20, 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=500&auto=format&fit=crop&q=80', true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.products
  WHERE legacy_mongo_id = '3'
);

INSERT INTO public.products
  (id, legacy_mongo_id, name, description, price, category,
   stock_quantity, image_url, is_available, created_at, updated_at)
SELECT
  gen_random_uuid(), '4', 'Sketch Pens 12 Colors', '12 vibrant sketch pens. Art class ke liye.', 35,
  'pen', 40, 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=500&auto=format&fit=crop&q=80', true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.products
  WHERE legacy_mongo_id = '4'
);

INSERT INTO public.products
  (id, legacy_mongo_id, name, description, price, category,
   stock_quantity, image_url, is_available, created_at, updated_at)
SELECT
  gen_random_uuid(), '5', 'Ink Fountain Pen', 'Classic fountain pen for calligraphy aur formal writing.', 45,
  'pen', 15, 'https://m.media-amazon.com/images/I/51Mh8tX8VPL._SX679_.jpg', true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.products
  WHERE legacy_mongo_id = '5'
);

INSERT INTO public.products
  (id, legacy_mongo_id, name, description, price, category,
   stock_quantity, image_url, is_available, created_at, updated_at)
SELECT
  gen_random_uuid(), '6', 'Natraj HB Pencil (12 Pack)', 'Natraj HB pencils. School exams ke liye best.', 30,
  'pencil', 40, 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=500&auto=format&fit=crop&q=80', true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.products
  WHERE legacy_mongo_id = '6'
);

INSERT INTO public.products
  (id, legacy_mongo_id, name, description, price, category,
   stock_quantity, image_url, is_available, created_at, updated_at)
SELECT
  gen_random_uuid(), '7', 'Camlin Mechanical Pencil 0.5mm', 'Mechanical pencil for engineering drawing.', 40,
  'pencil', 25, 'https://images.unsplash.com/photo-1569683795645-b62e50fbf103?w=500&auto=format&fit=crop&q=80', true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.products
  WHERE legacy_mongo_id = '7'
);

INSERT INTO public.products
  (id, legacy_mongo_id, name, description, price, category,
   stock_quantity, image_url, is_available, created_at, updated_at)
SELECT
  gen_random_uuid(), '8', 'Apsara HB Pencil (10 Pack)', 'Apsara smooth writing pencils.', 20,
  'pencil', 60, 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=500&auto=format&fit=crop&q=80', true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.products
  WHERE legacy_mongo_id = '8'
);

INSERT INTO public.products
  (id, legacy_mongo_id, name, description, price, category,
   stock_quantity, image_url, is_available, created_at, updated_at)
SELECT
  gen_random_uuid(), '9', 'Apsara Eraser (3 Pack)', 'Clean eraser, paper ko damage nahi karta.', 12,
  'pencil', 60, 'https://images.unsplash.com/photo-1589782182703-2aaa69037b5b?w=500&auto=format&fit=crop&q=80', true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.products
  WHERE legacy_mongo_id = '9'
);

INSERT INTO public.products
  (id, legacy_mongo_id, name, description, price, category,
   stock_quantity, image_url, is_available, created_at, updated_at)
SELECT
  gen_random_uuid(), '48', 'Drawing Pencil Set 12 Grades', '12 grade pencils 6H to 6B for professional sketching.', 60,
  'pencil', 18, 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=500&auto=format&fit=crop&q=80', true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.products
  WHERE legacy_mongo_id = '48'
);

INSERT INTO public.products
  (id, legacy_mongo_id, name, description, price, category,
   stock_quantity, image_url, is_available, created_at, updated_at)
SELECT
  gen_random_uuid(), '10', 'Notebook 200 Pages Single Line', '200 page thick notebook for school aur college.', 55,
  'notebook', 30, 'https://m.media-amazon.com/images/I/71VxWwbdwmL._SX679_.jpg', true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.products
  WHERE legacy_mongo_id = '10'
);

INSERT INTO public.products
  (id, legacy_mongo_id, name, description, price, category,
   stock_quantity, image_url, is_available, created_at, updated_at)
SELECT
  gen_random_uuid(), '11', 'Spiral Notebook A5 160 Pages', 'Spiral binding, lay-flat design.', 60,
  'notebook', 20, 'https://m.media-amazon.com/images/I/41ZJMlWq4pL.jpg', true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.products
  WHERE legacy_mongo_id = '11'
);

INSERT INTO public.products
  (id, legacy_mongo_id, name, description, price, category,
   stock_quantity, image_url, is_available, created_at, updated_at)
SELECT
  gen_random_uuid(), '12', 'Register 200 Pages Long Size', 'Long size register for school aur accounts.', 40,
  'notebook', 45, 'https://m.media-amazon.com/images/I/51xrj4YJbSL._SX679_.jpg', true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.products
  WHERE legacy_mongo_id = '12'
);

INSERT INTO public.products
  (id, legacy_mongo_id, name, description, price, category,
   stock_quantity, image_url, is_available, created_at, updated_at)
SELECT
  gen_random_uuid(), '13', 'Drawing Book A3 32 Sheets', '150 GSM drawing book for watercolor aur sketch.', 35,
  'notebook', 18, 'https://m.media-amazon.com/images/I/51q5YMsniAL._SX679_.jpg', true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.products
  WHERE legacy_mongo_id = '13'
);

INSERT INTO public.products
  (id, legacy_mongo_id, name, description, price, category,
   stock_quantity, image_url, is_available, created_at, updated_at)
SELECT
  gen_random_uuid(), '50', 'Diary / Planner 365 Pages', '365-page daily planner diary.', 75,
  'notebook', 20, 'https://m.media-amazon.com/images/I/71VxWwbdwmL._SX679_.jpg', true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.products
  WHERE legacy_mongo_id = '50'
);

INSERT INTO public.products
  (id, legacy_mongo_id, name, description, price, category,
   stock_quantity, image_url, is_available, created_at, updated_at)
SELECT
  gen_random_uuid(), '14', 'Clear Plastic Exam File', 'Transparent file for exam documents.', 20,
  'file', 80, 'https://m.media-amazon.com/images/I/51pS0f4D3ML._SX679_.jpg', true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.products
  WHERE legacy_mongo_id = '14'
);

INSERT INTO public.products
  (id, legacy_mongo_id, name, description, price, category,
   stock_quantity, image_url, is_available, created_at, updated_at)
SELECT
  gen_random_uuid(), '15', 'L-Shape Folder (5 Pack)', 'L-shape transparent folders for assignments.', 35,
  'file', 40, 'https://m.media-amazon.com/images/I/41VQyj4VxhL._SX679_.jpg', true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.products
  WHERE legacy_mongo_id = '15'
);

INSERT INTO public.products
  (id, legacy_mongo_id, name, description, price, category,
   stock_quantity, image_url, is_available, created_at, updated_at)
SELECT
  gen_random_uuid(), '16', 'Office Document Organizer', '12 pocket organizer for monthly documents.', 120,
  'file', 12, 'https://m.media-amazon.com/images/I/41bh6FDDL7L._SX679_.jpg', true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.products
  WHERE legacy_mongo_id = '16'
);

INSERT INTO public.products
  (id, legacy_mongo_id, name, description, price, category,
   stock_quantity, image_url, is_available, created_at, updated_at)
SELECT
  gen_random_uuid(), '17', 'Binder Clip (12 Pack)', 'Strong binder clips, assorted sizes.', 25,
  'file', 50, 'https://m.media-amazon.com/images/I/51pS0f4D3ML._SX679_.jpg', true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.products
  WHERE legacy_mongo_id = '17'
);

INSERT INTO public.products
  (id, legacy_mongo_id, name, description, price, category,
   stock_quantity, image_url, is_available, created_at, updated_at)
SELECT
  gen_random_uuid(), '18', 'Classmate Highlighter (5 Colors)', '5 vibrant highlighters. Notes ke liye must have.', 55,
  'marker', 35, 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=500&auto=format&fit=crop&q=80', true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.products
  WHERE legacy_mongo_id = '18'
);

INSERT INTO public.products
  (id, legacy_mongo_id, name, description, price, category,
   stock_quantity, image_url, is_available, created_at, updated_at)
SELECT
  gen_random_uuid(), '19', 'Whiteboard Marker (4 Colors)', 'Easy erase whiteboard markers.', 60,
  'marker', 20, 'https://m.media-amazon.com/images/I/61sUQzovGML._SX679_.jpg', true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.products
  WHERE legacy_mongo_id = '19'
);

INSERT INTO public.products
  (id, legacy_mongo_id, name, description, price, category,
   stock_quantity, image_url, is_available, created_at, updated_at)
SELECT
  gen_random_uuid(), '20', 'Permanent Marker Black', 'Waterproof permanent marker for all surfaces.', 20,
  'marker', 30, 'https://m.media-amazon.com/images/I/41yUB-OWEML.jpg', true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.products
  WHERE legacy_mongo_id = '20'
);

INSERT INTO public.products
  (id, legacy_mongo_id, name, description, price, category,
   stock_quantity, image_url, is_available, created_at, updated_at)
SELECT
  gen_random_uuid(), '21', 'Camlin Wax Crayons 24 Shades', '24 vibrant wax crayons. Non-toxic, kids ke liye safe.', 55,
  'colors', 40, 'https://m.media-amazon.com/images/I/81j7U2WNFNL._SX679_.jpg', true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.products
  WHERE legacy_mongo_id = '21'
);

INSERT INTO public.products
  (id, legacy_mongo_id, name, description, price, category,
   stock_quantity, image_url, is_available, created_at, updated_at)
SELECT
  gen_random_uuid(), '22', 'Faber-Castell Color Pencils 24', 'World-famous Faber-Castell color pencils.', 85,
  'colors', 22, 'https://m.media-amazon.com/images/I/81r+qKHJBNL._SX679_.jpg', true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.products
  WHERE legacy_mongo_id = '22'
);

INSERT INTO public.products
  (id, legacy_mongo_id, name, description, price, category,
   stock_quantity, image_url, is_available, created_at, updated_at)
SELECT
  gen_random_uuid(), '23', 'Camel Water Colors 12 Shades', 'Camel watercolors for smooth blending.', 45,
  'colors', 28, 'https://m.media-amazon.com/images/I/61DuY1E4KRL._SX679_.jpg', true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.products
  WHERE legacy_mongo_id = '23'
);

INSERT INTO public.products
  (id, legacy_mongo_id, name, description, price, category,
   stock_quantity, image_url, is_available, created_at, updated_at)
SELECT
  gen_random_uuid(), '24', 'Poster Color Set 6 Shades', 'Bold poster colors for charts aur projects.', 65,
  'colors', 20, 'https://m.media-amazon.com/images/I/61H4mAi8koL._SX679_.jpg', true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.products
  WHERE legacy_mongo_id = '24'
);

INSERT INTO public.products
  (id, legacy_mongo_id, name, description, price, category,
   stock_quantity, image_url, is_available, created_at, updated_at)
SELECT
  gen_random_uuid(), '25', 'Oil Pastels 25 Colors', 'Smooth oil pastels for art projects.', 50,
  'colors', 25, 'https://m.media-amazon.com/images/I/81j7U2WNFNL._SX679_.jpg', true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.products
  WHERE legacy_mongo_id = '25'
);

INSERT INTO public.products
  (id, legacy_mongo_id, name, description, price, category,
   stock_quantity, image_url, is_available, created_at, updated_at)
SELECT
  gen_random_uuid(), '26', 'Cello Tape (3 Pack)', 'Clear tape for packing aur crafting.', 25,
  'tape', 50, 'https://m.media-amazon.com/images/I/51Wfsy6H4lL._SX679_.jpg', true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.products
  WHERE legacy_mongo_id = '26'
);

INSERT INTO public.products
  (id, legacy_mongo_id, name, description, price, category,
   stock_quantity, image_url, is_available, created_at, updated_at)
SELECT
  gen_random_uuid(), '27', 'Brown Packing Tape 50m', 'Heavy-duty brown tape for parcels.', 35,
  'tape', 25, 'https://m.media-amazon.com/images/I/619AEO5U6XL._SX679_.jpg', true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.products
  WHERE legacy_mongo_id = '27'
);

INSERT INTO public.products
  (id, legacy_mongo_id, name, description, price, category,
   stock_quantity, image_url, is_available, created_at, updated_at)
SELECT
  gen_random_uuid(), '28', 'Double-Sided Tape 15mm', 'Double-sided tape for craft aur mounting.', 20,
  'tape', 35, 'https://m.media-amazon.com/images/I/51Wfsy6H4lL._SX679_.jpg', true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.products
  WHERE legacy_mongo_id = '28'
);

INSERT INTO public.products
  (id, legacy_mongo_id, name, description, price, category,
   stock_quantity, image_url, is_available, created_at, updated_at)
SELECT
  gen_random_uuid(), '29', 'A4 White Paper 500 Sheets', '70 GSM A4 paper for printer aur handwriting.', 180,
  'paper', 30, NULL, true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.products
  WHERE legacy_mongo_id = '29'
);

INSERT INTO public.products
  (id, legacy_mongo_id, name, description, price, category,
   stock_quantity, image_url, is_available, created_at, updated_at)
SELECT
  gen_random_uuid(), '30', 'Colored Paper A4 (50 Sheets)', '5 color A4 paper for craft projects.', 40,
  'paper', 40, 'https://m.media-amazon.com/images/I/71T4VDdxStL._SX679_.jpg', true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.products
  WHERE legacy_mongo_id = '30'
);

INSERT INTO public.products
  (id, legacy_mongo_id, name, description, price, category,
   stock_quantity, image_url, is_available, created_at, updated_at)
SELECT
  gen_random_uuid(), '31', 'Graph Paper (5 Sheets)', '1mm grid graph paper for engineering aur maths.', 25,
  'paper', 40, 'https://m.media-amazon.com/images/I/71T4VDdxStL._SX679_.jpg', true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.products
  WHERE legacy_mongo_id = '31'
);

INSERT INTO public.products
  (id, legacy_mongo_id, name, description, price, category,
   stock_quantity, image_url, is_available, created_at, updated_at)
SELECT
  gen_random_uuid(), '32', 'Fevicol Glue Tube 15g', 'Fevicol â€“ India ka sabse famous glue.', 10,
  'glue', 100, 'https://m.media-amazon.com/images/I/61S8bLzQ6QL._SX679_.jpg', true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.products
  WHERE legacy_mongo_id = '32'
);

INSERT INTO public.products
  (id, legacy_mongo_id, name, description, price, category,
   stock_quantity, image_url, is_available, created_at, updated_at)
SELECT
  gen_random_uuid(), '33', 'Glue Stick 20g (3 Pack)', 'Mess-free glue stick. Kids ke liye best.', 30,
  'glue', 40, 'https://m.media-amazon.com/images/I/61P6IQYD39L._SX679_.jpg', true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.products
  WHERE legacy_mongo_id = '33'
);

INSERT INTO public.products
  (id, legacy_mongo_id, name, description, price, category,
   stock_quantity, image_url, is_available, created_at, updated_at)
SELECT
  gen_random_uuid(), '34', 'Fevikwik Instant Adhesive', 'Instant bonding adhesive for all surfaces.', 15,
  'glue', 50, 'https://m.media-amazon.com/images/I/61S8bLzQ6QL._SX679_.jpg', true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.products
  WHERE legacy_mongo_id = '34'
);

INSERT INTO public.products
  (id, legacy_mongo_id, name, description, price, category,
   stock_quantity, image_url, is_available, created_at, updated_at)
SELECT
  gen_random_uuid(), '35', 'Student Scissors 7 inch', 'Sharp stainless steel scissors for students.', 25,
  'scissors', 30, 'https://m.media-amazon.com/images/I/51Nw+bHH2nL._SX679_.jpg', true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.products
  WHERE legacy_mongo_id = '35'
);

INSERT INTO public.products
  (id, legacy_mongo_id, name, description, price, category,
   stock_quantity, image_url, is_available, created_at, updated_at)
SELECT
  gen_random_uuid(), '36', 'Craft Scissors Zigzag', 'Decorative zigzag scissors for craft.', 40,
  'scissors', 15, 'https://m.media-amazon.com/images/I/51KHGpP-kQL._SX679_.jpg', true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.products
  WHERE legacy_mongo_id = '36'
);

INSERT INTO public.products
  (id, legacy_mongo_id, name, description, price, category,
   stock_quantity, image_url, is_available, created_at, updated_at)
SELECT
  gen_random_uuid(), '37', 'School Bag 30L Waterproof', '30L waterproof school bag with multiple compartments.', 350,
  'bag', 12, 'https://m.media-amazon.com/images/I/61V3A03BKSL._SX679_.jpg', true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.products
  WHERE legacy_mongo_id = '37'
);

INSERT INTO public.products
  (id, legacy_mongo_id, name, description, price, category,
   stock_quantity, image_url, is_available, created_at, updated_at)
SELECT
  gen_random_uuid(), '38', 'Pencil Pouch Canvas Zipper', 'Durable canvas pencil pouch with multiple pockets.', 60,
  'bag', 25, 'https://m.media-amazon.com/images/I/61S9t3QnBxL._SX679_.jpg', true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.products
  WHERE legacy_mongo_id = '38'
);

INSERT INTO public.products
  (id, legacy_mongo_id, name, description, price, category,
   stock_quantity, image_url, is_available, created_at, updated_at)
SELECT
  gen_random_uuid(), '39', 'Water Bottle 750ml Steel', 'Insulated steel bottle for school. Keeps water cold 12hr.', 160,
  'bag', 20, 'https://m.media-amazon.com/images/I/61V3A03BKSL._SX679_.jpg', true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.products
  WHERE legacy_mongo_id = '39'
);

INSERT INTO public.products
  (id, legacy_mongo_id, name, description, price, category,
   stock_quantity, image_url, is_available, created_at, updated_at)
SELECT
  gen_random_uuid(), '49', 'Lunch Box Stainless Steel', 'Stainless steel leak-proof lunch box.', 180,
  'bag', 15, 'https://m.media-amazon.com/images/I/61V3A03BKSL._SX679_.jpg', true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.products
  WHERE legacy_mongo_id = '49'
);

INSERT INTO public.products
  (id, legacy_mongo_id, name, description, price, category,
   stock_quantity, image_url, is_available, created_at, updated_at)
SELECT
  gen_random_uuid(), '40', 'Plastic Pencil Box Multicolor', 'Hard plastic pencil box with double layer tray.', 45,
  'box', 30, 'https://m.media-amazon.com/images/I/51y0B+2H9xL._SX679_.jpg', true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.products
  WHERE legacy_mongo_id = '40'
);

INSERT INTO public.products
  (id, legacy_mongo_id, name, description, price, category,
   stock_quantity, image_url, is_available, created_at, updated_at)
SELECT
  gen_random_uuid(), '41', 'Desk Organizer 5-in-1', '5-in-1 desk organizer for pens, files, mobile.', 120,
  'box', 18, 'https://m.media-amazon.com/images/I/51y0B+2H9xL._SX679_.jpg', true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.products
  WHERE legacy_mongo_id = '41'
);

INSERT INTO public.products
  (id, legacy_mongo_id, name, description, price, category,
   stock_quantity, image_url, is_available, created_at, updated_at)
SELECT
  gen_random_uuid(), '42', 'Sticky Notes 3Ã—3 (5 Color Pads)', '5 color sticky note pads, 100 sheets each.', 35,
  'sticky', 40, 'https://m.media-amazon.com/images/I/71wDIoTJSnL._SX679_.jpg', true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.products
  WHERE legacy_mongo_id = '42'
);

INSERT INTO public.products
  (id, legacy_mongo_id, name, description, price, category,
   stock_quantity, image_url, is_available, created_at, updated_at)
SELECT
  gen_random_uuid(), '43', 'Scientific Calculator 12-Digit', '12-digit scientific calculator, board exam approved.', 150,
  'extra', 15, 'https://m.media-amazon.com/images/I/71SrxJaKJLL._SX679_.jpg', true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.products
  WHERE legacy_mongo_id = '43'
);

INSERT INTO public.products
  (id, legacy_mongo_id, name, description, price, category,
   stock_quantity, image_url, is_available, created_at, updated_at)
SELECT
  gen_random_uuid(), '44', 'Geometry Box Set 8 Pieces', '8-piece geometry set for maths exams.', 80,
  'extra', 20, 'https://m.media-amazon.com/images/I/61E1wkXU3ML._SX679_.jpg', true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.products
  WHERE legacy_mongo_id = '44'
);

INSERT INTO public.products
  (id, legacy_mongo_id, name, description, price, category,
   stock_quantity, image_url, is_available, created_at, updated_at)
SELECT
  gen_random_uuid(), '45', 'Ruler 30cm Transparent', '30cm transparent shatterproof ruler.', 10,
  'extra', 60, 'https://m.media-amazon.com/images/I/51o+K3j7ZiL._SX679_.jpg', true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.products
  WHERE legacy_mongo_id = '45'
);

INSERT INTO public.products
  (id, legacy_mongo_id, name, description, price, category,
   stock_quantity, image_url, is_available, created_at, updated_at)
SELECT
  gen_random_uuid(), '46', 'Metal Sharpener Double Hole', 'Double hole metal sharpener for regular aur jumbo pencils.', 8,
  'extra', 80, 'https://m.media-amazon.com/images/I/41Ni-jHXjnL.jpg', true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.products
  WHERE legacy_mongo_id = '46'
);

INSERT INTO public.products
  (id, legacy_mongo_id, name, description, price, category,
   stock_quantity, image_url, is_available, created_at, updated_at)
SELECT
  gen_random_uuid(), '47', 'Correction Pen / Whitener', 'Quick-dry whitener correction pen.', 15,
  'extra', 40, 'https://m.media-amazon.com/images/I/41WLr0cgpjL._SX679_.jpg', true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.products
  WHERE legacy_mongo_id = '47'
);

INSERT INTO public.products
  (id, legacy_mongo_id, name, description, price, category,
   stock_quantity, image_url, is_available, created_at, updated_at)
SELECT
  gen_random_uuid(), '1792401238113', 'writometer', 'The Flair Writo-Meter is a popular high-mileage writing instrument manufactured by Flair Pens', 25,
  'extra', 10, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSkAXpp5oYMZkCrS2-l0ypd2WJZBQRLOjDkD-V2UxzyLg&s=10', true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.products
  WHERE legacy_mongo_id = '1792401238113'
);