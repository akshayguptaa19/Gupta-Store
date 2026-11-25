
INSERT INTO public.orders
  (legacy_mongo_id, order_id, status, payment, payment_status,
   total, order_data, created_at, updated_at)
SELECT
  '6aafc70e9757bca8b1b9be11',
  'GGS-MU9R0HQ1',
  'placed',
  'cod',
  'pending',
  50,
  '{"_id":"6aafc70e9757bca8b1b9be11","orderId":"GGS-MU9R0HQ1","items":[{"id":6,"name":"Natraj HB Pencil (12 Pack)","price":30,"mrp":40,"category":"pencil","emoji":"✏️","badge":"Best Value","rating":4.6,"reviews":3201,"stock":40,"image":"https://m.media-amazon.com/images/I/71uAFHdYoEL._SX679_.jpg","tags":["pencil","hb","natraj","pack","school"],"desc":"Natraj HB pencils. School exams ke liye best.","features":["12 pencils","HB grade","Strong lead","Easy sharpening"],"qty":1}],"address":{"name":"Akshay Gupta","phone":"8107615285","area":"JULANIYA MOHALLA BAKANI","pincode":"326022","note":""},"payment":"cod","paymentStatus":"pending","coupon":"","sub":30,"delivery":20,"discount":0,"discountPct":0,"total":50,"id":"GGS-MU9R0HQ1","createdAt":"2026-09-20T11:44:14.372Z","updatedAt":"2026-09-20T11:44:14.372Z","status":"placed","tracking":[{"status":"placed","time":"2026-09-20T11:44:14.372Z","note":"Order placed successfully"}],"gateway":{"status":"pending"}}'::jsonb,
  '2026-09-20T11:44:14.372Z'::timestamptz,
  '2026-09-20T11:44:14.372Z'::timestamptz
WHERE NOT EXISTS (
  SELECT 1 FROM public.orders
  WHERE legacy_mongo_id = '6aafc70e9757bca8b1b9be11'
     OR order_id = 'GGS-MU9R0HQ1'
);

INSERT INTO public.orders
  (legacy_mongo_id, order_id, status, payment, payment_status,
   total, order_data, created_at, updated_at)
SELECT
  '6ab001c8db0bfbebc57effdc',
  'GGS-MU9ZYQX9',
  'placed',
  'cod',
  'pending',
  70,
  '{"_id":"6ab001c8db0bfbebc57effdc","orderId":"GGS-MU9ZYQX9","items":[{"id":1,"name":"Cello Blue Ball Pen","price":5,"mrp":7,"category":"pen","emoji":"🖊️","badge":"Best Seller","rating":4.5,"reviews":2341,"stock":50,"image":"https://m.media-amazon.com/images/I/61xuKVpWf9L._SX679_.jpg","tags":["pen","ball pen","cello","blue"],"desc":"Cello ki smooth writing ball pen. Student aur office dono ke liye perfect.","features":["Smooth ink flow","Comfortable grip","1500m ink","Daily writing"],"qty":3},{"id":4,"name":"Sketch Pens 12 Colors","price":35,"mrp":50,"category":"pen","emoji":"🖍️","badge":"Kids Fav","rating":4.5,"reviews":1200,"stock":40,"image":"https://m.media-amazon.com/images/I/71kPJcXKijL._SX679_.jpg","tags":["sketch pen","color pen","art","kids"],"desc":"12 vibrant sketch pens. Art class ke liye.","features":["12 colors","Non-toxic","Fine tip","Washable"],"qty":1}],"address":{"name":"Akshay Gupta","phone":"8107615285","area":"JULANIYA MOHALLA BAKANI","pincode":"326022","note":""},"payment":"cod","paymentStatus":"pending","coupon":"","sub":50,"delivery":20,"discount":0,"discountPct":0,"total":70,"id":"GGS-MU9ZYQX9","createdAt":"2026-09-20T15:54:48.374Z","updatedAt":"2026-09-20T15:54:48.374Z","status":"placed","tracking":[{"status":"placed","time":"2026-09-20T15:54:48.374Z","note":"Order placed successfully"}],"gateway":{"status":"pending"}}'::jsonb,
  '2026-09-20T15:54:48.374Z'::timestamptz,
  '2026-09-20T15:54:48.374Z'::timestamptz
WHERE NOT EXISTS (
  SELECT 1 FROM public.orders
  WHERE legacy_mongo_id = '6ab001c8db0bfbebc57effdc'
     OR order_id = 'GGS-MU9ZYQX9'
);

INSERT INTO public.orders
  (legacy_mongo_id, order_id, status, payment, payment_status,
   total, order_data, created_at, updated_at)
SELECT
  '6ab3d235288c9c0153feee8a',
  'GGS-MUE4SG75',
  'placed',
  'cod',
  'pending',
  85,
  '{"_id":"6ab3d235288c9c0153feee8a","orderId":"GGS-MUE4SG75","items":[{"id":1,"name":"Cello Blue Ball Pen","price":5,"mrp":7,"category":"pen","emoji":"🖊️","badge":"Best Seller","rating":4.5,"reviews":2341,"stock":50,"image":"https://m.media-amazon.com/images/I/61xuKVpWf9L._SX679_.jpg","tags":["pen","ball pen","cello","blue"],"desc":"Cello ki smooth writing ball pen. Student aur office dono ke liye perfect.","features":["Smooth ink flow","Comfortable grip","1500m ink","Daily writing"],"qty":21}],"address":{"name":"Akshay Gupta","phone":"8107615285","area":"JULANIYA MOHALLA BAKANI","pincode":"326022","note":""},"payment":"cod","paymentStatus":"pending","coupon":"SAVE20","sub":105,"delivery":0,"discount":20,"discountPct":20,"total":85,"id":"GGS-MUE4SG75","createdAt":"2026-09-23T13:20:53.576Z","updatedAt":"2026-09-23T13:20:53.576Z","status":"placed","tracking":[{"status":"placed","time":"2026-09-23T13:20:53.576Z","note":"Order placed successfully"}],"gateway":{"status":"pending"}}'::jsonb,
  '2026-09-23T13:20:53.576Z'::timestamptz,
  '2026-09-23T13:20:53.576Z'::timestamptz
WHERE NOT EXISTS (
  SELECT 1 FROM public.orders
  WHERE legacy_mongo_id = '6ab3d235288c9c0153feee8a'
     OR order_id = 'GGS-MUE4SG75'
);

INSERT INTO public.orders
  (legacy_mongo_id, order_id, status, payment, payment_status,
   total, order_data, created_at, updated_at)
SELECT
  '6ab3d447288c9c0153feee8b',
  'GGS-MUE53TBU',
  'placed',
  'cod',
  'pending',
  250,
  '{"_id":"6ab3d447288c9c0153feee8b","orderId":"GGS-MUE53TBU","items":[{"id":1,"name":"Cello Blue Ball Pen","price":5,"mrp":7,"category":"pen","emoji":"🖊️","badge":"Best Seller","rating":4.5,"reviews":2341,"stock":50,"image":"https://m.media-amazon.com/images/I/61xuKVpWf9L._SX679_.jpg","tags":["pen","ball pen","cello","blue"],"desc":"Cello ki smooth writing ball pen. Student aur office dono ke liye perfect.","features":["Smooth ink flow","Comfortable grip","1500m ink","Daily writing"],"qty":50}],"address":{"name":"Akshay Gupta","phone":"8107615285","area":"JULANIYA MOHALLA BAKANI","pincode":"326022","note":""},"payment":"cod","paymentStatus":"pending","coupon":"","sub":250,"delivery":0,"discount":0,"discountPct":0,"total":250,"id":"GGS-MUE53TBU","createdAt":"2026-09-23T13:29:43.715Z","updatedAt":"2026-09-23T13:29:43.715Z","status":"placed","tracking":[{"status":"placed","time":"2026-09-23T13:29:43.715Z","note":"Order placed successfully"}],"gateway":{"status":"pending"}}'::jsonb,
  '2026-09-23T13:29:43.715Z'::timestamptz,
  '2026-09-23T13:29:43.715Z'::timestamptz
WHERE NOT EXISTS (
  SELECT 1 FROM public.orders
  WHERE legacy_mongo_id = '6ab3d447288c9c0153feee8b'
     OR order_id = 'GGS-MUE53TBU'
);

INSERT INTO public.orders
  (legacy_mongo_id, order_id, status, payment, payment_status,
   total, order_data, created_at, updated_at)
SELECT
  '6ab68444fa7901dca6410254',
  'GGS-MUH1YS3M',
  'placed',
  'cod',
  'pending',
  36,
  '{"_id":"6ab68444fa7901dca6410254","orderId":"GGS-MUH1YS3M","items":[{"id":1,"name":"Cello Blue Ball Pen","price":6,"mrp":7,"category":"pen","emoji":"🖊️","badge":"20% OFF","rating":4.5,"reviews":2341,"stock":50,"image":"https://m.media-amazon.com/images/I/61xuKVpWf9L._SX679_.jpg","tags":["pen","ball pen","cello","blue"],"desc":"Cello ki smooth writing ball pen. Student aur office dono ke liye perfect.","features":["Smooth ink flow","Comfortable grip","1500m ink","Daily writing"],"qty":1},{"id":2,"name":"Reynolds Black Gel Pen","price":10,"mrp":15,"category":"pen","emoji":"🖊️","badge":"Popular","rating":4.4,"reviews":1876,"stock":35,"image":"https://m.media-amazon.com/images/I/41D+yV5pX4L._SX300_SY300_QL70_FMwebp_.jpg","tags":["pen","gel pen","reynolds","black"],"desc":"Reynolds ki premium gel pen. Smooth writing, no smearing.","features":["Waterproof gel ink","No smearing","0.5mm tip","Exam friendly"],"qty":1}],"address":{"name":"Sunil Sharma","phone":"9876543210","area":"Station Road, Bakani","pincode":"","note":""},"customerEmail":"akshayguptaa19@gmail.com","payment":"cod","paymentStatus":"pending","coupon":"","expectedDelivery":{"isoDate":"2026-09-26T14:24:42.858Z","dateLabel":"26 Sept","weekday":"Saturday","speedLabel":"Next-day delivery","promise":"Kal 9 PM tak"},"sub":16,"delivery":20,"discount":0,"discountPct":0,"total":36,"id":"GGS-MUH1YS3M","createdAt":"2026-09-25T14:25:08.258Z","updatedAt":"2026-09-25T14:25:08.258Z","status":"placed","tracking":[{"status":"placed","time":"2026-09-25T14:25:08.258Z","note":"Order placed successfully"}],"gateway":{"status":"pending"},"statusNotificationSent":{"placed":"2026-09-25T14:25:14.543Z"}}'::jsonb,
  '2026-09-25T14:25:08.258Z'::timestamptz,
  '2026-09-25T14:25:08.258Z'::timestamptz
WHERE NOT EXISTS (
  SELECT 1 FROM public.orders
  WHERE legacy_mongo_id = '6ab68444fa7901dca6410254'
     OR order_id = 'GGS-MUH1YS3M'
);

INSERT INTO public.orders
  (legacy_mongo_id, order_id, status, payment, payment_status,
   total, order_data, created_at, updated_at)
SELECT
  '6ab6a22b82924a511ac53ea5',
  'GGS-MUH6IV5R',
  'delivered',
  'cod',
  'pending',
  65,
  '{"_id":"6ab6a22b82924a511ac53ea5","orderId":"GGS-MUH6IV5R","items":[{"id":5,"name":"Ink Fountain Pen","price":45,"mrp":60,"category":"pen","emoji":"✒️","badge":"Premium","rating":4.3,"reviews":432,"stock":15,"image":"https://m.media-amazon.com/images/I/51Mh8tX8VPL._SX679_.jpg","tags":["fountain pen","calligraphy","premium"],"desc":"Classic fountain pen for calligraphy aur formal writing.","features":["Refillable cartridge","Smooth nib","Classic design","All sizes"],"qty":1}],"address":{"name":"Akshay Gupta","phone":"8107615285","area":"Julaniya mohalla bakani ","pincode":"","note":""},"customerEmail":"","payment":"cod","paymentStatus":"pending","coupon":"","expectedDelivery":{"isoDate":"2026-09-26T16:32:42.100Z","dateLabel":"26 Sept","weekday":"Saturday","speedLabel":"Next-day delivery","promise":"Kal 9 PM tak"},"sub":45,"delivery":20,"discount":0,"discountPct":0,"total":65,"id":"GGS-MUH6IV5R","createdAt":"2026-09-25T16:32:43.342Z","updatedAt":"2026-10-26T20:39:42.244Z","status":"delivered","tracking":[{"status":"placed","time":"2026-09-25T16:32:43.342Z","note":"Order placed successfully"},{"status":"confirmed","time":"2026-10-26T20:38:14.960Z","note":"Status updated to confirmed"},{"status":"out_for_delivery","time":"2026-10-26T20:38:39.625Z","note":"Status updated to out_for_delivery"},{"status":"delivered","time":"2026-10-26T20:39:42.063Z","note":"Status updated to delivered"}],"gateway":{"status":"pending"}}'::jsonb,
  '2026-09-25T16:32:43.342Z'::timestamptz,
  '2026-10-26T20:39:42.244Z'::timestamptz
WHERE NOT EXISTS (
  SELECT 1 FROM public.orders
  WHERE legacy_mongo_id = '6ab6a22b82924a511ac53ea5'
     OR order_id = 'GGS-MUH6IV5R'
);